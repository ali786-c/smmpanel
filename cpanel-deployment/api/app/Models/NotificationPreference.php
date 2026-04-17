<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    use HasUuids;

    protected $fillable = [
        'id', 'user_id', 'order_updates', 'promotions',
        'announcements', 'ticket_replies',
    ];

    protected $casts = [
        'order_updates' => 'boolean',
        'promotions' => 'boolean',
        'announcements' => 'boolean',
        'ticket_replies' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
