<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CampaignLog extends Model
{
    protected $fillable = [
        'campaign_id',
        'message_id',
        'type',
        'event',
        'message',
        'data'
    ];

    protected $casts = [
        'data' => 'json'
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function message()
    {
        return $this->belongsTo(Message::class);
    }
}
