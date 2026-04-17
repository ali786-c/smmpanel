<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TicketMessage extends Model
{
    use HasUuids;
    public $timestamps = false;

    protected $fillable = ['id', 'ticket_id', 'sender', 'content', 'created_at'];

    protected $appends = ['message', 'body'];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // Alias so frontend can use m.message ?? m.body ?? m.content interchangeably
    public function getMessageAttribute(): string
    {
        return $this->content ?? '';
    }

    public function getBodyAttribute(): string
    {
        return $this->content ?? '';
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }
}
