<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayHubService
{
    protected string $clientId;
    protected string $secret;
    protected string $apiUrl;

    public function __construct()
    {
        $this->clientId = config('services.payhub.client_id');
        $this->secret = config('services.payhub.secret');
        $this->apiUrl = config('services.payhub.url');
    }

    /**
     * Create a new checkout session on PayHub.
     */
    public function createCheckout(array $payload): array
    {
        $signature = $this->generateSignature($payload);

        $response = Http::withHeaders([
            'X-PayHub-Client-ID' => $this->clientId,
            'X-PayHub-Signature' => $signature,
            'Accept'             => 'application/json',
        ])->post($this->apiUrl . '/checkout/create', $payload);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error("PayHub API Error: " . $response->body());
        throw new \Exception("Failed to create PayHub checkout session.");
    }

    /**
     * Generate HMAC-SHA256 signature based on alphabetized payload.
     */
    public function generateSignature(array $payload): string
    {
        // 1. Sort keys alphabetically
        ksort($payload);

        // 2. Remove signature if present
        unset($payload['signature']);

        // 3. Convert to query string
        $queryString = http_build_query($payload);

        // 4. Generate HMAC-SHA256 using the Secret
        return hash_hmac('sha256', $queryString, $this->secret);
    }

    /**
     * Verify incoming webhook signature.
     */
    public function verifyWebhookSignature(array $payload, string $providedSignature): bool
    {
        $calculatedSignature = $this->generateSignature($payload);
        return hash_equals($calculatedSignature, $providedSignature);
    }
}
