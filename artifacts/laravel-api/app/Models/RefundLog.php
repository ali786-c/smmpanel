<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RefundLog extends Model
{
    protected $table = 'refund_log';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id', 'order_id', 'user_id', 'amount', 'reason',
        'provider_refund_id', 'status', 'created_at',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
        'created_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
