<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasUuids;
    public $timestamps = false;

    protected $fillable = [
        'id', 'actor_id', 'action', 'target_type', 'target_id',
        'details', 'ip_address', 'created_at',
    ];

    protected $casts = [
        'details' => 'array',
        'created_at' => 'datetime',
    ];

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
