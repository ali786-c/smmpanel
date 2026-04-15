<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Testimonial extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'author_name',
        'author_handle',
        'avatar_seed',
        'platform',
        'rating',
        'content',
        'followers_count',
        'niche',
        'country_code',
        'featured',
        'reviewed_at',
    ];

    protected $casts = [
        'featured' => 'boolean',
        'reviewed_at' => 'datetime',
        'rating' => 'integer',
        'followers_count' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
}
