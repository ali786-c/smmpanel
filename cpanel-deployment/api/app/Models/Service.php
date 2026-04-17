<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasUuids;

    protected $fillable = [
        'id', 'external_service_id', 'name', 'category', 'platform',
        'type', 'rate', 'min_order', 'max_order', 'refill', 'cancel',
        'health_score', 'is_active', 'display_order',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'refill' => 'boolean',
        'cancel' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
