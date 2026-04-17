<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\PayHubTransaction;
use App\Models\Wallet;
use App\Services\CurrencyService;
use App\Services\PayHubService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PayHubController extends Controller
{
    protected PayHubService $payHub;
    protected CurrencyService $currency;

    public function __construct(PayHubService $payHub, CurrencyService $currency)
    {
        $this->payHub = $payHub;
        $this->currency = $currency;
    }

    /**
     * Get current exchange rate with margin for live preview.
     */
    public function getRate()
    {
        $conversion = $this->currency->convertUsdToEur(1); // Get rate for $1
        return response()->json([
            'rate' => $conversion['rate_used'],
            'currency' => 'EUR'
        ]);
    }

    /**
     * Initiate a payment session (USD -> EUR -> PayHub Redirect)
     */
    public function checkout(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:1']);
        $user = $request->user();
        $usdAmount = (float) $request->amount;

        $conversion = $this->currency->convertUsdToEur($usdAmount);
        
        $transaction = PayHubTransaction::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'amount_usd' => $usdAmount,
            'amount_eur' => $conversion['converted_amount'],
            'exchange_rate' => $conversion['rate_used'],
            'status' => 'pending',
        ]);

        $payload = [
            'order_id' => $transaction->id,
            'amount' => $conversion['converted_amount'],
            'currency' => 'EUR',
            'customer_email' => $user->email,
            'success_url' => config('services.payhub.success_url'),
            'cancel_url' => config('services.payhub.cancel_url'),
        ];

        try {
            $session = $this->payHub->createCheckout($payload);
            return response()->json(['checkout_url' => $session['checkout_url']]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Payment initiation failed.'], 500);
        }
    }

    /**
     * Silent webhook listener for payment confirmation.
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->all();
        $signature = $request->header('X-PayHub-Signature');

        if (!$this->payHub->verifyWebhookSignature($payload, $signature)) {
            Log::warning("PayHub Webhook: Invalid Signature detected.");
            return response()->json(['error' => 'Invalid signature'], 403);
        }

        $transaction = PayHubTransaction::find($payload['order_id']);

        if (!$transaction || $transaction->status !== 'pending') {
            return response()->json(['message' => 'Processed or missing transaction.'], 200);
        }

        if ($payload['status'] === 'paid') {
            DB::beginTransaction();
            try {
                // Update Transaction with Card details
                $transaction->update([
                    'status' => 'paid',
                    'payhub_ref' => $payload['hub_reference'] ?? null,
                    'card_last4' => $payload['card_last4'] ?? null,
                    'card_brand' => $payload['card_brand'] ?? null,
                    'card_holder_name' => $payload['card_holder_name'] ?? null,
                    'invoice_no' => 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                ]);

                // Increment Wallet Balance
                $wallet = Wallet::firstOrCreate(['user_id' => $transaction->user_id], ['balance' => 0]);
                $wallet->increment('balance', $transaction->amount_usd);

                DB::commit();
                Log::info("PayHub Success: Wallet credited for user {$transaction->user_id}. Amount: {$transaction->amount_usd}");
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error("PayHub Fulfillment Error: " . $e->getMessage());
                return response()->json(['error' => 'Internal processing error'], 500);
            }
        }

        return response()->json(['status' => 'success'], 200);
    }
}
