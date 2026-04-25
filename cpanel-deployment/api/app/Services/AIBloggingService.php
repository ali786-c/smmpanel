<?php

namespace App\Services;

use App\Models\BlogKeyword;
use App\Models\BlogPost;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Exception;

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
     * The Full 8-Step "Nano Banana" Flow Adapted for UpgraderCX.
     */
    public function generateFullBlog(BlogKeyword $keywordModel): array
    {
        $keyword = $keywordModel->keyword;
        Log::channel('ai_automation')->info("Starting AI Blog Generation for keyword: {$keyword}");
        
        try {
            $this->updateProgress(1, "Planning content strategy...", 10);

            // Step 1: Strategy
            $strategyPrompt = "You are an expert content strategist and SEO specialist. 
            Create a detailed writing strategy for a blog post about: '{$keyword}'.
            Target: Premium, professional, authoritative tone.
            Return ONLY the strategy and outline.";
            
            $writingStrategy = $this->gemini->generateText($strategyPrompt);

            // Step 2: Content Drafting (JSON Generation)
            $this->updateProgress(2, "Drafting structured article...", 30);
            $draftPrompt = "You are a world-class blog writer. Write a comprehensive, high-quality article based on this strategy:
            Strategy: {$writingStrategy}
            
            STRICT RULES:
            1. Return ONLY a valid JSON object. No Markdown blocks (no ```json).
            2. Language: English.
            3. Sentiment: Positive, helpful, and authoritative.
            
            JSON SCHEMA:
            {
              \"title\": \"Catchy SEO Title\",
              \"hook\": \"A short 1-sentence powerful insight to hook the reader\",
              \"intro\": \"A professional 2-3 paragraph introduction\",
              \"takeaways\": [\"Insight 1\", \"Insight 2\", \"Insight 3\"],
              \"sections\": [
                { \"heading\": \"H2 Heading\", \"body\": \"Detailed body content with HTML paragraphs...\" },
                { \"heading\": \"H2 Heading\", \"body\": \"Detailed body content with HTML paragraphs...\" },
                { \"heading\": \"H2 Heading\", \"body\": \"Detailed body content with HTML paragraphs...\" }
              ],
              \"faqs\": [
                { \"q\": \"What is...?\", \"a\": \"Detailed answer...\" },
                { \"q\": \"How to...?\", \"a\": \"Detailed answer...\" }
              ],
              \"cta_text\": \"Original closing statement to encourage user engagement\"
            }";

            $jsonRaw = $this->gemini->generateText($draftPrompt);
            echo "AI Raw Response: " . substr($jsonRaw, 0, 500) . "...\n"; // Print first 500 chars for debugging
            $data = json_decode($this->cleanJson($jsonRaw), true);

            if (!$data || !isset($data['title'])) {
                echo "JSON Decode Error: " . json_last_error_msg() . "\n";
                // echo "Cleaned JSON Sample: " . substr($this->cleanJson($jsonRaw), 0, 200) . "...\n";
                Log::channel('ai_automation')->error("AI failed to generate valid JSON. Raw: " . $jsonRaw);
                throw new Exception("AI failed to generate valid structured data: " . json_last_error_msg());
            }

            // Step 3: Image Generation
            $this->updateProgress(3, "Generating premium featured image...", 50);
            $imagePrompt = "A high-quality, modern, professionally aesthetic featured image for a blog post titled: '{$data['title']}'. Theme: Digital growth, Social Media, Premium technology. Minimalist style.";
            $imageUrl = $this->processImage($imagePrompt);

            // Step 4: SEO Metadata
            $this->updateProgress(4, "Optimizing SEO and meta tags...", 70);
            $metaDescPrompt = "Create a compelling 150-character SEO meta description for this blog titled: " . $data['title'];
            $metaDescription = $this->gemini->generateText($metaDescPrompt);

            // Step 5: Rendering
            $this->updateProgress(5, "Rendering premium template...", 85);
            $htmlContent = $this->renderer->render($data, $imageUrl);

            // Step 6: Persistence
            $this->updateProgress(6, "Saving to database...", 95);
            $blogPost = BlogPost::create([
                'id' => (string) Str::uuid(),
                'title' => $data['title'],
                'slug' => Str::slug($data['title']) . '-' . Str::random(6),
                'content' => $htmlContent,
                'excerpt' => $data['hook'] ?? Str::limit(strip_tags($data['intro']), 160),
                'status' => 'published',
                'meta_title' => $data['title'],
                'meta_description' => trim($metaDescription) ?: $data['hook'],
                'featured_image' => $imageUrl,
                'is_ai_generated' => true,
                'keyword_id' => $keywordModel->id,
                'published_at' => now(),
            ]);

            // Update keyword
            $keywordModel->update(['last_used_at' => now()]);

            $this->updateProgress(7, "Generation complete!", 100, false);
            
            return [
                'id' => $blogPost->id,
                'title' => $blogPost->title,
                'status' => 'success'
            ];

        } catch (Exception $e) {
            Log::channel('ai_automation')->error("AIBloggingService Error: " . $e->getMessage());
            $this->updateProgress(0, "Error: " . $e->getMessage(), 0, false);
            throw $e;
        }
    }

    protected function updateProgress(int $step, string $message, int $percentage, bool $active = true): void
    {
        Cache::put('ai_blog_progress', [
            'active' => $active,
            'step' => $step,
            'status' => $message,
            'percent' => $percentage,
            'last_updated' => now()->toISOString()
        ], 600);
    }

    protected function cleanJson(string $json): string
    {
        $json = preg_replace('/```json|```/', '', $json);
        $start = strpos($json, '{');
        $end = strrpos($json, '}');
        if ($start !== false && $end !== false) {
            return substr($json, $start, $end - $start + 1);
        }
        return trim($json);
    }

    protected function processImage(string $prompt): string
    {
        try {
            $base64 = $this->gemini->generateImage($prompt);
            if (!$base64) return '/opengraph.jpg';

            $filename = 'ai_blog_' . uniqid() . '.png';
            $storagePath = public_path('storage/blog_images');
            
            if (!file_exists($storagePath)) {
                mkdir($storagePath, 0755, true);
            }
            
            file_put_contents($storagePath . '/' . $filename, base64_decode($base64));

            return '/api/public/storage/blog_images/' . $filename;
        } catch (Exception $e) {
            Log::channel('ai_automation')->error("Image processing failed: " . $e->getMessage());
            return '/opengraph.jpg';
        }
    }
}
