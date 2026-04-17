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
    protected BlogRenderer $renderer;

    public function __construct(GeminiService $gemini, BlogRenderer $renderer)
    {
        $this->gemini = $gemini;
        $this->renderer = $renderer;
    }

    /**
     * The 8-Step "Nano Banana" AI Generation Engine.
     */
    public function generateFullBlog(BlogKeyword $keyword): ?BlogPost
    {
        Log::channel('ai_automation')->info(">>> Starting NANO-BANANA Engine for: [{$keyword->keyword}]");
        $this->updateProgress(10, "Step 1/8: Content Strategy & Planning...");

        try {
            // 1. Content Strategy
            $strategyPrompt = "You are an expert content strategist. Create a detailed writing strategy for a blog post about: '{$keyword->keyword}'. Target Audience: Premium consumers. Return only the strategy outline.";
            $writingStrategy = $this->gemini->generateText($strategyPrompt);

            $this->updateProgress(30, "Step 2/8: Drafting Structured Content (JSON)...");

            // 2. Content Drafting (JSON)
            $draftPrompt = "You are a world-class blog writer. Write a comprehensive article based on this strategy: " . $writingStrategy . "
            STRICT RULES:
            1. Return ONLY valid JSON.
            2. JSON Schema:
            {
              \"title\": \"Catchy SEO Title\",
              \"hook\": \"A powerful 1-sentence hook\",
              \"intro\": \"A professional 2-paragraph introduction\",
              \"takeaways\": [\"Insight 1\", \"Insight 2\", \"Insight 3\"],
              \"sections\": [
                { \"heading\": \"H2 Heading\", \"body\": \"Detailed content...\" }
              ],
              \"faqs\": [
                { \"q\": \"Question?\", \"a\": \"Answer...\" }
              ],
              \"cta_text\": \"Engagement closing\"
            }";

            $jsonRaw = $this->gemini->generateText($draftPrompt);
            $data = json_decode($this->cleanJson($jsonRaw), true);

            if (!$data || !isset($data['title'])) {
                Log::channel('ai_automation')->error("Failed to decode JSON draft.", ['raw' => $jsonRaw]);
                throw new \Exception("AI failed to generate valid structured data.");
            }

            $this->updateProgress(50, "Step 4/8: Visual Strategy & Image Gen...");

            // 4. Image Generation
            $imagePrompt = "A premium, minimalist, modern 16:9 featured image for a blog post titled: '{$data['title']}'. Style: High-quality professional photography/3D.";
            $base64 = $this->gemini->generateImage($imagePrompt);
            $imageUrl = $this->storeImage($base64, $data['title']);

            $this->updateProgress(70, "Step 6/8: SEO Mastery & Meta Extraction...");

            // 6. SEO Extraction
            $metaPrompt = "Create a 150-char SEO meta description for this title: {$data['title']}";
            $metaDesc = $this->gemini->generateText($metaPrompt);

            $this->updateProgress(90, "Step 7/8: Rendering & Saving to DB...");

            // 7. Rendering
            $htmlContent = $this->renderer->render($data, $imageUrl);

            // 8. Persistence (Step 8)
            $post = BlogPost::create([
                'id' => (string) Str::uuid(),
                'title' => $data['title'],
                'slug' => Str::slug($data['title']) . '-' . rand(100, 999),
                'content' => $htmlContent,
                'excerpt' => $data['hook'] ?? substr($data['intro'] ?? '', 0, 160),
                'category' => 'AI Insights',
                'tags' => ['automation', 'ai-generated', $keyword->keyword],
                'status' => 'published',
                'meta_title' => $data['title'],
                'meta_description' => $metaDesc,
                'read_time' => ceil(str_word_count(strip_tags($htmlContent)) / 200),
                'published_at' => now(),
                'featured_image' => $imageUrl,
                'is_ai_generated' => true,
                'keyword_id' => $keyword->id,
            ]);

            $keyword->update(['last_used_at' => now()]);
            
            Log::channel('ai_automation')->info("SUCCESS: Nano-Banana Generation Complete. Post ID: {$post->id}");
            $this->updateProgress(100, "Publication Complete!");

            return $post;

        } catch (\Exception $e) {
            Log::channel('ai_automation')->critical("Nano-Banana ENGINE CRASH: " . $e->getMessage());
            $this->updateProgress(0, "Error: " . $e->getMessage());
            return null;
        }
    }

    protected function cleanJson(string $json): string
    {
        return preg_replace('/```json|```/', '', $json);
    }

    protected function storeImage(?string $base64, string $title): ?string
    {
        if (!$base64) return null;

        $fileName = 'blog_' . Str::slug($title) . '_' . time() . '.png';
        $directory = public_path('blog_images');
        
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        $path = $directory . '/' . $fileName;
        file_put_contents($path, base64_decode($base64));

        return '/blog_images/' . $fileName;
    }

    protected function updateProgress(int $percent, string $status): void
    {
        Cache::put('ai_blog_progress', ['percent' => $percent, 'status' => $status], 3600);
    }
}
