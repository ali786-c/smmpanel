<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AdminBlogController extends Controller
{
    public function index(Request $request)
    {
        $query = BlogPost::orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->get('per_page', 20)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:blog_posts,slug',
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'category' => 'nullable|string',
            'tags' => 'nullable|array',
            'status' => 'nullable|in:draft,published',
            'meta_title' => 'nullable|string',
            'meta_description' => 'nullable|string',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(6);
        }

        $words = str_word_count(strip_tags($validated['content']));
        $validated['read_time'] = max(1, (int) ceil($words / 200));
        $validated['status'] = $validated['status'] ?? 'published';

        if ($validated['status'] === 'published') {
            $validated['published_at'] = now();
        }

        $post = BlogPost::create(array_merge($validated, ['id' => (string) Str::uuid()]));
        return response()->json($post, 201);
    }

    public function update(Request $request, $id)
    {
        $post = BlogPost::findOrFail($id);
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'excerpt' => 'nullable|string',
            'category' => 'nullable|string',
            'tags' => 'nullable|array',
            'status' => 'nullable|in:draft,published',
            'meta_title' => 'nullable|string',
            'meta_description' => 'nullable|string',
        ]);

        if (!empty($validated['content'])) {
            $words = str_word_count(strip_tags($validated['content']));
            $validated['read_time'] = max(1, (int) ceil($words / 200));
        }

        if (!empty($validated['status']) && $validated['status'] === 'published' && !$post->published_at) {
            $validated['published_at'] = now();
        }

        $post->update(array_filter($validated, fn($v) => $v !== null));
        return response()->json($post);
    }

    public function destroy($id)
    {
        BlogPost::findOrFail($id)->delete();
        return response()->json(['message' => 'Blog post deleted']);
    }

    public function generateAI(Request $request)
    {
        $validated = $request->validate([
            'topic' => 'nullable|string',
            'language' => 'nullable|string|in:en,es,fr,de,it,pt,nl,tr,ru,ar,hi,bn,ko,ja',
        ]);

        $topic = $validated['topic'] ?? $this->randomTopic();
        $language = $validated['language'] ?? 'en';
        $apiKey = config('services.openai.key');

        if (!$apiKey) {
            return response()->json(['error' => 'AI API key not configured. Set OPENAI_API_KEY.'], 422);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => "You are a professional blog writer for emazingSM, a social media marketing platform. Write in {$language} language. Return a JSON object with: title (string), excerpt (string, max 200 chars), content (HTML string, 600-800 words), category (string), tags (array of strings, max 5), meta_title (string), meta_description (string, max 160 chars). Content should be educational and professional about social media marketing."],
                    ['role' => 'user', 'content' => "Write a blog post about: {$topic}"],
                ],
                'response_format' => ['type' => 'json_object'],
            ]);

            $data = $response->json();
            $blogData = json_decode($data['choices'][0]['message']['content'] ?? '{}', true);

            if (empty($blogData['title'])) {
                return response()->json(['error' => 'AI failed to generate content'], 500);
            }

            $slug = Str::slug($blogData['title']) . '-' . time();
            $words = str_word_count(strip_tags($blogData['content'] ?? ''));
            $readTime = max(1, (int) ceil($words / 200));

            $post = BlogPost::create([
                'id' => (string) Str::uuid(),
                'title' => $blogData['title'],
                'slug' => $slug,
                'content' => $blogData['content'] ?? '',
                'excerpt' => $blogData['excerpt'] ?? '',
                'category' => $blogData['category'] ?? 'Marketing',
                'tags' => $blogData['tags'] ?? [],
                'status' => 'published',
                'meta_title' => $blogData['meta_title'] ?? $blogData['title'],
                'meta_description' => $blogData['meta_description'] ?? $blogData['excerpt'] ?? '',
                'read_time' => $readTime,
                'published_at' => now(),
            ]);

            return response()->json($post, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Blog generation failed: ' . $e->getMessage()], 500);
        }
    }

    private function randomTopic(): string
    {
        $topics = [
            'Instagram marketing strategies for small businesses in 2026',
            'How to grow your TikTok audience organically',
            'YouTube content promotion best practices',
            'Social media campaign optimization tips',
            'Twitter/X engagement strategies for brands',
            'Facebook marketing ROI improvement techniques',
            'Content calendar planning for social media agencies',
            'Social media analytics and performance tracking guide',
            'Building a social media marketing agency from scratch',
            'Video marketing trends and content promotion strategies',
        ];
        return $topics[array_rand($topics)];
    }
}
