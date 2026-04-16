<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WhatsappInstance;
use App\Models\Campaign;
use App\Models\Message;
use App\Models\Contact;
use App\Models\WhatsappChannel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class AdminController extends Controller
{
    /**
     * Ensure the user is an admin before any action.
     */
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            abort_unless(Auth::check() && Auth::user()->is_admin, 403, 'Accès réservé aux administrateurs.');
            return $next($request);
        });
    }

    /**
     * Get platform overview statistics.
     * Fix #23: Cached for 60s to prevent DB hammering on admin dashboard refresh.
     */
    public function overview()
    {
        $data = Cache::remember('admin:overview', 60, function () {
            return [
                'platform' => [
                    'total_users' => User::count(),
                    'total_instances' => WhatsappInstance::count(),
                    'active_instances' => WhatsappInstance::where('status', 'connected')->count(),
                    'total_contacts' => Contact::count(),
                    'total_channels' => WhatsappChannel::count(),
                    'total_campaigns' => Campaign::count(),
                ],
                'messages' => [
                    'total' => Message::count(),
                    'sent' => Message::where('status', 'sent')->count(),
                    'read' => Message::where('status', 'read')->count(),
                    'failed' => Message::where('status', 'failed')->count(),
                    'pending' => Message::where('status', 'pending')->count(),
                ],
                'recent_users' => User::latest()->take(5)->get(['id', 'name', 'email', 'created_at']),
            ];
        });

        return response()->json($data);
    }
}
