<?php

namespace App\Http\Controllers;

use App\Models\FavoriteService;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $page = (int) $request->get('page', 1);
        $defaultLimit = $request->has('platform') ? 500 : 50;
        $limit = (int) $request->get('per_page', $request->get('limit', $defaultLimit));
        $category = $request->get('category');
        $platform = $request->get('platform', 'All');
        $search = $request->get('search');

        // Log the request for debugging
        \Illuminate\Support\Facades\Log::info("Service search request", [
            'platform' => $platform,
            'category' => $category,
            'search' => $search
        ]);

        // BYPASS CACHE FOR DEBUGGING
        $query = Service::active()->orderBy('display_order');

            if ($request->has('category')) {
                $query->where('category', $request->category);
            }
            
            if ($request->filled('platform') && $request->platform !== 'All' && $request->platform !== 'Everything') {
                // Using whereRaw with lower for case-insensitive and safer matching
                $query->whereRaw('LOWER(platform) = ?', [strtolower($request->platform)]);
            }
            
            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('category', 'like', '%' . $request->search . '%');
                });
            }

            $services = $query->paginate($limit);

        // Mark favorites if authenticated (Do not cache this part as it's user-specific)
        if (auth()->check()) {
            $userId = auth()->id();
            $favorites = FavoriteService::where('user_id', $userId)
                ->pluck('service_id')
                ->flip()
                ->toArray();

            $services->getCollection()->transform(function ($s) use ($favorites) {
                $s->is_favorite = isset($favorites[$s->id]);
                return $s;
            });
        }

        return response()->json($services);
    }

    public function categories()
    {
        $categories = \Illuminate\Support\Facades\Cache::remember('services_categories_summary', 3600, function () {
            return Service::active()
                ->select('category', 'platform')
                ->selectRaw('COUNT(*) as service_count')
                ->groupBy('category', 'platform')
                ->orderBy('category')
                ->get();
        });

        return response()->json($categories);
    }


    public function show($id)
    {
        $service = Service::active()->findOrFail($id);
        return response()->json($service);
    }

    public function favorites(Request $request)
    {
        $userId = auth()->id();
        $favorites = FavoriteService::where('user_id', $userId)
            ->with('service')
            ->get()
            ->pluck('service')
            ->filter();

        return response()->json($favorites);
    }

    public function toggleFavorite(Request $request, $serviceId)
    {
        $userId = auth()->id();
        $existing = FavoriteService::where('user_id', $userId)
            ->where('service_id', $serviceId)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['favorited' => false]);
        } else {
            FavoriteService::create([
                'id' => (string) Str::uuid(),
                'user_id' => $userId,
                'service_id' => $serviceId,
            ]);
            return response()->json(['favorited' => true]);
        }
    }
}
