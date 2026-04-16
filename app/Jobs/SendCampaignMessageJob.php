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

class SendCampaignMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(
        protected Campaign $campaign,
        protected Message $message
    ) {}

    public function handle(EvolutionService $evolution, GuardianService $guardian): void
    {
        // Skip if already sent or campaign cancelled
        if ($this->message->status !== 'pending') {
            return;
        }

        $this->campaign->refresh();
        if ($this->campaign->status === 'cancelled') {
            return;
        }

        $instance = $this->campaign->whatsappInstance;

        // Guardian checks
        if (!$guardian->isSafeHour()) {
            $this->release(600); // Retry in 10 minutes
            return;
        }

        if (!$guardian->canSend($instance)) {
            $nextMorning = now()->addDay()->startOfDay()->addHours(8);
            $this->release($nextMorning->diffInSeconds(now()));
            return;
        }

        $text = $guardian->applySpintax($this->message->body);

        try {
            $mediaUrls = $this->campaign->media_urls ?? [];
            $response = null;

            if (empty($mediaUrls)) {
                $response = $evolution->sendMessage($instance->name, $this->message->contact->phone, $text);
            } else {
                // First media with caption
                $response = $evolution->sendMedia(
                    $instance->name,
                    $this->message->contact->phone,
                    $mediaUrls[0],
                    $this->campaign->content_type,
                    $text
                );

                // Additional media (carousel effect)
                for ($i = 1; $i < count($mediaUrls); $i++) {
                    usleep(500000); // 0.5s between carousel items (same recipient)
                    $evolution->sendMedia(
                        $instance->name,
                        $this->message->contact->phone,
                        $mediaUrls[$i],
                        $this->campaign->content_type,
                        ""
                    );
                }
            }

            $messageId = $response['key']['id'] ?? null;

            $this->log('success', 'SENT', "Message envoyé à {$this->message->contact->phone} (ID: {$messageId})", $this->message->id);

            $this->message->update([
                'status' => 'sent',
                'sent_at' => now(),
                'extra' => ['id' => $messageId]
            ]);

            // Check if all messages are done → mark campaign completed
            $this->checkCampaignCompletion();

        } catch (\Exception $e) {
            $this->log('error', 'FAILED', "Erreur: " . $e->getMessage(), $this->message->id);
            $this->message->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);
        }
    }

    protected function checkCampaignCompletion(): void
    {
        $pendingCount = $this->campaign->messages()->where('status', 'pending')->count();

        if ($pendingCount === 0) {
            $this->campaign->update(['status' => 'completed']);
            $this->log('success', 'COMPLETED', "Campagne terminée avec succès.");
        }
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
