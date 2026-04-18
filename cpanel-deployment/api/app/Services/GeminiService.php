<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class GeminiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key', env('GOOGLE_GEMINI_API_KEY'));
    }

    /**
     * Generate text using Gemini models.
     */
    public function generateText(string $prompt, string $model = 'gemini-flash-latest'): string
    {
        try {
            $response = Http::withOptions(['verify' => false])
                ->post("{$this->baseUrl}{$model}:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 4096,
                ]
            ]);

            if ($response->failed()) {
                Log::channel('automation')->error('Gemini API Text Error: ' . $response->body());
                throw new Exception('Gemini API failed to generate text: ' . $response->json('error.message', 'Unknown error'));
            }

            return $response->json('candidates.0.content.parts.0.text', '');
        } catch (Exception $e) {
            Log::channel('automation')->error('Gemini Service Exception: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate image using Gemini multimodal or Imagen.
     */
    public function generateImage(string $prompt, string $model = 'gemini-3.1-flash-image-preview'): ?string
    {
        try {
            $response = Http::withOptions(['verify' => false])
                ->post("{$this->baseUrl}{$model}:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if ($response->failed()) {
                Log::channel('automation')->error('Gemini API Image Error: ' . $response->body());
                return null;
            }

            // Correct path for multimodal models (camelCase)
            return $response->json('candidates.0.content.parts.0.inlineData.data'); 
        } catch (Exception $e) {
            Log::channel('automation')->error('Gemini Image Service Exception: ' . $e->getMessage());
            return null;
        }
    }
}
