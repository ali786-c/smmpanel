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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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
                $q->where('link', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('id', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('external_order_id', 'LIKE', '%' . $request->search . '%')
                    ->orWhereHas('service', fn($sq) => $sq->where('name', 'LIKE', '%' . $request->search . '%'));
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
            $response = Http::timeout(15)->asForm()->post($providerUrl, [
                'key'      => $providerKey,
                'action'   => 'add',
                'service'  => $service->external_service_id,
                'link'     => $order->link,
                'quantity' => $order->quantity,
            ]);

            $data = $response->json() ?? [];
            if (isset($data['order'])) {
                $order->update([
                    'external_order_id'  => $data['order'],
                    'provider_order_id'  => (string) $data['order'],
                    'status'             => 'In progress',
                    'notes'              => null,
                ]);
            } elseif (isset($data['error'])) {
                $order->update([
                    'notes' => '[Provider Error] ' . $data['error']
                ]);
                Log::warning('Provider order returned error', ['order_id' => $order->id, 'error' => $data['error']]);
            }
        } catch (\Exception $e) {
            Log::error('Provider order failed', ['order_id' => $order->id, 'error' => $e->getMessage()]);
            $order->update(['notes' => '[Provider Error] Connection failed']);
        }
    }

    public function analytics(Request $request)
    {
        $user = auth()->user();

        $orders = Order::where('user_id', $user->id)
            ->selectRaw("DATE(created_at) as date, COUNT(*) as order_count, SUM(cost) as total_spent")
            ->where('created_at', '>=', now()->subDays(30))
            ->groupByRaw("DATE(created_at)")
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

    public function massStore(Request $request)
    {
        $request->validate([
            'orders'              => 'required|array|min:1|max:50',
            'orders.*.service_id' => 'required|uuid|exists:services,id',
            'orders.*.link'       => 'required|string|max:2000',
            'orders.*.quantity'   => 'required|integer|min:1',
        ]);

        $user = auth()->user();
        if ($user->isBanned()) {
            return response()->json(['error' => 'Account suspended'], 403);
        }

        $wallet = Wallet::where('user_id', $user->id)->first();

        // Pre-calculate total cost to check balance upfront
        $totalCost = 0;
        $orderItems = [];
        foreach ($request->orders as $index => $item) {
            $service = Service::active()->find($item['service_id']);
            if (!$service) {
                return response()->json(['error' => "Order #".($index+1).": service not found"], 422);
            }
            if ($item['quantity'] < $service->min_order || $item['quantity'] > $service->max_order) {
                return response()->json([
                    'error' => "Order #".($index+1).": quantity must be between {$service->min_order} and {$service->max_order}",
                ], 422);
            }
            $cost = round(($service->rate / 1000) * $item['quantity'], 4);
            $totalCost += $cost;
            $orderItems[] = ['service' => $service, 'link' => $item['link'], 'quantity' => $item['quantity'], 'cost' => $cost];
        }

        if (!$wallet || $wallet->balance < $totalCost) {
            return response()->json(['error' => 'Insufficient balance for all orders. Required: $'.number_format($totalCost,4)], 402);
        }

        $results = [];
        $providerKey = config('services.provider.api_key');
        $providerUrl = config('services.provider.url', 'https://justanotherpanel.com/api/v2');

        DB::beginTransaction();
        try {
            foreach ($orderItems as $item) {
                $service      = $item['service'];
                $cost         = $item['cost'];
                $providerCost = round($cost * 0.7, 4);
                $orderId      = (string) Str::uuid();

                $wallet->decrement('balance', $cost);

                // Call provider
                $providerRes = Http::timeout(15)->post($providerUrl, [
                    'key'      => $providerKey,
                    'action'   => 'add',
                    'service'  => $service->external_service_id,
                    'link'     => $item['link'],
                    'quantity' => $item['quantity'],
                ]);

                $providerData    = $providerRes->json() ?? [];
                $providerOrderId = $providerData['order'] ?? null;
                $providerError   = $providerData['error'] ?? null;
                $notes           = $providerError ? '[Provider Error] ' . $providerError : null;

                $order = Order::create([
                    'id'                => $orderId,
                    'user_id'           => $user->id,
                    'service_id'        => $service->id,
                    'link'              => $item['link'],
                    'quantity'          => $item['quantity'],
                    'cost'              => $cost,
                    'provider_cost'     => $providerCost,
                    'status'            => $providerOrderId ? 'In progress' : 'Pending',
                    'external_order_id' => $providerOrderId,
                    'notes'             => $notes,
                ]);

                WalletTransaction::create([
                    'id'             => (string) Str::uuid(),
                    'user_id'        => $user->id,
                    'type'           => 'order',
                    'amount'         => -$cost,
                    'description'    => "Order #{$orderId} - {$service->name}",
                    'reference_id'   => $orderId,
                    'status'         => 'completed',
                    'payment_method' => 'wallet',
                    'created_at'     => now(),
                ]);

                $results[] = [
                    'id'               => $orderId,
                    'service'          => $service->name,
                    'status'           => $order->status,
                    'cost'             => $cost,
                    'provider_order_id'=> $providerOrderId,
                ];
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'placed'  => count($results),
                'total_cost' => $totalCost,
                'orders'  => $results,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Mass order failed: ' . $e->getMessage());
            return response()->json(['error' => 'Mass order failed. Please try again.'], 500);
        }
    }
}
