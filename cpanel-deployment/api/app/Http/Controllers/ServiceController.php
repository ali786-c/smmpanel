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
        $query = Service::active()->orderBy('display_order');

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        if ($request->has('platform')) {
            $query->where('platform', $request->platform);
        }
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $services = $query->get();

        // Mark favorites if authenticated
        if (auth()->check()) {
            $userId = auth()->id();
            $favorites = FavoriteService::where('user_id', $userId)
                ->pluck('service_id')
                ->toArray();
            $services->each(function ($s) use ($favorites) {
                $s->is_favorite = in_array($s->id, $favorites);
            });
        }

        return response()->json($services);
    }

    public function categories()
    {
        $categories = Service::active()
            ->select('category', 'platform')
            ->selectRaw('COUNT(*) as service_count')
            ->groupBy('category', 'platform')
            ->orderBy('category')
            ->get();

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
