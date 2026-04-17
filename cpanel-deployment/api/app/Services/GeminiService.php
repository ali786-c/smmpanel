<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';

    public function __construct()
    {
        // Prioritize config, fallback to env directly
        $this->apiKey = config('services.gemini.key', env('GOOGLE_GEMINI_API_KEY', ''));
    }

    /**
     * Generate content using Gemini text models.
     */
    public function generateText(string $prompt, string $model = 'gemini-1.5-flash-latest'): string
    {
        try {
            $response = Http::withOptions(['verify' => false])
                ->post("{$this->baseUrl}{$model}:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ],
                    'generationConfig' => [
                        'response_mime_type' => 'application/json', // We want structured JSON drafts
                    ]
                ]);

            if ($response->failed()) {
                Log::channel('ai_automation')->error('Gemini API Error (Text): Status ' . $response->status() . ' - ' . $response->body());
                return '';
            }

            $text = $response->json('candidates.0.content.parts.0.text', '');
            if (empty($text)) {
                Log::channel('ai_automation')->warning('Gemini API returned empty text. Raw Body: ' . $response->body());
            }

            return $text;
        } catch (\Exception $e) {
            Log::channel('ai_automation')->error('Gemini Service Exception (Text): ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Generate images using Gemini multimodal or specific image models.
     * Note: gemini-3.1-flash-image-preview usually returns base64.
     */
    public function generateImage(string $prompt, string $model = 'gemini-3.1-flash-image-preview'): ?string
    {
        try {
            $response = Http::withOptions(['verify' => false])
                ->post("{$this->baseUrl}{$model}:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ]
                ]);

            if ($response->failed()) {
                Log::error('Gemini API Error (Image): ' . $response->body());
                return null;
            }

            // Based on documentation provided:
            return $response->json('candidates.0.content.parts.0.inlineData.data');
        } catch (\Exception $e) {
            Log::error('Gemini Service Exception (Image): ' . $e->getMessage());
            return null;
        }
    }
}
