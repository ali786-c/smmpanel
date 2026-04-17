<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PayHubTransaction extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'user_id',
        'order_id',
        'amount_usd',
        'amount_eur',
        'exchange_rate',
        'status',
        'payhub_ref',
        'card_last4',
        'card_brand',
        'card_holder_name',
        'invoice_no'
    ];

    protected $casts = [
        'amount_usd' => 'decimal:2',
        'amount_eur' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
