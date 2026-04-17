<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    use HasUuids;
    public $timestamps = false;

    protected $fillable = [
        'id', 'user_id', 'type', 'amount', 'description',
        'reference_id', 'payment_method', 'status', 'created_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
