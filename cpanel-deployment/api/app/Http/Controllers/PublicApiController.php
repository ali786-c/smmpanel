<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Profile;
use App\Models\Service;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class PublicApiController extends Controller
{
    private function checkRateLimit(string $apiKey): bool
    {
        $executed = RateLimiter::attempt(
            'api-usage:'.$apiKey,
            $perMinute = 100,
            function() {
                // No-op, just counting
            },
            60 // Window in seconds
        );

        return (bool) $executed;
    }

    public function handle(Request $request)
    {
        $apiKey = $request->input('key', '');
        $action = $request->input('action', '');

        if (!$apiKey) {
            return response()->json(['error' => 'Missing API key'], 401);
        }
        if (!$action) {
            return response()->json(['error' => 'Missing action'], 400);
        }

        $profile = Profile::where('api_key', $apiKey)->first();
        if (!$profile) {
            return response()->json(['error' => 'Invalid API key'], 401);
        }

        $userId = $profile->user_id;

        if (!$this->checkRateLimit($apiKey)) {
            return response()->json(['error' => 'Rate limit exceeded. Max 100 requests/minute.'], 429);
        }

        return match ($action) {
            'services' => $this->getServices(),
            'add'      => $this->addOrder($request, $userId),
            'status'   => $this->getOrderStatus($request, $userId),
            'orders'   => $this->getOrders($request, $userId),
            'balance'  => $this->getBalance($userId),
            'refill'   => $this->requestRefill($request, $userId),
            'cancel'   => $this->cancelOrder($request, $userId),
            default    => response()->json(['error' => "Unknown action: {$action}"], 400),
        };
    }

    private function getServices()
    {
        $services = Service::active()->orderBy('display_order')->get();
        return response()->json($services->map(fn($s) => [
            'service'  => (string) $s->external_service_id,
            'name'     => $s->name,
            'category' => $s->category,
            'rate'     => (string) $s->rate,
            'min'      => (string) $s->min_order,
            'max'      => (string) $s->max_order,
            'type'     => $s->type,
            'refill'   => (bool) $s->refill,
            'cancel'   => (bool) $s->cancel,
        ]));
    }

    private function addOrder(Request $request, string $userId): \Illuminate\Http\JsonResponse
    {
        $serviceId = $request->input('service');
        $link      = $request->input('link', '');
        $quantity  = (int) $request->input('quantity', 0);

        if (!$serviceId || !$link || !$quantity) {
            return response()->json(['error' => 'Missing service, link, or quantity'], 400);
        }

        $service = Service::active()->where('external_service_id', $serviceId)->first();
        if (!$service) {
            return response()->json(['error' => 'Service not found or inactive'], 404);
        }

        if ($quantity < $service->min_order || $quantity > $service->max_order) {
            return response()->json(['error' => "Quantity must be between {$service->min_order} and {$service->max_order}"], 422);
        }

        $cost = round(($service->rate / 1000) * $quantity, 4);

        $wallet = Wallet::where('user_id', $userId)->first();
        if (!$wallet || $wallet->balance < $cost) {
            return response()->json(['error' => 'Insufficient balance'], 402);
        }

        $providerKey = config('services.provider.api_key');
        $providerUrl = config('services.provider.api_url');

        DB::beginTransaction();
        try {
            $wallet->decrement('balance', $cost);
            $wallet->touch();

            // Submit to provider using form-params (standard for JAP APIs)
            $providerRes = Http::timeout(20)->asForm()->post($providerUrl, [
                'key'      => $providerKey,
                'action'   => 'add',
                'service'  => $service->external_service_id,
                'link'     => $link,
                'quantity' => $quantity,
            ]);

            $providerData    = $providerRes->json();
            $providerOrderId = $providerData['order'] ?? null;

            if (!$providerOrderId && isset($providerData['error'])) {
                 // If provider rejects, we could rollback or log. 
                 // For now, if no ID, we keep it as Pending for admin review.
            }

            $order = Order::create([
                'id'                => (string) Str::uuid(),
                'user_id'           => $userId,
                'service_id'        => $service->id,
                'link'              => $link,
                'quantity'          => $quantity,
                'cost'              => $cost,
                'provider_cost'     => round($cost * 0.7, 4),
                'status'            => $providerOrderId ? 'In progress' : 'Pending',
                'external_order_id' => $providerOrderId,
            ]);

            WalletTransaction::create([
                'id'             => (string) Str::uuid(),
                'user_id'        => $userId,
                'type'           => 'order',
                'amount'         => -$cost,
                'description'    => "API Order #{$order->id} - {$service->name}",
                'reference_id'   => $order->id,
                'status'         => 'completed',
                'payment_method' => 'api',
                'created_at'     => now(),
            ]);

            DB::commit();
            return response()->json(['order' => $order->id]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'The order could not be processed at this time. Please try again later.'], 500);
        }
    }

    private function getOrderStatus(Request $request, string $userId): \Illuminate\Http\JsonResponse
    {
        $orderId = $request->input('order');
        if (!$orderId) {
            return response()->json(['error' => 'Missing order ID'], 400);
        }

        $order = null;
        if (Str::isUuid($orderId)) {
            $order = Order::where('user_id', $userId)->where('id', $orderId)->first();
        } elseif (is_numeric($orderId)) {
            $order = Order::where('user_id', $userId)->where('external_order_id', (int) $orderId)->first();
        }

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        return response()->json([
            'charge'      => (string) $order->cost,
            'start_count' => (string) ($order->start_count ?? 0),
            'status'      => $order->status,
            'remains'     => (string) ($order->remains ?? 0),
            'currency'    => 'USD',
        ]);
    }

    private function getOrders(Request $request, string $userId): \Illuminate\Http\JsonResponse
    {
        $orders = Order::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->take(100)
            ->get()
            ->map(fn($o) => [
                'id'          => $o->id,
                'charge'      => (string) $o->cost,
                'start_count' => (string) ($o->start_count ?? 0),
                'status'      => $o->status,
                'remains'     => (string) ($o->remains ?? 0),
                'currency'    => 'USD',
            ]);

        return response()->json($orders);
    }

    private function getBalance(string $userId): \Illuminate\Http\JsonResponse
    {
        $wallet = Wallet::where('user_id', $userId)->first();
        return response()->json([
            'balance'  => (string) ($wallet?->balance ?? 0),
            'currency' => 'USD',
        ]);
    }

    private function requestRefill(Request $request, string $userId): \Illuminate\Http\JsonResponse
    {
        $orderId = $request->input('order');
        if (!$orderId) {
            return response()->json(['error' => 'Missing order ID'], 400);
        }

        $order = Order::where('user_id', $userId)->find($orderId);
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $providerUrl = config('services.provider.api_url');
        $providerKey = config('services.provider.api_key');

        if ($providerUrl && $providerKey && $order->external_order_id) {
            $res = Http::timeout(15)->asForm()->post($providerUrl, [
                'key'    => $providerKey,
                'action' => 'refill',
                'order'  => $order->external_order_id,
            ]);
            return response()->json($res->json());
        }

        return response()->json(['error' => 'Refill not supported for this order'], 400);
    }

    private function cancelOrder(Request $request, string $userId): \Illuminate\Http\JsonResponse
    {
        $orderIds = $request->input('orders') ?? $request->input('order');
        if (!$orderIds) {
            return response()->json(['error' => 'Missing order ID(s)'], 400);
        }

        $idList    = is_array($orderIds) ? $orderIds : explode(',', $orderIds);
        $results   = [];

        DB::beginTransaction();
        try {
            foreach ($idList as $orderId) {
                $order = Order::where('user_id', $userId)
                    ->whereIn('status', ['Pending', 'Processing'])
                    ->find(trim($orderId));

                if ($order) {
                    Wallet::where('user_id', $userId)->increment('balance', $order->cost);
                    WalletTransaction::create([
                        'id'             => (string) Str::uuid(),
                        'user_id'        => $userId,
                        'type'           => 'refund',
                        'amount'         => $order->cost,
                        'description'    => "Order #{$order->id} cancelled refund",
                        'reference_id'   => $order->id,
                        'status'         => 'completed',
                        'payment_method' => 'system',
                        'created_at'     => now(),
                    ]);

                    $order->update(['status' => 'Cancelled']);
                    $results[] = ['order' => $orderId, 'status' => 'Cancelled'];
                } else {
                    $results[] = ['order' => $orderId, 'error' => 'Not found or cannot be cancelled'];
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Batch cancellation failed'], 500);
        }

        return response()->json($results);
    }
}
