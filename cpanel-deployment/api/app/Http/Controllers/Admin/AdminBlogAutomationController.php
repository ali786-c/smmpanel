<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogKeyword;
use App\Models\BlogAutomationConfig;
use App\Jobs\GenerateAIBlogJob;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AdminBlogAutomationController extends Controller
{
    public function getConfig()
    {
        $config = BlogAutomationConfig::firstOrCreate(
            [],
            [
                'id' => (string) Str::uuid(),
                'is_enabled' => false,
                'frequency' => 'daily',
                'social_channels' => []
            ]
        );
        return response()->json($config);
    }

    public function updateConfig(Request $request)
    {
        $validated = $request->validate([
            'is_enabled' => 'nullable|boolean',
            'frequency' => 'nullable|string',
            'social_channels' => 'nullable|array',
        ]);

        $config = BlogAutomationConfig::first();
        $config->update($validated);

        return response()->json($config);
    }

    public function keywords()
    {
        return response()->json(BlogKeyword::orderBy('last_used_at', 'asc')->get());
    }

    public function addKeyword(Request $request)
    {
        $validated = $request->validate([
            'keyword' => 'required|string|unique:blog_keywords,keyword',
        ]);

        $keyword = BlogKeyword::create([
            'id' => (string) Str::uuid(),
            'keyword' => $validated['keyword'],
            'status' => 'active'
        ]);

        return response()->json($keyword, 201);
    }

    public function deleteKeyword($id)
    {
        BlogKeyword::findOrFail($id)->delete();
        return response()->json(['message' => 'Keyword removed']);
    }

    public function triggerNow(Request $request)
    {
        $keyword = null;
        if ($request->has('keyword_id')) {
            $keyword = BlogKeyword::findOrFail($request->keyword_id);
        } else {
            $keyword = BlogKeyword::where('status', 'active')->orderBy('last_used_at', 'asc')->first();
        }

        if (!$keyword) {
            return response()->json(['error' => 'No active keyword available'], 422);
        }

        Log::channel('ai_automation')->info("Triggering AI Blog Generation for keyword: '{$keyword->keyword}' (ID: {$keyword->id})");

        // Run synchronously for cPanel environments without dedicated queue workers
        GenerateAIBlogJob::dispatchSync($keyword);

        Log::channel('ai_automation')->info("Job completed synchronously.");

        return response()->json(['message' => "Generation completed for '{$keyword->keyword}'"]);
    }

    public function getProgress()
    {
        $progress = Cache::get('ai_blog_progress', ['percent' => 0, 'status' => 'Idle']);
        return response()->json($progress);
    }
}
