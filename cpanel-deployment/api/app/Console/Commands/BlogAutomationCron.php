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

        // Logic: Pick the Least Recently Used (LRU) active keyword
        $keyword = BlogKeyword::where('status', 'active')
            ->orderBy('last_used_at', 'asc') // Nulls first or older dates first
            ->first();

        if (!$keyword) {
            Log::channel('ai_automation')->error("[CRON] No active keywords found in database.");
            $this->error('No active keywords found.');
            return;
        }

        Log::channel('ai_automation')->info("[CRON] Decided to generate blog for keyword: [{$keyword->keyword}]");
        $this->info("Generating blog for: {$keyword->keyword}...");

        // Dispatch synchronized for cPanel simplicity, or use a job if queues are ready
        $post = $aiService->generateFullBlog($keyword);

        if ($post) {
            Log::channel('ai_automation')->info("[CRON] SUCCESS: Automated post published [{$post->slug}]");
            $this->info("Success! Post created: {$post->title}");
        } else {
            Log::channel('ai_automation')->error("[CRON] FAILURE: AI Service returned null for [{$keyword->keyword}]");
            $this->error('Failed to generate blog post.');
        }
    }
}
