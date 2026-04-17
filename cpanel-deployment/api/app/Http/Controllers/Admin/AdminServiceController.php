<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AdminServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::orderBy('display_order');

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->has('is_active')) {
            $query->where('is_active', (bool) $request->is_active);
        }
        if ($request->has('platform')) {
            $query->where('platform', $request->platform);
        }

        return response()->json($query->paginate($request->get('per_page', 50)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'external_service_id' => 'required|integer|unique:services,external_service_id',
            'name' => 'required|string',
            'category' => 'required|string',
            'platform' => 'required|string',
            'type' => 'nullable|string',
            'rate' => 'required|numeric',
            'min_order' => 'required|integer',
            'max_order' => 'required|integer',
            'refill' => 'nullable|boolean',
            'cancel' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'display_order' => 'nullable|integer',
        ]);

        $service = Service::create(array_merge($validated, ['id' => (string) Str::uuid()]));
        
        // Clear services cache
        \Illuminate\Support\Facades\Cache::flush();

        return response()->json($service, 201);
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);
        $validated = $request->validate([
            'name' => 'nullable|string',
            'category' => 'nullable|string',
            'platform' => 'nullable|string',
            'type' => 'nullable|string',
            'rate' => 'nullable|numeric',
            'min_order' => 'nullable|integer',
            'max_order' => 'nullable|integer',
            'refill' => 'nullable|boolean',
            'cancel' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'display_order' => 'nullable|integer',
            'health_score' => 'nullable|integer|min:0|max:100',
        ]);

        $service->update(array_filter($validated, fn($v) => $v !== null));

        // Clear services cache
        \Illuminate\Support\Facades\Cache::flush();

        return response()->json($service);
    }

    public function destroy($id)
    {
        Service::findOrFail($id)->delete();

        // Clear services cache
        \Illuminate\Support\Facades\Cache::flush();

        return response()->json(['message' => 'Service deleted']);
    }

    public function syncFromProvider(Request $request)
    {
        $providerUrl = config('services.provider.api_url');
        $providerKey = config('services.provider.api_key');

        if (!$providerUrl || !$providerKey) {
            return response()->json(['error' => 'Provider API not configured'], 422);
        }

        try {
            $response = Http::post($providerUrl, [
                'key' => $providerKey,
                'action' => 'services',
            ]);

            $providerServices = $response->json();
            if (!is_array($providerServices)) {
                return response()->json(['error' => 'Invalid provider response'], 502);
            }

            $markupPercent = (float) ($request->input('markup_percent', 30));
            $created = 0;
            $updated = 0;

            foreach ($providerServices as $ps) {
                $externalId = (int) ($ps['service'] ?? $ps['id'] ?? 0);
                if (!$externalId) continue;

                $rate = round(((float) ($ps['rate'] ?? 0)) * (1 + $markupPercent / 100), 4);
                $sanitizedName = $this->sanitizeName($ps['name'] ?? '');
                $sanitizedCategory = $this->sanitizeName($ps['category'] ?? 'Other');

                $existing = Service::where('external_service_id', $externalId)->first();

                if ($existing) {
                    $existing->update([
                        'name' => $sanitizedName,
                        'category' => $sanitizedCategory,
                        'platform' => $this->detectPlatform($sanitizedCategory),
                        'rate' => $rate,
                        'min_order' => (int) ($ps['min'] ?? 1),
                        'max_order' => (int) ($ps['max'] ?? 100000),
                        'type' => $ps['type'] ?? 'Default',
                        'refill' => (bool) ($ps['refill'] ?? false),
                        'cancel' => (bool) ($ps['cancel'] ?? false),
                        'is_active' => true,
                    ]);
                    $updated++;
                } else {
                    Service::create([
                        'external_service_id' => $externalId,
                        'name' => $sanitizedName,
                        'category' => $sanitizedCategory,
                        'platform' => $this->detectPlatform($sanitizedCategory),
                        'type' => $ps['type'] ?? 'Default',
                        'rate' => $rate,
                        'min_order' => (int) ($ps['min'] ?? 1),
                        'max_order' => (int) ($ps['max'] ?? 100000),
                        'refill' => (bool) ($ps['refill'] ?? false),
                        'cancel' => (bool) ($ps['cancel'] ?? false),
                        'is_active' => true,
                    ]);
                    $created++;
                }
            }

            // Clear services cache after sync
            \Illuminate\Support\Facades\Cache::flush();

            return response()->json([
                'success' => true,
                'total' => count($providerServices),
                'created' => $created,
                'updated' => $updated,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    }

    public function resanitizeServices()
    {
        $services = Service::all();
        $updated = 0;

        foreach ($services as $service) {
            $newName = $this->sanitizeName($service->name);
            $newCategory = $this->sanitizeName($service->category);

            if ($newName !== $service->name || $newCategory !== $service->category) {
                $service->update([
                    'name' => $newName, 
                    'category' => $newCategory,
                    'platform' => $this->detectPlatform($newCategory)
                ]);
                $updated++;
            }
        }

        return response()->json(['success' => true, 'total' => $services->count(), 'updated' => $updated]);
    }

    public function updateMarkup(Request $request)
    {
        $validated = $request->validate([
            'markup_percent' => 'required|numeric|min:0|max:1000',
            'platform' => 'nullable|string',
            'category' => 'nullable|string',
        ]);

        $query = Service::query();
        if ($request->has('platform')) {
            $query->where('platform', $request->platform);
        }
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Store markup in system settings
        \App\Models\SystemSetting::set('markup_percent', $validated['markup_percent']);

        return response()->json(['message' => 'Markup updated', 'markup_percent' => $validated['markup_percent']]);
    }

    private function sanitizeName(string $name): string
    {
        $replacements = [
            ['/\[BOTS?\]/i', '[Automated]'],
            ['/\[FAKE\]/i', ''],
            ['/\bbot(s)?\b/i', 'automated'],
            ['/\bfake\b/i', ''],
            ['/\bcheap\b/i', 'value'],
            ['/\bspam\b/i', ''],
            ['/\bno drop\b/i', 'stable retention'],
            ['/\binstant\b/i', 'fast'],
            ['/\bFollowers\b/i', 'Audience Growth'],
            ['/\bLikes\b/i', 'Engagement Boost'],
            ['/\bViews\b/i', 'Reach Amplification'],
            ['/\bSubscribers\b/i', 'Channel Growth'],
        ];

        $result = $name;
        foreach ($replacements as [$pattern, $replacement]) {
            $result = preg_replace($pattern, $replacement, $result);
        }

        return trim(preg_replace('/\s{2,}/', ' ', $result));
    }

    private function detectPlatform(string $category): string
    {
        $category = strtolower($category);
        
        // Instagram
        if (str_contains($category, 'instagram') || str_contains($category, 'ig ') || str_contains($category, 'ig-') || str_contains($category, 'ig[')) return 'Instagram';
        
        // YouTube
        if (str_contains($category, 'youtube') || str_contains($category, 'yt ') || str_contains($category, 'yt-') || str_contains($category, 'yt[')) return 'YouTube';
        
        // TikTok
        if (str_contains($category, 'tiktok') || str_contains($category, 'tt ') || str_contains($category, 'tt-') || str_contains($category, 'tt[')) return 'TikTok';
        
        // Twitter/X
        if (str_contains($category, 'twitter') || str_contains($category, 'x.com') || str_contains($category, 'tw ') || str_contains($category, 'tw-') || str_contains($category, ' x ')) return 'Twitter';
        
        // Facebook
        if (str_contains($category, 'facebook') || str_contains($category, 'fb ') || str_contains($category, 'fb-') || str_contains($category, 'fb[') || str_contains($category, 'meta')) return 'Facebook';
        
        // Telegram
        if (str_contains($category, 'telegram') || str_contains($category, 'tg ') || str_contains($category, 'tg-') || str_contains($category, 'tg[')) return 'Telegram';
        
        // Others
        if (str_contains($category, 'spotify')) return 'Spotify';
        if (str_contains($category, 'linkedin') || str_contains($category, 'li-')) return 'LinkedIn';
        if (str_contains($category, 'google') || str_contains($category, 'gmb') || str_contains($category, 'reviews')) return 'Google';
        if (str_contains($category, 'discord')) return 'Discord';
        if (str_contains($category, 'twitch')) return 'Twitch';
        if (str_contains($category, 'snapchat') || str_contains($category, 'snap ') || str_contains($category, 'snap-')) return 'Snapchat';
        
        return 'Other';
    }
}
