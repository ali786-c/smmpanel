<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    protected $table = 'blog_posts';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'title', 'slug', 'content', 'excerpt', 'category',
        'tags', 'status', 'meta_title', 'meta_description',
        'read_time', 'published_at', 'featured_image',
        'is_ai_generated', 'keyword_id',
    ];

    protected $casts = [
        'tags' => 'array',
        'published_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::created(function (self $post) {
            if ($post->status === 'published') {
                $post->sendToDiscord();
            }
        });

        static::updated(function (self $post) {
            // If status changed to published just now
            if ($post->isDirty('status') && $post->status === 'published') {
                $post->sendToDiscord();
            }
        });
    }

    public function sendToDiscord()
    {
        $webhookUrl = config('services.discord.webhook_url');
        if (!$webhookUrl) {
            return ['success' => false, 'message' => 'Discord Webhook URL not configured in .env'];
        }

        $blogUrl = config('app.frontend_url', 'https://emazingsm.com') . '/blog/' . $this->slug;

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(10)->post($webhookUrl, [
                'embeds' => [[
                    'title' => "📰 New Blog Post: " . $this->title,
                    'description' => $this->excerpt ?: \Illuminate\Support\Str::limit(strip_tags($this->content), 200),
                    'url' => $blogUrl,
                    'color' => 0x5865F2, // Discord Blue
                    'fields' => [
                        ['name' => 'Category', 'value' => $this->category ?? 'General', 'inline' => true],
                        ['name' => 'Read Time', 'value' => "{$this->read_time} min", 'inline' => true],
                    ],
                    'timestamp' => now()->toIso8601String(),
                    'footer' => [
                        'text' => 'emazingSM Blog Updates',
                    ]
                ]]
            ]);

            if ($response->successful()) {
                return ['success' => true, 'message' => 'Notification sent successfully'];
            }

            return ['success' => false, 'message' => 'Discord API error: ' . $response->body()];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to connect to Discord: ' . $e->getMessage()];
        }
    }
}
