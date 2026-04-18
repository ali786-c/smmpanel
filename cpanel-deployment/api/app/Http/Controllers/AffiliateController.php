<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\Referral;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AffiliateController extends Controller
{
    /**
     * Get affiliate statistics for the authenticated user.
     */
    public function stats()
    {
        $user = auth()->user();
        $referrals = Referral::where('referrer_id', $user->id)
            ->with(['referred' => fn($q) => $q->with('profile:user_id,display_name,created_at')])
            ->get();

        $totalEarnings = $referrals->sum('total_earnings');
        $availableBalance = $referrals->sum('available_balance');
        
        $profile = Profile::where('user_id', $user->id)->first();
        $totalVisits = $profile?->total_visits ?? 0;

        // Calculate conversion rate: successful referrals / total visits
        $totalReferrals = $referrals->count();
        $conversionRate = $totalVisits > 0 ? ($totalReferrals / $totalVisits) * 100 : 0;

        return response()->json([
            'referral_code'   => $profile?->referral_code,
            'total_referrals' => $totalReferrals,
            'total_earnings'  => $totalEarnings,
            'available_balance' => $availableBalance,
            'total_visits'    => $totalVisits,
            'conversion_rate' => $conversionRate,
            'commission_rate' => 0.015 * 100, // 1.5% as display
            'referrals'       => $referrals,
        ]);
    }

    /**
     * Track a visit/click on a referral link.
     */
    public function trackVisit($code)
    {
        $profile = Profile::where('referral_code', $code)->first();
        if (!$profile) {
            return response()->json(['error' => 'Invalid referral code'], 404);
        }

        $profile->increment('total_visits');
        
        return response()->json(['success' => true]);
    }

    /**
     * Convert available affiliate earnings to wallet credit.
     */
    public function convertToCredit()
    {
        $user = auth()->user();
        $referrals = Referral::where('referrer_id', $user->id)
            ->where('available_balance', '>', 0)
            ->get();

        $totalToConvert = $referrals->sum('available_balance');

        if ($totalToConvert < 10) {
            return response()->json(['error' => 'Minimum $10 required to convert earnings to credit.'], 422);
        }

        DB::beginTransaction();
        try {
            $wallet = Wallet::where('user_id', $user->id)->first();
            if (!$wallet) {
                $wallet = Wallet::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'balance' => 0
                ]);
            }

            // Transfer to wallet
            $wallet->increment('balance', $totalToConvert);

            // Reset pending balances
            foreach ($referrals as $ref) {
                $ref->update(['available_balance' => 0]);
            }

            // Log transaction
            WalletTransaction::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'type' => 'affiliate_payout',
                'amount' => $totalToConvert,
                'description' => "Affiliate earnings conversion to credit",
                'status' => 'completed',
                'payment_method' => 'internal',
                'created_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Earnings successfully converted to wallet credit.',
                'amount' => $totalToConvert,
                'new_balance' => $wallet->fresh()->balance
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Affiliate conversion failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Conversion failed. Please try again later.'], 500);
        }
    }
}
