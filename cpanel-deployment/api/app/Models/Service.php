<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $table = 'services';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'external_service_id', 'name', 'category', 'platform',
        'type', 'rate', 'provider_cost', 'min_order', 'max_order', 'refill', 'cancel',
        'health_score', 'is_active', 'display_order',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'provider_cost' => 'decimal:4',
        'refill' => 'boolean',
        'cancel' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
