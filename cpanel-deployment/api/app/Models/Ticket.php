<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $table = 'tickets';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'user_id', 'order_id', 'subject', 'status', 'priority',
        'ticket_type', 'provider_escalated', 'provider_ticket_ref',
        'escalated_at', 'auto_opened', 'linked_orders',
    ];

    protected $casts = [
        'linked_orders' => 'array',
        'escalated_at' => 'datetime',
        'auto_opened' => 'boolean',
        'provider_escalated' => 'boolean',
    ];

    protected $appends = ['linked_order_external_ids', 'order_external_id'];

    public function getOrderExternalIdAttribute()
    {
        if (empty($this->order_id)) {
            return null;
        }
        return \App\Models\Order::where('id', $this->order_id)->value('external_order_id');
    }

    public function getLinkedOrderExternalIdsAttribute()
    {
        $ids = $this->linked_orders;
        if (empty($ids)) {
            return [];
        }
        return \App\Models\Order::whereIn('id', $ids)
            ->whereNotNull('external_order_id')
            ->pluck('external_order_id')
            ->toArray();
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function order()
    {
        return $this->belongsTo(\App\Models\Order::class, 'order_id');
    }

    public function messages()
    {
        return $this->hasMany(TicketMessage::class, 'ticket_id');
    }
}
