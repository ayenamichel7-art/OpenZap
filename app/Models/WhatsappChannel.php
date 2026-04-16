<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappChannel extends Model
{
    protected $fillable = [
        'user_id',
        'whatsapp_instance_id',
        'channel_jid',
        'name',
        'description',
        'picture_url',
        'subscribers_count',
        'invite_link',
        'is_owner',
        'status',
    ];

    protected $casts = [
        'is_owner' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function whatsappInstance()
    {
        return $this->belongsTo(WhatsappInstance::class);
    }
}
