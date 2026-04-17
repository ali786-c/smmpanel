<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasUuids;
    public $timestamps = false;

    protected $fillable = [
        'id', 'user_id', 'title', 'message', 'type', 'link', 'read', 'created_at',
    ];

    protected $casts = [
        'read' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
