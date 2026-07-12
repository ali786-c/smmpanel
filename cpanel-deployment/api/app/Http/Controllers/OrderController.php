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
            'link' => 'nullable|string|max:2000',
            'quantity' => 'nullable|integer',
            'comments' => 'nullable|string',
            'coupon_code' => 'nullable|string',
            'custom_data' => 'nullable|array',
        ]);

        $user = auth()->user();

        if ($user->isBanned()) {
            return response()->json(['error' => 'Account suspended'], 403);
        }

        $service = Service::active()->findOrFail($validated['service_id']);
        $type = $service->type;
        $customData = $request->input('custom_data', []);

        if ($type === 'Subscriptions') {
            if (empty($customData['username'])) {
                return response()->json(['error' => 'Username is required for subscriptions'], 422);
            }
            if (empty($customData['min']) || empty($customData['max']) || empty($customData['posts'])) {
                return response()->json(['error' => 'Min, Max, and Posts count are required for subscriptions'], 422);
            }
            
            $validated['link'] = $customData['username'];
            $validated['quantity'] = 1; // Default for subscriptions list row

            // subscription cost: max * posts * rate / 1000
            $cost = round((($customData['max'] * $customData['posts']) * $service->rate) / 1000, 4);
        } else {
            if (empty($validated['link'])) {
                return response()->json(['error' => 'Link is required'], 422);
            }

            if ($type === 'Custom Comments' || $type === 'Comment Replies' || strpos($type, 'Comments') !== false) {
                if (empty($validated['comments'])) {
                    return response()->json(['error' => 'Comments are required'], 422);
                }
                $commentLines = array_filter(explode("\n", str_replace("\r", "", $validated['comments'])));
                $validated['quantity'] = count($commentLines);
            } elseif ($type === 'Mentions Custom List' || strpos($type, 'Mentions') !== false) {
                if (strpos($type, 'Custom List') !== false && empty($validated['comments'])) {
                    return response()->json(['error' => 'Usernames list is required'], 422);
                }
                if (!empty($validated['comments'])) {
                    $usernamesList = array_filter(explode("\n", str_replace("\r", "", $validated['comments'])));
                    if ($type === 'Mentions Custom List' || strpos($type, 'Hashtag') !== false || strpos($type, 'Media Likers') !== false || strpos($type, 'with Hashtags') !== false) {
                        $validated['quantity'] = count($usernamesList);
                    }
                }
            } elseif ($type === 'Poll') {
                if (empty($customData['answer_number'])) {
                    return response()->json(['error' => 'Answer number is required for polls'], 422);
                }
            } elseif ($type === 'Comment Likes' || $type === 'Mentions Username Followers') {
                if (empty($customData['username'])) {
                    return response()->json(['error' => 'Username is required'], 422);
                }
            }

            if (empty($validated['quantity'])) {
                return response()->json(['error' => 'Quantity is required'], 422);
            }

            if ($validated['quantity'] < $service->min_order || $validated['quantity'] > $service->max_order) {
                return response()->json([
                    'error' => "Quantity must be between {$service->min_order} and {$service->max_order}",
                ], 422);
            }

            $cost = $service->calculateCost($validated['quantity']);
        }

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

            // Serialize custom fields to comments column for compatibility
            $orderComments = $validated['comments'] ?? null;
            if ($type === 'Subscriptions' || $type === 'Poll' || $type === 'Comment Likes' || $type === 'Mentions Username Followers') {
                $orderComments = json_encode($customData);
            }

            // Create order
            $order = Order::create([
                'id' => $orderId,
                'user_id' => $user->id,
                'service_id' => $service->id,
                'link' => $validated['link'],
                'quantity' => $validated['quantity'],
                'comments' => $orderComments,
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
            $params = [
                'key'      => $providerKey,
                'action'   => 'add',
                'service'  => $service->external_service_id,
            ];

            $type = $service->type;

            if ($type === 'Subscriptions') {
                $details = json_decode($order->comments, true) ?? [];
                $params['username'] = $details['username'] ?? $order->link;
                $params['min'] = $details['min'] ?? 0;
                $params['max'] = $details['max'] ?? 0;
                $params['posts'] = $details['posts'] ?? 0;
                if (isset($details['delay'])) {
                    $params['delay'] = $details['delay'];
                }
            } else {
                $params['link'] = $order->link;

                if ($type === 'Custom Comments' || $type === 'Comment Replies' || strpos($type, 'Comments') !== false) {
                    $params['comments'] = $order->comments;
                } elseif (strpos($type, 'Mentions') !== false) {
                    $params['usernames'] = $order->comments;
                    if ($type !== 'Mentions Custom List') {
                        $params['quantity'] = $order->quantity;
                    }
                } elseif ($type === 'Poll') {
                    $details = json_decode($order->comments, true) ?? [];
                    $params['answer_number'] = $details['answer_number'] ?? $order->comments;
                    $params['quantity'] = $order->quantity;
                } elseif ($type === 'Comment Likes' || $type === 'Mentions Username Followers') {
                    $details = json_decode($order->comments, true) ?? [];
                    $params['username'] = $details['username'] ?? $order->comments;
                    $params['quantity'] = $order->quantity;
                } else {
                    $params['quantity'] = $order->quantity;
                }
            }

            $response = Http::timeout(15)->asForm()->post($providerUrl, $params);


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
            $cost = $service->calculateCost($item['quantity']);
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
