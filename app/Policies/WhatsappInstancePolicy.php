<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WhatsappInstance;
use Illuminate\Auth\Access\Response;

class WhatsappInstancePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, WhatsappInstance $whatsappInstance): bool
    {
        return $user->id === $whatsappInstance->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, WhatsappInstance $whatsappInstance): bool
    {
        return $user->id === $whatsappInstance->user_id;
    }

    public function delete(User $user, WhatsappInstance $whatsappInstance): bool
    {
        return $user->id === $whatsappInstance->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, WhatsappInstance $whatsappInstance): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, WhatsappInstance $whatsappInstance): bool
    {
        return false;
    }
}
