<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsappChannel;
use App\Models\WhatsappInstance;
use App\Services\EvolutionService;
use App\Jobs\SendChannelPostJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ChannelController extends Controller
{
    protected EvolutionService $evolution;

    public function __construct(EvolutionService $evolution)
    {
        $this->evolution = $evolution;
    }

    /**
     * List all channels the user has synced.
     */
    public function index()
    {
        return Auth::user()->whatsappChannels()
            ->with('whatsappInstance:id,name,status')
            ->latest()
            ->get();
    }

    /**
     * Detect channels for a given WhatsApp instance.
     * Syncs them into the DB and returns the full list.
     */
    public function detect(Request $request, WhatsappInstance $instance)
    {
        $this->authorize('view', $instance);

        $channels = $this->evolution->fetchChannels($instance->name);

        if (empty($channels)) {
            return response()->json([
                'channels' => [],
                'has_channels' => false,
                'message' => "Aucune chaîne détectée pour cette instance. Vous pouvez en créer une."
            ]);
        }

        $synced = [];
        foreach ($channels as $ch) {
            $jid = $ch['id'] ?? $ch['jid'] ?? null;
            $name = $ch['name'] ?? $ch['subject'] ?? 'Chaîne sans nom';
            $description = $ch['description'] ?? '';
            $picture = $ch['picture'] ?? $ch['pictureUrl'] ?? null;
            $subscribers = $ch['subscribers'] ?? $ch['subscribersCount'] ?? 0;

            if (!$jid) continue;

            $channel = WhatsappChannel::updateOrCreate(
                ['channel_jid' => $jid],
                [
                    'user_id' => Auth::id(),
                    'whatsapp_instance_id' => $instance->id,
                    'name' => $name,
                    'description' => $description,
                    'picture_url' => $picture,
                    'subscribers_count' => $subscribers,
                    'is_owner' => $ch['role'] === 'OWNER' || ($ch['isOwner'] ?? false),
                    'status' => 'active',
                ]
            );
            $synced[] = $channel;
        }

        return response()->json([
            'channels' => $synced,
            'has_channels' => true,
            'message' => count($synced) . " chaîne(s) synchronisée(s)."
        ]);
    }

    /**
     * Create a new WhatsApp Channel via Evolution API.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'instance_id' => [
                'required',
                Rule::exists('whatsapp_instances', 'id')->where('user_id', Auth::id()),
            ],
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $instance = WhatsappInstance::findOrFail($validated['instance_id']);

        $result = $this->evolution->createChannel(
            $instance->name,
            $validated['name'],
            $validated['description'] ?? ''
        );

        if (!$result || !isset($result['id'])) {
            return response()->json([
                'message' => "Impossible de créer la chaîne. Vérifiez que l'instance est connectée."
            ], 422);
        }

        $channel = WhatsappChannel::create([
            'user_id' => Auth::id(),
            'whatsapp_instance_id' => $instance->id,
            'channel_jid' => $result['id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'picture_url' => $result['picture'] ?? null,
            'invite_link' => $result['inviteLink'] ?? $result['invite'] ?? null,
            'subscribers_count' => 0,
            'is_owner' => true,
            'status' => 'active',
        ]);

        return response()->json([
            'message' => "Chaîne '{$validated['name']}' créée avec succès !",
            'channel' => $channel,
        ], 201);
    }

    /**
     * Show a channel.
     */
    public function show(WhatsappChannel $channel)
    {
        $this->authorize('view', $channel);
        return $channel->load('whatsappInstance:id,name,status');
    }

    /**
     * Publish a post to one or multiple channels (immediate or scheduled).
     */
    public function publish(Request $request)
    {
        $validated = $request->validate([
            'channel_ids' => 'required|array|min:1',
            'channel_ids.*' => [
                'integer',
                Rule::exists('whatsapp_channels', 'id')->where('user_id', Auth::id()),
            ],
            'content' => 'required_without:media_urls|nullable|string',
            'media_urls' => 'nullable|array',
            'content_type' => 'nullable|string|in:text,image,video,document',
            'scheduled_at' => 'nullable|date',
        ]);

        $channels = WhatsappChannel::whereIn('id', $validated['channel_ids'])->with('whatsappInstance')->get();
        $scheduledAt = !empty($validated['scheduled_at']) ? \Carbon\Carbon::parse($validated['scheduled_at']) : null;

        $dispatched = 0;
        foreach ($channels as $channel) {
            $delay = $scheduledAt && $scheduledAt->isFuture() ? $scheduledAt : null;

            SendChannelPostJob::dispatch(
                $channel,
                $validated['content'] ?? '',
                $validated['media_urls'] ?? [],
                $validated['content_type'] ?? 'text'
            )->delay($delay);

            $dispatched++;
        }

        $msg = $scheduledAt && $scheduledAt->isFuture()
            ? "{$dispatched} publication(s) planifiée(s) pour le {$scheduledAt->format('d/m/Y à H:i')}."
            : "{$dispatched} publication(s) en cours d'envoi.";

        return response()->json(['message' => $msg]);
    }

    /**
     * Delete a channel record (does not delete the actual WhatsApp channel).
     */
    public function destroy(WhatsappChannel $channel)
    {
        $this->authorize('delete', $channel);
        $channel->delete();
        return response()->json(['message' => 'Chaîne supprimée de la liste.']);
    }
}
