<?php

namespace App\Jobs;

use App\Models\BlogKeyword;
use App\Services\AIBloggingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateAIBlogJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected BlogKeyword $keyword;

    /**
     * Create a new job instance.
     */
    public function __construct(BlogKeyword $keyword)
    {
        $this->keyword = $keyword;
    }

    /**
     * Execute the job.
     */
    public function handle(AIBloggingService $bloggingService): void
    {
        Log::channel('ai_automation')->info("Executing GenerateAIBlogJob for keyword: {$this->keyword->keyword}");

        try {
            $bloggingService->generateFullBlog($this->keyword);
        } catch (\Exception $e) {
            Log::channel('ai_automation')->error("Failed to execute GenerateAIBlogJob: " . $e->getMessage());
            $this->fail($e);
        }
    }
}
