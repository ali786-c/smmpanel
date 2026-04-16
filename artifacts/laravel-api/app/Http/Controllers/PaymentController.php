<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * User-facing payment endpoints.
 * Handles Stripe checkout session creation, PayPal order creation, and Crypto payment details.
 */
class PaymentController extends Controller
{
    // ─── Shared helper ─────────────────────────────────────────────────────────

    private function getSetting(string $keyName): ?string
    {
        return DB::table('payment_settings')->where('key_name', $keyName)->value('key_value');
    }

    private function isProviderActive(string $provider): bool
    {
        return DB::table('payment_settings')
            ->where('provider', $provider)
            ->where('is_active', true)
            ->exists();
    }

    // ─── GET /payment/methods — which providers are currently active ───────────

    public function methods(): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'data' => [
                'stripe' => $this->isProviderActive('stripe'),
                'paypal' => $this->isProviderActive('paypal'),
                'crypto' => $this->isProviderActive('crypto'),
            ],
            'notice' => 'All deposits are final and non-refundable. By proceeding you accept our Terms of Service.',
        ]);
    }

    // ─── POST /payment/stripe/checkout ────────────────────────────────────────

    public function stripeCheckout(Request $request): \Illuminate\Http\JsonResponse
    {
        if (!$this->isProviderActive('stripe')) {
            return response()->json(['error' => 'Stripe payments are not currently available.'], 503);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1|max:10000',
        ]);

        $secretKey = $this->getSetting('secret_key');
        if (!$secretKey) {
            return response()->json(['error' => 'Stripe is not configured.'], 503);
        }

        $amountCents = (int) round($validated['amount'] * 100);
        $user = auth()->user();

        $response = Http::asForm()
            ->withToken($secretKey, 'Bearer')
            ->post('https://api.stripe.com/v1/checkout/sessions', [
                'mode'                       => 'payment',
                'payment_method_types[]'     => 'card',
                'line_items[0][price_data][currency]'              => 'usd',
                'line_items[0][price_data][product_data][name]'    => 'emazingSM Wallet Top-Up',
                'line_items[0][price_data][product_data][description]' => 'Non-refundable. All sales final. Digital service credit.',
                'line_items[0][price_data][unit_amount]'           => $amountCents,
                'line_items[0][quantity]'                          => 1,
                'customer_email'             => $user->email,
                'metadata[user_id]'          => $user->id,
                'metadata[type]'             => 'wallet_deposit',
                'success_url'                => config('app.frontend_url', 'https://emazingsm.com') . '/dashboard?payment=success',
                'cancel_url'                 => config('app.frontend_url', 'https://emazingsm.com') . '/dashboard?payment=cancelled',
            ]);

        if (!$response->successful()) {
            return response()->json(['error' => 'Failed to create Stripe session.', 'detail' => $response->json('error.message')], 502);
        }

        return response()->json([
            'checkout_url' => $response->json('url'),
            'session_id'   => $response->json('id'),
        ]);
    }

    // ─── POST /payment/stripe/webhook ─────────────────────────────────────────

    public function stripeWebhook(Request $request): \Illuminate\Http\Response
    {
        $webhookSecret = $this->getSetting('webhook_secret');
        $payload       = $request->getContent();
        $sigHeader     = $request->header('Stripe-Signature', '');

        // Verify signature
        if ($webhookSecret) {
            $parts    = explode(',', $sigHeader);
            $timestamp = '';
            $sig       = '';
            foreach ($parts as $part) {
                if (str_starts_with($part, 't=')) $timestamp = substr($part, 2);
                if (str_starts_with($part, 'v1=')) $sig = substr($part, 3);
            }
            $expected = hash_hmac('sha256', "{$timestamp}.{$payload}", $webhookSecret);
            if (!hash_equals($expected, $sig)) {
                return response('Invalid signature.', 400);
            }
        }

        $event = json_decode($payload, true);

        if ($event['type'] === 'checkout.session.completed') {
            $session = $event['data']['object'];
            $userId  = $session['metadata']['user_id'] ?? null;
            $amount  = $session['amount_total'] / 100; // cents → dollars

            if ($userId) {
                $this->creditWallet($userId, $amount, 'stripe', $session['id']);
            }
        }

        return response('OK', 200);
    }

    // ─── POST /payment/paypal/create-order ────────────────────────────────────

    public function paypalCreateOrder(Request $request): \Illuminate\Http\JsonResponse
    {
        if (!$this->isProviderActive('paypal')) {
            return response()->json(['error' => 'PayPal payments are not currently available.'], 503);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1|max:10000',
        ]);

        $clientId     = $this->getSetting('client_id');
        $clientSecret = $this->getSetting('client_secret');
        $mode         = $this->getSetting('mode') ?: 'sandbox';

        if (!$clientId || !$clientSecret) {
            return response()->json(['error' => 'PayPal is not configured.'], 503);
        }

        $baseUrl = $mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        // Get access token
        $tokenRes = Http::asForm()
            ->withBasicAuth($clientId, $clientSecret)
            ->post("{$baseUrl}/v1/oauth2/token", ['grant_type' => 'client_credentials']);

        if (!$tokenRes->successful()) {
            return response()->json(['error' => 'PayPal authentication failed.'], 502);
        }

        $accessToken = $tokenRes->json('access_token');

        // Create order
        $orderRes = Http::withToken($accessToken)
            ->post("{$baseUrl}/v2/checkout/orders", [
                'intent'         => 'CAPTURE',
                'purchase_units' => [[
                    'amount'      => ['currency_code' => 'USD', 'value' => number_format($validated['amount'], 2)],
                    'description' => 'emazingSM Wallet Top-Up — Non-refundable digital credit.',
                ]],
            ]);

        if (!$orderRes->successful()) {
            return response()->json(['error' => 'Failed to create PayPal order.'], 502);
        }

        return response()->json([
            'order_id'  => $orderRes->json('id'),
            'client_id' => $clientId,
        ]);
    }

    // ─── POST /payment/paypal/capture ─────────────────────────────────────────

    public function paypalCapture(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|string',
            'amount'   => 'required|numeric|min:1',
        ]);

        $clientId     = $this->getSetting('client_id');
        $clientSecret = $this->getSetting('client_secret');
        $mode         = $this->getSetting('mode') ?: 'sandbox';
        $baseUrl      = $mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

        $tokenRes = Http::asForm()
            ->withBasicAuth($clientId, $clientSecret)
            ->post("{$baseUrl}/v1/oauth2/token", ['grant_type' => 'client_credentials']);

        $accessToken = $tokenRes->json('access_token');

        $captureRes = Http::withToken($accessToken)
            ->post("{$baseUrl}/v2/checkout/orders/{$validated['order_id']}/capture");

        if (!$captureRes->successful() || $captureRes->json('status') !== 'COMPLETED') {
            return response()->json(['error' => 'PayPal capture failed.'], 502);
        }

        $this->creditWallet(auth()->id(), $validated['amount'], 'paypal', $validated['order_id']);

        return response()->json(['message' => 'Payment completed. Wallet credited.', 'amount' => $validated['amount']]);
    }

    // ─── GET /payment/crypto/addresses ────────────────────────────────────────

    public function cryptoAddresses(): \Illuminate\Http\JsonResponse
    {
        if (!$this->isProviderActive('crypto')) {
            return response()->json(['error' => 'Crypto payments are not currently available.'], 503);
        }

        $minAmount = (float) ($this->getSetting('min_amount_usd') ?? 10);

        $addresses = [];
        $map = [
            'BTC'        => 'wallet_btc',
            'ETH'        => 'wallet_eth',
            'USDT (TRC-20)' => 'wallet_usdt_trc',
            'USDT (ERC-20)' => 'wallet_usdt_erc',
        ];

        foreach ($map as $currency => $key) {
            $addr = $this->getSetting($key);
            if ($addr) {
                $addresses[] = ['currency' => $currency, 'address' => $addr];
            }
        }

        return response()->json([
            'data'       => $addresses,
            'min_amount' => $minAmount,
            'notice'     => 'Send exact amount. After confirmation (typically 1–3 network confirmations), your wallet will be credited manually within 1 business hour. All crypto deposits are non-refundable.',
        ]);
    }

    // ─── POST /payment/crypto/confirm — manual user notification ─────────────

    public function cryptoConfirm(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'currency'  => 'required|string|max:20',
            'tx_hash'   => 'required|string|max:255',
            'amount'    => 'required|numeric|min:1',
        ]);

        DB::table('wallet_transactions')->insert([
            'id'             => (string) Str::uuid(),
            'user_id'        => auth()->id(),
            'type'           => 'deposit',
            'amount'         => $validated['amount'],
            'payment_method' => 'crypto',
            'reference_id'   => $validated['tx_hash'],
            'status'         => 'pending', // admin reviews and credits manually
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return response()->json([
            'message' => 'Crypto deposit submitted for review. Your wallet will be credited after confirmation. This is non-refundable.',
        ], 201);
    }

    // ─── Internal: credit wallet ───────────────────────────────────────────────

    private function creditWallet(string $userId, float $amount, string $method, string $reference): void
    {
        DB::beginTransaction();
        try {
            $wallet = DB::table('wallets')->where('user_id', $userId)->lockForUpdate()->first();

            if (!$wallet) {
                DB::table('wallets')->insert([
                    'id'         => (string) Str::uuid(),
                    'user_id'    => $userId,
                    'balance'    => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $wallet = DB::table('wallets')->where('user_id', $userId)->lockForUpdate()->first();
            }

            DB::table('wallets')
                ->where('user_id', $userId)
                ->update(['balance' => $wallet->balance + $amount, 'updated_at' => now()]);

            DB::table('wallet_transactions')->insert([
                'id'             => (string) Str::uuid(),
                'user_id'        => $userId,
                'type'           => 'deposit',
                'amount'         => $amount,
                'payment_method' => $method,
                'reference_id'   => $reference,
                'status'         => 'completed',
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Wallet credit failed', ['user' => $userId, 'error' => $e->getMessage()]);
        }
    }
}
