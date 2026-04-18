<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasUuids;

    protected $fillable = [
        'id', 'user_id', 'display_name', 'avatar_url', 'phone',
        'api_key', 'referral_code', 'total_visits', 'is_banned', 'ban_reason',
    ];

    protected $casts = [
        'is_banned' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
