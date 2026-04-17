<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BlogKeyword extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'keyword', 'status', 'last_used_at'];

    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    public function posts()
    {
        return $this->hasMany(BlogPost::class, 'keyword_id');
    }
}
