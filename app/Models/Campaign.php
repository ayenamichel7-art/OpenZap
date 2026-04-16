<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    protected $fillable = [
        'user_id',
        'whatsapp_instance_id',
        'name',
        'content',
        'status',
        'scheduled_at',
        'media_urls',
        'content_type',
        'target_type',
        'group_ids',
        'channel_jids',
        'timezone',
        'settings'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'settings' => 'json',
        'media_urls' => 'json',
        'group_ids' => 'json',
        'channel_jids' => 'json',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function whatsappInstance()
    {
        return $this->belongsTo(WhatsappInstance::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function logs()
    {
        return $this->hasMany(CampaignLog::class);
    }
}
