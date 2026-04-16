<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\CampaignLog;
use App\Services\EvolutionService;
use App\Services\GuardianService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendCampaignGroupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(
        protected Campaign $campaign,
        protected string $groupId
    ) {}

    public function handle(EvolutionService $evolution, GuardianService $guardian): void
    {
        $this->campaign->refresh();
        if ($this->campaign->status === 'cancelled') {
            return;
        }

        $instance = $this->campaign->whatsappInstance;

        if (!$guardian->isSafeHour()) {
            $this->release(600);
            return;
        }

        $text = $guardian->applySpintax($this->campaign->content);

        try {
            $mediaUrls = $this->campaign->media_urls ?? [];

            if (empty($mediaUrls)) {
                $evolution->sendMessage($instance->name, $this->groupId, $text);
            } else {
                $evolution->sendMedia($instance->name, $this->groupId, $mediaUrls[0], $this->campaign->content_type, $text);

                for ($i = 1; $i < count($mediaUrls); $i++) {
                    usleep(500000);
                    $evolution->sendMedia($instance->name, $this->groupId, $mediaUrls[$i], $this->campaign->content_type, "");
                }
            }

            $this->log('success', 'SENT', "Message publié dans le groupe {$this->groupId}");

        } catch (\Exception $e) {
            $this->log('error', 'FAILED', "Erreur groupe {$this->groupId}: " . $e->getMessage());
        }
    }

    protected function log(string $type, string $event, string $message): void
    {
        CampaignLog::create([
            'campaign_id' => $this->campaign->id,
            'type' => $type,
            'event' => $event,
            'message' => $message,
        ]);

        Log::channel('stack')->info("Campaign Log [{$event}]: {$message}");
    }
}
