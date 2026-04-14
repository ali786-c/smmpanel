<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $table = 'announcements';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'title', 'content', 'is_active', 'priority'];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];
}
