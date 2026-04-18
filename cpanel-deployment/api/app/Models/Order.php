<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'user_id', 'service_id', 'external_order_id', 'provider_order_id', 'link',
        'quantity', 'cost', 'provider_cost', 'status', 'start_count',
        'remains', 'coupon_id', 'notes', 'refund_status',
        'speedup_requested_at', 'cancel_requested_at', 'cancel_request_status', 'stale_pinged_at',
    ];

    protected $casts = [
        'cost' => 'decimal:4',
        'provider_cost' => 'decimal:4',
        'quantity' => 'integer',
        'start_count' => 'integer',
        'remains' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class, 'coupon_id');
    }
}
