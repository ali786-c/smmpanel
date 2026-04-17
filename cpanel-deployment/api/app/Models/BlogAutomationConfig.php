<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BlogAutomationConfig extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'is_enabled', 'frequency', 'social_channels', 'last_run_at'];

    protected $casts = [
        'is_enabled' => 'boolean',
        'social_channels' => 'array',
        'last_run_at' => 'datetime',
    ];
}
