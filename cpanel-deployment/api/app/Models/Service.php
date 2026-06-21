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

    public function isPackage(): bool
    {
        if ($this->min_order === 1 && $this->max_order === 1) {
            return true;
        }

        $lowercaseName = strtolower($this->name);
        $lowercaseCategory = strtolower($this->category);

        if (str_contains($lowercaseCategory, 'subscription') || str_contains($lowercaseName, 'subscription')) {
            return true;
        }

        if (str_contains($lowercaseCategory, 'boost') || str_contains($lowercaseName, 'boost')) {
            if ($this->max_order <= 10) {
                return true;
            }
        }
        
        if (str_contains($lowercaseCategory, 'package') || str_contains($lowercaseName, 'package')) {
            if ($this->max_order <= 10) {
                return true;
            }
        }

        return false;
    }

    public function calculateCost(int $quantity): float
    {
        if ($this->isPackage()) {
            return round($this->rate * $quantity, 4);
        }
        return round(($this->rate / 1000) * $quantity, 4);
    }
}
