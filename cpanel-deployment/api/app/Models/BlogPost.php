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
}
