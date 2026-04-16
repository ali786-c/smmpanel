<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LandingController extends Controller
{
    /**
     * GET /api/landing/stats
     * Returns live counters for the landing page hero section.
     */
    public function stats(): \Illuminate\Http\JsonResponse
    {
        $row = DB::table('landing_stats')->first();

        // Derive counts from real DB tables where possible
        $dbOrders    = DB::table('orders')->count();
        $dbCustomers = DB::table('users')->count();
        $dbServices  = DB::table('services')->where('is_active', true)->count();

        $totalOrders    = max($row?->total_orders ?? 12847, $dbOrders);
        $totalCustomers = max($row?->total_customers ?? 3200,  $dbCustomers);
        $yearsOfService = now()->year - ($row?->started_year ?? 2018);

        // Cheapest active service (rate is per 1000)
        $minRate = DB::table('services')
            ->where('is_active', true)
            ->min('rate');

        return response()->json([
            'data' => [
                'total_orders'    => ['value' => $this->fmt($totalOrders),    'raw' => $totalOrders],
                'total_customers' => ['value' => $this->fmt($totalCustomers),  'raw' => $totalCustomers],
                'years_of_service'=> ['value' => (string) $yearsOfService,     'raw' => $yearsOfService],
                'services'        => ['value' => (string) $dbServices,         'raw' => $dbServices],
                'starting_price'  => ['value' => $minRate ? '$'.number_format($minRate, 4) : '$0.001', 'raw' => $minRate],
            ],
        ]);
    }

    /**
     * GET /api/landing/reviews
     * Returns approved reviews, newest first, paginated.
     */
    public function reviews(Request $request): \Illuminate\Http\JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 6), 50);
        $page    = max((int) $request->query('page', 1), 1);
        $sort    = $request->query('sort', 'newest'); // newest | random

        $query = DB::table('reviews')->where('is_approved', true);

        $total = $query->count();

        if ($sort === 'random') {
            $rows = $query->inRandomOrder()->offset(($page - 1) * $perPage)->limit($perPage)->get();
        } else {
            $rows = $query->orderByDesc('created_at')->offset(($page - 1) * $perPage)->limit($perPage)->get();
        }

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total'     => $total,
                'page'      => $page,
                'per_page'  => $perPage,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ],
        ]);
    }

    /**
     * POST /api/landing/reviews
     * Submit a new review (requires auth token — tied to logged-in user).
     */
    public function submitReview(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:80',
            'country'  => 'nullable|string|max:60',
            'rating'   => 'required|numeric|min:3.5|max:5.0',
            'comment'  => 'required|string|min:20|max:1000',
            'language' => 'nullable|string|max:10',
        ]);

        DB::table('reviews')->insert([
            'user_id'     => auth()->id(),
            'username'    => $validated['username'],
            'country'     => $validated['country'] ?? '',
            'rating'      => $validated['rating'],
            'comment'     => $validated['comment'],
            'language'    => $validated['language'] ?? 'en',
            'is_approved' => false, // admin must approve
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json(['message' => 'Review submitted for approval.'], 201);
    }

    private function fmt(int $n): string
    {
        if ($n >= 1000000) return round($n / 1000000, 1).'M+';
        if ($n >= 1000)    return round($n / 1000, 1).'K+';
        return (string) $n;
    }
}
