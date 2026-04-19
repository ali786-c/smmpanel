<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table = 'system_settings';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'key', 'value', 'description'];
    
    protected static function booted(): void
    {
        static::creating(function (self $setting) {
            if (empty($setting->id)) {
                $setting->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function set(string $key, $value, string $description = '')
    {
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'description' => $description]
        );
    }
}
