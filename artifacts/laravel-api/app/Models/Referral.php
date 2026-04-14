<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    protected $table = 'referrals';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'referrer_id', 'referred_id', 'commission_rate',
        'total_earnings', 'status',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:4',
        'total_earnings' => 'decimal:4',
    ];

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referred()
    {
        return $this->belongsTo(User::class, 'referred_id');
    }
}
