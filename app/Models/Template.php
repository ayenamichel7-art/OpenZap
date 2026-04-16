<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $fillable = ['user_id', 'name', 'content', 'media_urls', 'category'];

    protected $casts = [
        'media_urls' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
