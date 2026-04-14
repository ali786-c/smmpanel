<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use Illuminate\Http\Request;

class AdminAffiliateController extends Controller
{
    public function index(Request $request)
    {
        $query = Referral::with([
                'referrer:id,email',
                'referrer.profile:user_id,display_name',
                'referred:id,email',
                'referred.profile:user_id,display_name',
            ])
            ->orderByDesc('total_earnings');

        return response()->json($query->paginate($request->get('per_page', 25)));
    }

    public function stats()
    {
        $total = Referral::count();
        $totalEarnings = Referral::sum('total_earnings');
        $topReferrers = Referral::with(['referrer:id,email', 'referrer.profile:user_id,display_name'])
            ->orderByDesc('total_earnings')
            ->take(10)
            ->get();

        return response()->json([
            'total_referrals' => $total,
            'total_earnings_paid' => $totalEarnings,
            'top_referrers' => $topReferrers,
        ]);
    }
}
