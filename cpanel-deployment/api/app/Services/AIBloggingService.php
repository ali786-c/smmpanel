<?php

namespace App\Services;

use App\Models\BlogKeyword;
use App\Models\BlogPost;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class AIBloggingService
{
    protected GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Master method to generate a full blog post for a given keyword.
     */
    public function generateFullBlog(BlogKeyword $keyword): ?BlogPost
    {
        Log::channel('ai_automation')->info(">>> Starting AI Blog Generation for keyword: [{$keyword->keyword}]");
        $this->updateProgress(10, "Defining content strategy...");

        try {
            // 1. Step: Mapping Strategy
            Log::channel('ai_automation')->debug("Step 1: Requesting SEO Strategy from Gemini...");
            $strategyPrompt = "Create an SEO strategy for a blog post about '{$keyword->keyword}'. Identify target audience, pain points, and 3 key angles. Respond in JSON.";
            $strategyRaw = $this->gemini->generateText($strategyPrompt);
            $strategy = json_decode($strategyRaw, true);

            Log::channel('ai_automation')->debug("Strategy Generated.", ['strategy_preview' => substr($strategyRaw, 0, 200)]);

            $this->updateProgress(30, "Drafting content sections (JSON)...");

            // 2. Step: Structured Content Drafting
            Log::channel('ai_automation')->debug("Step 2: Drafting comprehensive content...");
            $draftPrompt = "Write a comprehensive blog post for '{$keyword->keyword}' based on this strategy: " . json_encode($strategy) . ". 
            Format as JSON with keys: title, slug, hook, intro, sections (array of {heading, body}), takeaways (array), faqs (array of {q, a}), meta_title, meta_description, cta_text.";
            
            $draftJson = $this->gemini->generateText($draftPrompt);
            $draft = json_decode($draftJson, true);

            if (!$draft || !isset($draft['title'])) {
                Log::channel('ai_automation')->error("JSON Parse Error or Empty Draft.", ['raw_response' => $draftJson]);
                throw new \Exception("Failed to generate a valid JSON draft.");
            }

            Log::channel('ai_automation')->info("Content Drafted: {$draft['title']}");

            $this->updateProgress(50, "Generating premium featured image...");

            // 3. Step: Visual Engine (Image Gen)
            Log::channel('ai_automation')->debug("Step 3: Requesting AI Image Generation...");
            $imagePrompt = "A premium, high-quality, professional 16:9 featured image for a blog post titled: '{$draft['title']}'. Style: Minimalistic, Corporate, Modern.";
            $base64Image = $this->gemini->generateImage($imagePrompt);
            
            if (!$base64Image) {
                Log::channel('ai_automation')->warning("Image generation returned empty. Using placeholder fallback.");
            }

            $imageUrl = $this->storeImage($base64Image, $draft['slug']);
            Log::channel('ai_automation')->info("Image Stored: {$imageUrl}");

            $this->updateProgress(70, "Rendering premium magazine UI...");

            // 4. Step: Programmatic Rendering
            Log::channel('ai_automation')->debug("Step 4: Rendering HTML content via BlogRenderer...");
            $renderer = app(BlogRenderer::class);
            $htmlContent = $renderer->render($draft, $imageUrl);

            $this->updateProgress(90, "Saving to database...");

            // 5. Step: Database persistence
            Log::channel('ai_automation')->debug("Step 5: Persisting to database...");
            $post = BlogPost::create([
                'id' => (string) Str::uuid(),
                'title' => $draft['title'],
                'slug' => $draft['slug'] . '-' . rand(100, 999),
                'content' => $htmlContent,
                'excerpt' => $draft['hook'] ?? substr($draft['intro'] ?? '', 0, 160),
                'category' => 'AI Insights',
                'tags' => ['automation', 'ai-generated', $keyword->keyword],
                'status' => 'published',
                'meta_title' => $draft['meta_title'] ?? $draft['title'],
                'meta_description' => $draft['meta_description'] ?? '',
                'read_time' => ceil(str_word_count(strip_tags($htmlContent)) / 200),
                'published_at' => now(),
                'featured_image' => $imageUrl,
                'is_ai_generated' => true,
                'keyword_id' => $keyword->id,
            ]);

            // Mark keyword as used
            $keyword->update(['last_used_at' => now()]);

            Log::channel('ai_automation')->info("SUCCESS: Blog Post created with ID: {$post->id}");
            $this->updateProgress(100, "Publication Complete!");
            return $post;

        } catch (\Exception $e) {
            Log::channel('ai_automation')->critical("AIBloggingService CRASH: " . $e->getMessage(), [
                'exception' => $e,
                'keyword' => $keyword->keyword
            ]);
            $this->updateProgress(0, "Error: " . $e->getMessage());
            return null;
        }
    }

    private function storeImage(?string $base64, string $slug): ?string
    {
        if (!$base64) return null;

        $fileName = 'blog_' . $slug . '_' . time() . '.png';
        $path = 'public/blog_images/' . $fileName;
        
        Storage::put($path, base64_decode($base64));
        Log::channel('ai_automation')->debug("File written to storage: {$path}");
        return Storage::url($path);
    }

    private function updateProgress(int $percent, string $status): void
    {
        Cache::put('ai_blog_progress', ['percent' => $percent, 'status' => $status], 3600);
    }
}
