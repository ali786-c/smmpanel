<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FavoriteService extends Model
{
    protected $table = 'favorite_services';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id', 'user_id', 'service_id'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }
}
