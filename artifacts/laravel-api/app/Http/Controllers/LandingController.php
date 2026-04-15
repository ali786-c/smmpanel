<?php

namespace App\Http\Controllers;

use App\Models\LandingStat;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LandingController extends Controller
{
    public function stats()
    {
        $stats = Cache::remember('landing_stats', 3600, function () {
            return LandingStat::all()->map(fn($s) => [
                'key' => $s->key,
                'value' => $s->value,
                'label' => $s->label,
                'suffix' => $s->suffix,
            ])->keyBy('key');
        });

        return response()->json(['data' => $stats]);
    }

    public function testimonials(Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $featured = $request->query('featured');
        $platform = $request->query('platform');
        $niche = $request->query('niche');

        $cacheKey = "testimonials_{$page}_{$perPage}_{$featured}_{$platform}_{$niche}";

        $result = Cache::remember($cacheKey, 600, function () use ($page, $perPage, $featured, $platform, $niche) {
            $query = Testimonial::orderByDesc('featured')
                ->orderByDesc('reviewed_at');

            if ($featured === 'true' || $featured === '1') {
                $query->where('featured', true);
            }
            if ($platform) {
                $query->where('platform', $platform);
            }
            if ($niche) {
                $query->where('niche', $niche);
            }

            $paginated = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'data' => $paginated->map(fn($t) => [
                    'id' => $t->id,
                    'author_name' => $t->author_name,
                    'author_handle' => $t->author_handle,
                    'avatar_seed' => $t->avatar_seed,
                    'platform' => $t->platform,
                    'rating' => $t->rating,
                    'content' => $t->content,
                    'followers_count' => $t->followers_count,
                    'niche' => $t->niche,
                    'country_code' => $t->country_code,
                    'featured' => $t->featured,
                    'reviewed_at' => $t->reviewed_at?->toDateString(),
                ]),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ],
            ];
        });

        return response()->json($result);
    }

    public function platforms()
    {
        $platforms = Cache::remember('landing_platforms', 3600, function () {
            return Testimonial::select('platform')
                ->distinct()
                ->orderBy('platform')
                ->pluck('platform');
        });

        return response()->json(['data' => $platforms]);
    }

    public function niches()
    {
        $niches = Cache::remember('landing_niches', 3600, function () {
            return Testimonial::select('niche')
                ->whereNotNull('niche')
                ->distinct()
                ->orderBy('niche')
                ->pluck('niche');
        });

        return response()->json(['data' => $niches]);
    }

    public function featuredTestimonials()
    {
        $testimonials = Cache::remember('featured_testimonials', 600, function () {
            return Testimonial::where('featured', true)
                ->orderByDesc('reviewed_at')
                ->get()
                ->map(fn($t) => [
                    'id' => $t->id,
                    'author_name' => $t->author_name,
                    'author_handle' => $t->author_handle,
                    'avatar_seed' => $t->avatar_seed,
                    'platform' => $t->platform,
                    'rating' => $t->rating,
                    'content' => $t->content,
                    'followers_count' => $t->followers_count,
                    'niche' => $t->niche,
                    'country_code' => $t->country_code,
                    'featured' => $t->featured,
                    'reviewed_at' => $t->reviewed_at?->toDateString(),
                ]);
        });

        return response()->json(['data' => $testimonials]);
    }
}
