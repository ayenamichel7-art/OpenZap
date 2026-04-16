<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'campaign_id',
        'contact_id',
        'body',
        'status',
        'error_message',
        'sent_at',
        'delivered_at',
        'read_at',
        'extra',
        'media_urls',
        'content_type'
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
        'extra' => 'json',
        'media_urls' => 'json'
    ];

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }
}
