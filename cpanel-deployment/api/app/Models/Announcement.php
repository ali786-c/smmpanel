<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'title', 'content', 'is_active', 'priority'];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];
}
