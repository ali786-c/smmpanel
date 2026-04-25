<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BlogAutomationConfig;
use App\Models\BlogKeyword;
use App\Services\AIBloggingService;
use Illuminate\Support\Facades\Log;

class BlogAutomationCron extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'blog:automation-cron';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Trigger the AI Auto-Blogging engine based on configured frequency.';

    /**
     * Execute the console command.
     */
    public function handle(AIBloggingService $aiService)
    {
        Log::channel('ai_automation')->info("[CRON] Heartbeat: Checking for pending blog automation...");

        $config = BlogAutomationConfig::first();

        if (!$config || !$config->is_enabled) {
            Log::channel('ai_automation')->warning("[CRON] Automation is disabled or not configured.");
            $this->warn('AI Auto-Blogging is disabled.');
            return;
        }

        // PREVENTION: If we already ran today, skip. 
        // This allows the cron to run every 5 mins without double-posting.
        if ($config->last_run_at && $config->last_run_at->isToday()) {
            Log::channel('ai_automation')->info("[CRON] Already ran today at {$config->last_run_at}. Skipping.");
            return;
        }

        // Logic: Pick the Least Recently Used (LRU) active keyword
        $keyword = BlogKeyword::where('status', 'active')
            ->orderBy('last_used_at', 'asc')
            ->first();

        if (!$keyword) {
            Log::channel('ai_automation')->error("[CRON] No active keywords found in database.");
            $this->error('No active keywords found.');
            return;
        }

        Log::channel('ai_automation')->info("[CRON] Decided to generate blog for keyword: [{$keyword->keyword}]");
        $this->info("Generating blog for: {$keyword->keyword}...");

        $post = $aiService->generateFullBlog($keyword);

        if ($post) {
            // Update last run time
            $config->update(['last_run_at' => now()]);
            
            Log::channel('ai_automation')->info("[CRON] SUCCESS: Automated post published [{$post->slug}]");
            $this->info("Success! Post created: {$post->title}");
        } else {
            Log::channel('ai_automation')->error("[CRON] FAILURE: AI Service returned null for [{$keyword->keyword}]");
            $this->error('Failed to generate blog post.');
        }
    }
}
