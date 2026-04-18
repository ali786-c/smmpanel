<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TurnstileService
{
    private string $secretKey;
    private const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function __construct()
    {
        $this->secretKey = config('services.turnstile.secret_key', '');
    }

    /**
     * Verify a Cloudflare Turnstile token.
     * Returns true if valid, false if invalid or missing.
     */
    public function verify(?string $token, ?string $ip = null): bool
    {
        if (empty($this->secretKey)) {
            Log::warning('Turnstile secret key is missing in config');
            return false;
        }

        if (empty($token)) {
            Log::debug('Turnstile token is missing in request');
            return false;
        }

        try {
            $response = Http::timeout(5)->asForm()->post(self::VERIFY_URL, array_filter([
                'secret'   => $this->secretKey,
                'response' => $token,
                'remoteip' => $ip,
            ]));

            if (!$response->successful()) {
                Log::warning('Turnstile HTTP error', [
                    'status' => $response->status(),
                    'body'   => $response->body()
                ]);
                return false;
            }

            $data = $response->json();
            if (!($data['success'] ?? false)) {
                Log::warning('Turnstile verification failed', [
                    'error-codes' => $data['error-codes'] ?? [],
                    'hostname'    => $data['hostname'] ?? 'unknown'
                ]);
            }
            return (bool) ($data['success'] ?? false);

        } catch (\Exception $e) {
            Log::error('Turnstile verification failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
