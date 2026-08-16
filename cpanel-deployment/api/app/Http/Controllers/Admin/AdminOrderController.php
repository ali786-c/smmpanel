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
            if ($request->status === 'stuck') {
                $query->whereIn('status', ['Pending', 'Processing', 'In progress'])
                      ->where('created_at', '<=', now()->subDays(3));
            } else {
                $query->where('status', $request->status);
            }
        }
        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('link', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('id', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('external_order_id', 'LIKE', '%' . $request->search . '%')
                    ->orWhereHas('user', fn($uq) => $uq->where('email', 'LIKE', '%' . $request->search . '%'));
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

        $summaryQuery = (clone $query)->reorder();
        $totalRevenue = (clone $summaryQuery)->whereNotIn('status', ['Cancelled', 'Refunded'])->sum('cost');
        $totalProfit = (clone $summaryQuery)->whereNotIn('status', ['Cancelled', 'Refunded'])->sum(DB::raw('cost - COALESCE(provider_cost, 0)'));

        $orders = $query->paginate($request->get('per_page', 30));

        return response()->json(array_merge($orders->toArray(), [
            'total_revenue' => (float) $totalRevenue,
            'total_profit' => (float) $totalProfit,
        ]));
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
        
        if (strtolower($order->status) === 'refunded') {
            return response()->json(['error' => 'Order is already refunded.'], 400);
        }

        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'reason' => 'nullable|string',
        ]);

        $refundAmount = $validated['amount'] ?? null;
        if ($refundAmount === null) {
            $refundAmount = round($order->cost * 0.3, 4);
        }


        DB::beginTransaction();
        try {
            Wallet::where('user_id', $order->user_id)->increment('balance', $refundAmount);

            WalletTransaction::create([
                'id' => (string) Str::uuid(),
                'user_id' => $order->user_id,
                'type' => 'refund',
                'amount' => $refundAmount,
                'description' => 'Refund for order #' . $order->id . (!empty($validated['reason']) ? ': ' . $validated['reason'] : ''),
                'reference_id' => $order->id,
                'status' => 'completed',
                'payment_method' => 'system',
                'created_at' => now(),
            ]);

            RefundLog::create([
                'id' => (string) Str::uuid(),
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'amount' => $refundAmount,
                'reason' => $validated['reason'] ?? 'Admin refund',
                'status' => 'completed',
                'created_at' => now(),
            ]);

            $order->update(['status' => 'Refunded']);

            Notification::create([
                'id' => (string) Str::uuid(),
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
        $cost = $validated['cost'] ?? $service->calculateCost($validated['quantity']);

        DB::beginTransaction();
        try {
            if (!empty($validated['charge_wallet'])) {
                $wallet = Wallet::where('user_id', $validated['user_id'])->first();
                if (!$wallet || $wallet->balance < $cost) {
                    return response()->json(['error' => 'Insufficient user balance'], 402);
                }
                $wallet->decrement('balance', $cost);

                WalletTransaction::create([
                    'id' => (string) Str::uuid(),
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
                'id' => (string) Str::uuid(),
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

            $data = $response->json() ?? [];

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
        $orderIds = $request->input('order_ids');

        if (!$providerUrl || !$providerKey) {
            return response()->json(['error' => 'Provider not configured'], 422);
        }

        $query = Order::whereNotNull('external_order_id');
        
        if (is_array($orderIds) && count($orderIds) > 0) {
            $query->whereIn('id', $orderIds);
        } else {
            $query->whereIn('status', ['Pending', 'Processing', 'In progress'])
                  ->take(100);
        }

        $activeOrders = $query->get();

        $updated = 0;
        $refunded = 0;

        foreach ($activeOrders as $order) {
            try {
                $response = Http::post($providerUrl, [
                    'key' => $providerKey,
                    'action' => 'status',
                    'order' => $order->external_order_id,
                ]);

                $data = $response->json() ?? [];
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
                                'id' => (string) Str::uuid(),
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
    public function retryProvider(Request $request, $id)
    {
        $order = Order::with('service')->findOrFail($id);
        
        if ($order->external_order_id) {
            return response()->json(['error' => 'Order already has an external provider ID.'], 400);
        }

        $providerUrl = config('services.provider.api_url');
        $providerKey = config('services.provider.api_key');

        if (!$providerUrl || !$providerKey) {
            return response()->json(['error' => 'Provider not configured'], 422);
        }

        try {
            $response = Http::timeout(15)->asForm()->post($providerUrl, [
                'key'      => $providerKey,
                'action'   => 'add',
                'service'  => $order->service->external_service_id,
                'link'     => $order->link,
                'quantity' => $order->quantity,
            ]);

            $data = $response->json() ?? [];
            
            if (isset($data['order'])) {
                $order->update([
                    'external_order_id'  => $data['order'],
                    'provider_order_id'  => (string) $data['order'],
                    'status'             => 'In progress',
                    'notes'              => null, // clear previous errors
                ]);
                return response()->json(['message' => 'Order successfully sent to provider', 'order' => $order->fresh()]);
            } else {
                $errorMsg = $data['error'] ?? 'Unknown provider error';
                $order->update(['notes' => '[Provider Error] ' . $errorMsg]);
                return response()->json(['error' => $errorMsg], 422);
            }
        } catch (\Exception $e) {
            $order->update(['notes' => '[Provider Error] Connection failed']);
            return response()->json(['error' => 'Connection to provider failed'], 500);
        }
    }
}
