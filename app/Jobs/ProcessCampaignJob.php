<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\CampaignLog;
use App\Models\Message;
use App\Services\EvolutionService;
use App\Services\GuardianService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(
        protected Campaign $campaign,
        protected array $contactIds = []
    ) {}

    /**
     * Fix #10 & #11: Instead of sleep()-ing in a loop (which blocks the worker
     * and exceeds the 90s timeout), this job now dispatches individual
     * SendCampaignMessageJob for each message with incremental delays.
     */
    public function handle(EvolutionService $evolution, GuardianService $guardian): void
    {
        $this->log('info', 'STARTING', "Début du traitement de la campagne: {$this->campaign->name}");

        $this->campaign->update(['status' => 'processing']);
        $instance = $this->campaign->whatsappInstance;

        // Create individual messages if they don't exist yet (Background processing)
        if ($this->campaign->target_type === 'individual' && !empty($this->contactIds)) {
            $this->log('info', 'PREPARING', "Génération des messages pour " . count($this->contactIds) . " contacts.");
            
            foreach ($this->contactIds as $contactId) {
                $this->campaign->messages()->create([
                    'contact_id' => $contactId,
                    'status' => 'pending',
                    'body' => $this->campaign->content ?? '',
                    'media_urls' => $this->campaign->media_urls,
                    'content_type' => $this->campaign->content_type ?? 'text',
                ]);
            }
        }

        // Guardian safety checks
        if (!$guardian->isSafeHour()) {
            $this->log('warning', 'SAFE_HOUR', "Le Gardien reporte l'envoi (Hors horaires autorisés)");
            $this->campaign->update(['status' => 'pending']);
            // Re-dispatch for next safe window (8 AM)
            $nextSafeTime = now()->addDay()->startOfDay()->addHours(8);
            if (now()->hour < 8) {
                $nextSafeTime = now()->startOfDay()->addHours(8);
            }
            self::dispatch($this->campaign)->delay($nextSafeTime);
            return;
        }

        if (!$guardian->canSend($instance)) {
            $this->log('warning', 'DAILY_LIMIT', "Le Gardien bloque l'envoi (Limite quotidienne atteinte)");
            $this->campaign->update(['status' => 'pending']);
            $nextMorning = now()->addDay()->startOfDay()->addHours(8);
            self::dispatch($this->campaign)->delay($nextMorning);
            return;
        }

        if ($this->campaign->target_type === 'individual') {
            $messages = $this->campaign->messages()->where('status', 'pending')->with('contact')->get();
            $this->log('info', 'TARGETS', count($messages) . " contacts individuels détectés.");

            $delay = $guardian->getRecommendedDelay($instance);

            foreach ($messages as $index => $message) {
                SendCampaignMessageJob::dispatch($this->campaign, $message)
                    ->delay(now()->addSeconds($delay * $index));
            }
        } elseif ($this->campaign->target_type === 'group') {
            $groupIds = $this->campaign->group_ids ?? [];
            $this->log('info', 'TARGETS', count($groupIds) . " groupes détectés.");

            $delay = $guardian->getRecommendedDelay($instance);

            foreach ($groupIds as $index => $groupId) {
                SendCampaignGroupJob::dispatch($this->campaign, $groupId)
                    ->delay(now()->addSeconds($delay * $index));
            }
        } elseif ($this->campaign->target_type === 'channel') {
            $channelIds = $this->campaign->channel_jids ?? [];
            $channels = \App\Models\WhatsappChannel::whereIn('id', $channelIds)->get();
            $this->log('info', 'TARGETS', count($channels) . " chaîne(s) détectée(s).");

            foreach ($channels as $index => $channel) {
                SendChannelPostJob::dispatch(
                    $channel,
                    $this->campaign->content ?? '',
                    $this->campaign->media_urls ?? [],
                    $this->campaign->content_type ?? 'text'
                )->delay(now()->addSeconds(5 * $index)); // 5s entre chaque chaîne
            }
        }

        $this->log('info', 'DISPATCHED', "Tous les envois ont été planifiés.");
    }

    protected function log(string $type, string $event, string $message, ?int $messageId = null): void
    {
        CampaignLog::create([
            'campaign_id' => $this->campaign->id,
            'message_id' => $messageId,
            'type' => $type,
            'event' => $event,
            'message' => $message,
        ]);

        Log::channel('stack')->info("Campaign Log [{$event}]: {$message}");
    }
}
