<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WhatsappChannel;

class WhatsappChannelPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, WhatsappChannel $channel): bool
    {
        return $user->id === $channel->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, WhatsappChannel $channel): bool
    {
        return $user->id === $channel->user_id;
    }

    public function delete(User $user, WhatsappChannel $channel): bool
    {
        return $user->id === $channel->user_id;
    }
}
