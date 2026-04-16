<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappInstance extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'instance_id',
        'status',
        'token',
        'pairing_code',
        'linked_at',
        'daily_limit',
        'total_sent',
    ];

    protected $casts = [
        'linked_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function campaigns()
    {
        return $this->hasMany(Campaign::class);
    }

    public function channels()
    {
        return $this->hasMany(\App\Models\WhatsappChannel::class);
    }
}
