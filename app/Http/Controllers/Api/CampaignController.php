<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Message;
use App\Jobs\ProcessCampaignJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CampaignController extends Controller
{
    public function index()
    {
        return Auth::user()->campaigns()
            ->with(['whatsappInstance'])
            ->withCount([
                'messages',
                'messages as delivered_count' => function ($query) {
                    $query->where('status', 'delivered');
                },
                'messages as read_count' => function ($query) {
                    $query->where('status', 'read');
                }
            ])
            ->latest()
            ->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'whatsapp_instance_id' => [
                'required',
                Rule::exists('whatsapp_instances', 'id')->where('user_id', Auth::id()),
            ],
            'content' => 'required_without:media_urls|string',
            'media_urls' => 'nullable|array',
            'content_type' => 'nullable|string|in:text,image,video,audio,document',
            'target_type' => 'required|in:individual,group,channel',
            'contacts' => 'required_if:target_type,individual|array',
            'contacts.*' => [
                'integer',
                Rule::exists('contacts', 'id')->where('user_id', Auth::id()),
            ],
            'group_ids' => 'required_if:target_type,group|array',
            'channel_jids' => 'required_if:target_type,channel|array',
            'channel_jids.*' => [
                'integer',
                Rule::exists('whatsapp_channels', 'id')->where('user_id', Auth::id()),
            ],
            'scheduled_at' => 'nullable|date',
            'settings' => 'nullable|array'
        ]);

        $campaign = Auth::user()->campaigns()->create([
            'name' => $request->name,
            'whatsapp_instance_id' => $request->whatsapp_instance_id,
            'content' => $request->content ?? '',
            'media_urls' => $request->media_urls,
            'content_type' => $request->content_type ?? 'text',
            'target_type' => $request->target_type,
            'group_ids' => $request->group_ids,
            'channel_jids' => $request->channel_jids,
            'status' => 'pending',
            'scheduled_at' => $request->scheduled_at ?? now(),
        ]);

        // If individual, we store the contact IDs in a temporary field or just pass them to the job
        // To keep it simple and scalable, we pass the IDs to the processing job
        $contactIds = $request->target_type === 'individual' ? $request->contacts : [];

        // Dispatch the job (with delay if scheduled in the future)
        $scheduledAt = $request->scheduled_at ? \Carbon\Carbon::parse($request->scheduled_at) : now();
        
        if ($scheduledAt->isFuture()) {
            ProcessCampaignJob::dispatch($campaign, $contactIds)->delay($scheduledAt);
        } else {
            ProcessCampaignJob::dispatch($campaign, $contactIds);
        }

        return response()->json([
            'message' => 'Campagne créée et mise en file d\'attente.',
            'campaign' => $campaign
        ]);
    }

    public function show(Campaign $campaign)
    {
        $this->authorize('view', $campaign);
        return $campaign->load(['whatsappInstance', 'messages.contact']);
    }

    public function stats()
    {
        $userId = Auth::id();
        
        $totalSent = Message::whereHas('campaign', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })->where('status', 'sent')->count();

        $totalRead = Message::whereHas('campaign', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })->where('status', 'read')->count();

        $dailyStats = Message::whereHas('campaign', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })
        ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
        ->groupBy('date')
        ->orderBy('date', 'desc')
        ->limit(7)
        ->get();

        return response()->json([
            'total_sent' => $totalSent,
            'total_read' => $totalRead,
            'daily_stats' => $dailyStats->reverse()->values(),
        ]);
    }

    public function logs(Campaign $campaign)
    {
        $this->authorize('view', $campaign);
        $logs = $campaign->logs()->latest()->take(100)->get();
        return response()->json($logs);
    }

    public function update(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
        ]);

        $campaign->update($validated);
        return $campaign;
    }

    public function destroy(Campaign $campaign)
    {
        $this->authorize('delete', $campaign);
        $campaign->delete();
        return response()->json(['message' => 'Campaign deleted.']);
    }
}
