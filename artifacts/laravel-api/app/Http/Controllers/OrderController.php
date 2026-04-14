<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Service;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Order::where('user_id', $user->id)
            ->with(['service:id,name,category,platform'])
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('link', 'ilike', '%' . $request->search . '%')
                    ->orWhereHas('service', fn($sq) => $sq->where('name', 'ilike', '%' . $request->search . '%'));
            });
        }

        $orders = $query->paginate($request->get('per_page', 20));
        return response()->json($orders);
    }

    public function show($id)
    {
        $user = auth()->user();
        $order = Order::where('user_id', $user->id)
            ->with(['service', 'coupon'])
            ->findOrFail($id);
        return response()->json($order);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id' => 'required|uuid|exists:services,id',
            'link' => 'required|string|max:2000',
            'quantity' => 'required|integer|min:1',
            'coupon_code' => 'nullable|string',
        ]);

        $user = auth()->user();

        if ($user->isBanned()) {
            return response()->json(['error' => 'Account suspended'], 403);
        }

        $service = Service::active()->findOrFail($validated['service_id']);

        if ($validated['quantity'] < $service->min_order || $validated['quantity'] > $service->max_order) {
            return response()->json([
                'error' => "Quantity must be between {$service->min_order} and {$service->max_order}",
            ], 422);
        }

        $cost = round(($service->rate / 1000) * $validated['quantity'], 4);
        $providerCost = round($cost * 0.7, 4);

        $coupon = null;
        $couponId = null;
        if (!empty($validated['coupon_code'])) {
            $coupon = Coupon::where('code', $validated['coupon_code'])->first();
            if ($coupon && $coupon->isValid($cost)) {
                $discount = $coupon->calculateDiscount($cost);
                $cost = max(0, $cost - $discount);
                $couponId = $coupon->id;
            } else {
                return response()->json(['error' => 'Invalid or expired coupon'], 422);
            }
        }

        $wallet = Wallet::where('user_id', $user->id)->first();
        if (!$wallet || $wallet->balance < $cost) {
            return response()->json(['error' => 'Insufficient balance'], 402);
        }

        DB::beginTransaction();
        try {
            $orderId = (string) Str::uuid();

            // Deduct from wallet
            $wallet->decrement('balance', $cost);
            $wallet->touch();

            // Create order
            $order = Order::create([
                'id' => $orderId,
                'user_id' => $user->id,
                'service_id' => $service->id,
                'link' => $validated['link'],
                'quantity' => $validated['quantity'],
                'cost' => $cost,
                'provider_cost' => $providerCost,
                'status' => 'Pending',
                'coupon_id' => $couponId,
            ]);

            // Log wallet transaction
            WalletTransaction::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'type' => 'order',
                'amount' => -$cost,
                'description' => "Order #{$orderId} - {$service->name}",
                'reference_id' => $orderId,
                'status' => 'completed',
                'payment_method' => 'wallet',
                'created_at' => now(),
            ]);

            // Update coupon usage
            if ($coupon) {
                $coupon->increment('used_count');
            }

            // Send to provider in background (non-blocking)
            $this->sendToProvider($order, $service);

            // Process referral commission via DB trigger would handle this
            // Create notification
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'title' => 'Order Placed',
                'message' => "Your order for {$service->name} has been placed successfully.",
                'type' => 'success',
                'link' => "/dashboard/orders/{$orderId}",
                'created_at' => now(),
            ]);

            DB::commit();
            return response()->json($order->load('service'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Order failed: ' . $e->getMessage()], 500);
        }
    }

    private function sendToProvider(Order $order, Service $service): void
    {
        $providerUrl = config('services.provider.api_url');
        $providerKey = config('services.provider.api_key');

        if (!$providerUrl || !$providerKey) {
            return;
        }

        try {
            $response = \Http::post($providerUrl, [
                'key' => $providerKey,
                'action' => 'add',
                'service' => $service->external_service_id,
                'link' => $order->link,
                'quantity' => $order->quantity,
            ]);

            $data = $response->json();
            if (isset($data['order'])) {
                $order->update([
                    'external_order_id' => $data['order'],
                    'status' => 'Processing',
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Provider order failed', ['order_id' => $order->id, 'error' => $e->getMessage()]);
        }
    }

    public function analytics(Request $request)
    {
        $user = auth()->user();

        $orders = Order::where('user_id', $user->id)
            ->selectRaw("DATE_TRUNC('day', created_at) as date, COUNT(*) as order_count, SUM(cost) as total_spent")
            ->where('created_at', '>=', now()->subDays(30))
            ->groupByRaw("DATE_TRUNC('day', created_at)")
            ->orderBy('date')
            ->get();

        $byStatus = Order::where('user_id', $user->id)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        $byPlatform = Order::where('user_id', $user->id)
            ->join('services', 'orders.service_id', '=', 'services.id')
            ->selectRaw('services.platform, COUNT(*) as count, SUM(orders.cost) as total_spent')
            ->groupBy('services.platform')
            ->orderByDesc('count')
            ->get();

        $totalSpent = Order::where('user_id', $user->id)->sum('cost');
        $totalOrders = Order::where('user_id', $user->id)->count();

        return response()->json([
            'daily' => $orders,
            'by_status' => $byStatus,
            'by_platform' => $byPlatform,
            'total_spent' => $totalSpent,
            'total_orders' => $totalOrders,
        ]);
    }
}
