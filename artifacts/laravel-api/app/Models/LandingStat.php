<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingStat extends Model
{
    protected $table = 'landing_stats';

    protected $fillable = [
        'key',
        'value',
        'label',
        'suffix',
    ];
}
