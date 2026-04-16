<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * justanotherpanel.com API v2 Service
 *
 * Wraps every call to the JustAnotherPanel provider API with proper error handling,
 * logging, and response normalisation so the rest of the app never has to
 * deal with raw provider responses.
 *
 * API reference: https://justanotherpanel.com/api/v2
 */
class JustPanelService
{
    private string $apiUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct()
    {
        $this->apiUrl  = config('services.provider.api_url', '');
        $this->apiKey  = config('services.provider.api_key', '');
        $this->timeout = 20;
    }

    /** Whether credentials are configured */
    public function isConfigured(): bool
    {
        return !empty($this->apiUrl) && !empty($this->apiKey);
    }

    // ──────────────────────────────────────────────────────────────────────
    // ORDER MANAGEMENT
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Place a new order with the provider.
     * Returns ['success' => true, 'order_id' => '12345'] or ['success' => false, 'error' => '...']
     */
    public function placeOrder(string $serviceId, string $link, int $quantity): array
    {
        $resp = $this->call([
            'action'   => 'add',
            'service'  => $serviceId,
            'link'     => $link,
            'quantity' => $quantity,
        ]);

        if (isset($resp['order'])) {
            return ['success' => true, 'order_id' => (string) $resp['order']];
        }

        return ['success' => false, 'error' => $resp['error'] ?? 'Unknown provider error'];
    }

    /**
     * Get the current status of a provider order.
     * Returns normalised array with keys: status, start_count, remains, charge, currency
     */
    public function getOrderStatus(string $providerOrderId): array
    {
        $resp = $this->call([
            'action' => 'status',
            'order'  => $providerOrderId,
        ]);

        return [
            'success'     => !isset($resp['error']),
            'status'      => $resp['status'] ?? null,
            'start_count' => isset($resp['start_count']) ? (int) $resp['start_count'] : null,
            'remains'     => isset($resp['remains'])     ? (int) $resp['remains']     : null,
            'charge'      => isset($resp['charge'])      ? (float) $resp['charge']    : null,
            'currency'    => $resp['currency'] ?? 'USD',
            'error'       => $resp['error'] ?? null,
        ];
    }

    /**
     * Get status for multiple orders in one call.
     * $providerOrderIds = ['123', '456', ...]
     * Returns keyed array of statuses.
     */
    public function getMultipleOrderStatuses(array $providerOrderIds): array
    {
        $resp = $this->call([
            'action' => 'status',
            'orders' => implode(',', $providerOrderIds),
        ]);

        // Provider returns { "123": { status... }, "456": {...} }
        $results = [];
        foreach ($providerOrderIds as $id) {
            $raw = $resp[$id] ?? null;
            if ($raw && is_array($raw)) {
                $results[$id] = [
                    'success'     => !isset($raw['error']),
                    'status'      => $raw['status'] ?? null,
                    'start_count' => isset($raw['start_count']) ? (int) $raw['start_count'] : null,
                    'remains'     => isset($raw['remains'])     ? (int) $raw['remains']     : null,
                    'charge'      => isset($raw['charge'])      ? (float) $raw['charge']    : null,
                    'error'       => $raw['error'] ?? null,
                ];
            } else {
                $results[$id] = ['success' => false, 'error' => 'Not found in response'];
            }
        }
        return $results;
    }

    // ──────────────────────────────────────────────────────────────────────
    // SPEEDUP / REFILL
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Request a speedup / refill for a stale or slow order.
     * JustPanel uses the "refill" action for this.
     */
    public function requestSpeedup(string $providerOrderId): array
    {
        $resp = $this->call([
            'action' => 'refill',
            'order'  => $providerOrderId,
        ]);

        if (isset($resp['refill'])) {
            return ['success' => true, 'refill_id' => $resp['refill']];
        }

        // Some panels return {"status":"success"} directly
        if (isset($resp['status']) && strtolower($resp['status']) === 'success') {
            return ['success' => true, 'refill_id' => null];
        }

        return ['success' => false, 'error' => $resp['error'] ?? 'Speedup request failed'];
    }

    /**
     * Check the status of a previously submitted refill request.
     */
    public function getRefillStatus(string $refillId): array
    {
        $resp = $this->call([
            'action' => 'refill_status',
            'refill' => $refillId,
        ]);

        return [
            'success' => !isset($resp['error']),
            'status'  => $resp['status'] ?? null,
            'error'   => $resp['error'] ?? null,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────
    // CANCELLATION
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Request cancellation of a provider order.
     * API: action=cancel, orders=<id>
     * Response: [{"order": 9, "cancel": {"error": "..."}}, {"order": 2, "cancel": 1}]
     * cancel=1 means success, cancel={"error":"..."} means failure.
     */
    public function cancelOrder(string $providerOrderId): array
    {
        $resp = $this->call([
            'action' => 'cancel',
            'orders' => $providerOrderId,
        ]);

        if (is_array($resp)) {
            foreach ($resp as $item) {
                if (!is_array($item)) continue;
                if (!isset($item['cancel'])) continue;

                $cancel = $item['cancel'];

                // Success: cancel = 1 (integer)
                if ($cancel === 1 || $cancel === '1') {
                    return ['success' => true];
                }

                // Failure: cancel = {"error": "..."}
                if (is_array($cancel) && isset($cancel['error'])) {
                    return ['success' => false, 'error' => $cancel['error']];
                }

                return ['success' => false, 'error' => 'Cancel failed'];
            }
        }

        if (isset($resp['error'])) {
            return ['success' => false, 'error' => $resp['error']];
        }

        return ['success' => true];
    }

    /**
     * Request refill for multiple provider orders.
     * API: action=refill, orders=<id1,id2,...>
     * Response: [{"order":1,"refill":1}, {"order":2,"refill":2}, {"order":3,"refill":{"error":"..."}}]
     */
    public function requestBulkRefill(array $providerOrderIds): array
    {
        $resp = $this->call([
            'action' => 'refill',
            'orders' => implode(',', $providerOrderIds),
        ]);

        $results = [];
        if (is_array($resp)) {
            foreach ($resp as $item) {
                if (!is_array($item) || !isset($item['order'])) continue;
                $orderId = (string) $item['order'];
                $refill  = $item['refill'] ?? null;

                if (is_array($refill) && isset($refill['error'])) {
                    $results[$orderId] = ['success' => false, 'error' => $refill['error']];
                } else {
                    $results[$orderId] = ['success' => true, 'refill_id' => $refill];
                }
            }
        }
        return $results;
    }

    /**
     * Get refill status for multiple refill IDs.
     * API: action=refill_status, refills=<id1,id2,...>
     * Response: [{"refill":1,"status":"Completed"}, {"refill":2,"status":"Rejected"}, ...]
     */
    public function getMultipleRefillStatuses(array $refillIds): array
    {
        $resp = $this->call([
            'action'  => 'refill_status',
            'refills' => implode(',', $refillIds),
        ]);

        $results = [];
        if (is_array($resp)) {
            foreach ($resp as $item) {
                if (!is_array($item) || !isset($item['refill'])) continue;
                $refillId = (string) $item['refill'];
                $status   = $item['status'] ?? null;

                if (is_array($status) && isset($status['error'])) {
                    $results[$refillId] = ['success' => false, 'error' => $status['error']];
                } else {
                    $results[$refillId] = ['success' => true, 'status' => $status];
                }
            }
        }
        return $results;
    }

    // ──────────────────────────────────────────────────────────────────────
    // SERVICE CATALOGUE
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Fetch all services available from the provider.
     */
    public function getServices(): array
    {
        return $this->call(['action' => 'services']);
    }

    // ──────────────────────────────────────────────────────────────────────
    // BALANCE
    // ──────────────────────────────────────────────────────────────────────

    public function getBalance(): array
    {
        $resp = $this->call(['action' => 'balance']);
        return [
            'success'  => !isset($resp['error']),
            'balance'  => $resp['balance'] ?? null,
            'currency' => $resp['currency'] ?? 'USD',
            'error'    => $resp['error'] ?? null,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────
    // INTERNAL HTTP HELPER
    // ──────────────────────────────────────────────────────────────────────

    private function call(array $params): array
    {
        if (!$this->isConfigured()) {
            Log::warning('JustPanelService: API credentials not configured');
            return ['error' => 'Provider API not configured'];
        }

        $params['key'] = $this->apiKey;

        try {
            $response = Http::timeout($this->timeout)
                ->asForm()
                ->post($this->apiUrl, $params);

            $data = $response->json();

            if ($data === null) {
                Log::error('JustPanelService: Non-JSON response', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                    'params' => $this->safeParams($params),
                ]);
                return ['error' => 'Provider returned non-JSON response'];
            }

            return $data;

        } catch (\Throwable $e) {
            Log::error('JustPanelService: HTTP error', [
                'message' => $e->getMessage(),
                'params'  => $this->safeParams($params),
            ]);
            return ['error' => $e->getMessage()];
        }
    }

    /** Strip the API key before logging */
    private function safeParams(array $params): array
    {
        $safe = $params;
        unset($safe['key']);
        return $safe;
    }
}
