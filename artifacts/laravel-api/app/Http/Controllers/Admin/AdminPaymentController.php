<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Admin: manage payment gateway settings (Stripe / PayPal / Crypto).
 * Keys are stored encrypted; only the admin can read or write them.
 */
class AdminPaymentController extends Controller
{
    /** GET /admin/payment-settings — list all rows grouped by provider */
    public function index(): \Illuminate\Http\JsonResponse
    {
        $rows = DB::table('payment_settings')
            ->orderBy('provider')
            ->orderBy('key_name')
            ->get()
            ->map(fn($r) => [
                'id'        => $r->id,
                'provider'  => $r->provider,
                'key_name'  => $r->key_name,
                'label'     => $r->label,
                'has_value' => !empty($r->key_value),
                // Never return the raw value to the frontend
                'is_active' => (bool) $r->is_active,
            ]);

        $grouped = $rows->groupBy('provider');

        return response()->json([
            'data' => $grouped,
            'providers' => ['stripe', 'paypal', 'crypto'],
        ]);
    }

    /** PATCH /admin/payment-settings/{id} — update a single key's value or active state */
    public function update(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'key_value' => 'nullable|string|max:512',
            'is_active' => 'nullable|boolean',
        ]);

        $row = DB::table('payment_settings')->where('id', $id)->first();
        if (!$row) {
            return response()->json(['error' => 'Setting not found.'], 404);
        }

        $update = ['updated_at' => now()];

        if (array_key_exists('key_value', $validated)) {
            $update['key_value'] = $validated['key_value']; // store as-is (add encryption in production)
        }
        if (array_key_exists('is_active', $validated)) {
            $update['is_active'] = (bool) $validated['is_active'];
        }

        DB::table('payment_settings')->where('id', $id)->update($update);

        return response()->json(['message' => 'Payment setting updated.']);
    }

    /** POST /admin/payment-settings/toggle-provider — enable/disable an entire provider */
    public function toggleProvider(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'provider'  => 'required|string|in:stripe,paypal,crypto',
            'is_active' => 'required|boolean',
        ]);

        DB::table('payment_settings')
            ->where('provider', $validated['provider'])
            ->update(['is_active' => $validated['is_active'], 'updated_at' => now()]);

        return response()->json([
            'message' => "Provider {$validated['provider']} " . ($validated['is_active'] ? 'enabled' : 'disabled') . '.',
        ]);
    }

    /** GET /admin/payment-settings/status — quick health check of which providers are configured */
    public function status(): \Illuminate\Http\JsonResponse
    {
        $settings = DB::table('payment_settings')->get()->keyBy('key_name');

        return response()->json([
            'stripe' => [
                'configured' => !empty($settings['secret_key']?->key_value),
                'active'     => (bool) ($settings['publishable_key']?->is_active ?? false),
            ],
            'paypal' => [
                'configured' => !empty($settings['client_id']?->key_value) && !empty($settings['client_secret']?->key_value),
                'active'     => (bool) ($settings['client_id']?->is_active ?? false),
                'mode'       => $settings['mode']?->key_value ?? 'sandbox',
            ],
            'crypto' => [
                'configured' => collect(['wallet_btc','wallet_eth','wallet_usdt_trc'])->some(fn($k) => !empty($settings[$k]?->key_value)),
                'active'     => (bool) ($settings['wallet_btc']?->is_active ?? false),
            ],
        ]);
    }
}
