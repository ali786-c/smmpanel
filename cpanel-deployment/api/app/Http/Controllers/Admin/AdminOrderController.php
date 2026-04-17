<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Profile;
use App\Models\RefundLog;
use App\Models\Service;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['user:id,email', 'user.profile:user_id,display_name', 'service:id,name,category,platform'])
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('link', 'like', '%' . $request->search . '%')
                    ->orWhereHas('user', fn($uq) => $uq->where('email', 'like', '%' . $request->search . '%'));
            });
        }
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        return response()->json($query->paginate($request->get('per_page', 25)));
    }

    public function show($id)
    {
        $order = Order::with(['user.profile', 'service', 'coupon'])->findOrFail($id);
        return response()->json($order);
    }

    public function update(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $validated = $request->validate([
            'status' => 'nullable|in:Pending,Processing,In progress,Completed,Partial,Cancelled,Refunded',
            'start_count' => 'nullable|integer',
            'remains' => 'nullable|integer',
            'external_order_id' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        $order->update(array_filter($validated, fn($v) => $v !== null));
        return response()->json($order);
    }

    public function refund(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'reason' => 'nullable|string',
        ]);

        $refundAmount = $validated['amount'] ?? $order->cost;

        DB::beginTransaction();
        try {
            Wallet::where('user_id', $order->user_id)->increment('balance', $refundAmount);

            WalletTransaction::create([
                'user_id' => $order->user_id,
                'type' => 'refund',
                'amount' => $refundAmount,
                'description' => 'Refund for order #' . $order->id . ($validated['reason'] ? ': ' . $validated['reason'] : ''),
                'reference_id' => $order->id,
                'status' => 'completed',
                'payment_method' => 'system',
                'created_at' => now(),
            ]);

            RefundLog::create([
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'amount' => $refundAmount,
                'reason' => $validated['reason'] ?? 'Admin refund',
                'status' => 'completed',
                'created_at' => now(),
            ]);

            $order->update(['status' => 'Refunded']);

            Notification::create([
                'user_id' => $order->user_id,
                'title' => 'Refund Processed',
                'message' => "\${$refundAmount} has been refunded to your wallet.",
                'type' => 'success',
                'link' => '/dashboard/wallet',
                'created_at' => now(),
            ]);

            DB::commit();
            return response()->json(['message' => 'Refund processed', 'amount' => $refundAmount]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function createManualOrder(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'service_id' => 'required|uuid|exists:services,id',
            'link' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'cost' => 'nullable|numeric',
            'charge_wallet' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $service = Service::findOrFail($validated['service_id']);
        $cost = $validated['cost'] ?? round(($service->rate / 1000) * $validated['quantity'], 4);

        DB::beginTransaction();
        try {
            if (!empty($validated['charge_wallet'])) {
                $wallet = Wallet::where('user_id', $validated['user_id'])->first();
                if (!$wallet || $wallet->balance < $cost) {
                    return response()->json(['error' => 'Insufficient user balance'], 402);
                }
                $wallet->decrement('balance', $cost);

                WalletTransaction::create([
                    'user_id' => $validated['user_id'],
                    'type' => 'order',
                    'amount' => -$cost,
                    'description' => 'Manual order by admin',
                    'status' => 'completed',
                    'payment_method' => 'admin',
                    'created_at' => now(),
                ]);
            }

            $order = Order::create([
                'user_id' => $validated['user_id'],
                'service_id' => $service->id,
                'link' => $validated['link'],
                'quantity' => $validated['quantity'],
                'cost' => $cost,
                'provider_cost' => round($cost * 0.7, 4),
                'status' => 'Pending',
                'notes' => $validated['notes'] ?? 'Admin manual order',
            ]);

            DB::commit();
            return response()->json($order, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function syncStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $providerUrl = config('services.provider.api_url');
        $providerKey = config('services.provider.api_key');

        if (!$providerUrl || !$providerKey || !$order->external_order_id) {
            return response()->json(['error' => 'Provider not configured or no external order ID'], 422);
        }

        try {
            $response = Http::post($providerUrl, [
                'key' => $providerKey,
                'action' => 'status',
                'order' => $order->external_order_id,
            ]);

            $data = $response->json();

            $order->update([
                'status' => $data['status'] ?? $order->status,
                'start_count' => $data['start_count'] ?? $order->start_count,
                'remains' => $data['remains'] ?? $order->remains,
            ]);

            return response()->json(['order' => $order->fresh(), 'provider_response' => $data]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function bulkSyncStatus(Request $request)
    {
        $providerUrl = config('services.provider.api_url');
        $providerKey = config('services.provider.api_key');

        if (!$providerUrl || !$providerKey) {
            return response()->json(['error' => 'Provider not configured'], 422);
        }

        $activeOrders = Order::whereIn('status', ['Pending', 'Processing', 'In progress'])
            ->whereNotNull('external_order_id')
            ->take(100)
            ->get();

        $updated = 0;
        $refunded = 0;

        foreach ($activeOrders as $order) {
            try {
                $response = Http::post($providerUrl, [
                    'key' => $providerKey,
                    'action' => 'status',
                    'order' => $order->external_order_id,
                ]);

                $data = $response->json();
                if (isset($data['status'])) {
                    $order->update([
                        'status' => $data['status'],
                        'start_count' => $data['start_count'] ?? $order->start_count,
                        'remains' => $data['remains'] ?? $order->remains,
                    ]);
                    $updated++;

                    // Auto-refund partial orders
                    if ($data['status'] === 'Partial' && isset($data['remains']) && $data['remains'] > 0) {
                        $refundAmount = round(($order->cost / $order->quantity) * $data['remains'], 4);
                        if ($refundAmount > 0) {
                            Wallet::where('user_id', $order->user_id)->increment('balance', $refundAmount);
                            WalletTransaction::create([
                                'user_id' => $order->user_id,
                                'type' => 'refund',
                                'amount' => $refundAmount,
                                'description' => "Auto-refund for partial order {$order->id}",
                                'reference_id' => $order->id,
                                'status' => 'completed',
                                'payment_method' => 'system',
                                'created_at' => now(),
                            ]);
                            $refunded++;
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::error('Order sync failed', ['order_id' => $order->id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'checked' => $activeOrders->count(),
            'updated' => $updated,
            'refunded' => $refunded,
        ]);
    }

    public function revenueExport(Request $request)
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $query = Order::with(['user:id,email', 'service:id,name,platform'])
            ->orderByDesc('created_at');

        if (!empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }
        if (!empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $orders = $query->get();

        $summary = [
            'total_orders' => $orders->count(),
            'total_revenue' => $orders->sum('cost'),
            'total_provider_cost' => $orders->sum('provider_cost'),
            'gross_profit' => $orders->sum('cost') - $orders->sum('provider_cost'),
            'by_platform' => $orders->groupBy('service.platform')->map(fn($g) => [
                'count' => $g->count(),
                'revenue' => $g->sum('cost'),
            ]),
            'by_status' => $orders->groupBy('status')->map(fn($g) => ['count' => $g->count(), 'revenue' => $g->sum('cost')]),
        ];

        return response()->json(['summary' => $summary, 'orders' => $orders->take(1000)]);
    }
}
