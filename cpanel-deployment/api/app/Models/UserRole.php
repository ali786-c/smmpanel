<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserRole extends Model
{
    use HasUuids;
    protected $table = 'user_roles';
    public $timestamps = false;

    protected $fillable = ['id', 'user_id', 'role'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
