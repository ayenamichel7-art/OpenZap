<?php

namespace App\Jobs;

use App\Models\WhatsappChannel;
use App\Services\EvolutionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendChannelPostJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;

    public function __construct(
        protected WhatsappChannel $channel,
        protected string $content,
        protected array $mediaUrls,
        protected string $contentType = 'text'
    ) {}

    public function handle(EvolutionService $evolution): void
    {
        $instanceName = $this->channel->whatsappInstance->name;
        $jid = $this->channel->channel_jid;

        Log::info("Publishing to channel: {$this->channel->name} ({$jid})");

        try {
            if (empty($this->mediaUrls)) {
                // Text-only post
                $evolution->sendChannelText($instanceName, $jid, $this->content);
            } else {
                // First media with caption
                $evolution->sendChannelMedia(
                    $instanceName,
                    $jid,
                    $this->mediaUrls[0],
                    $this->contentType,
                    $this->content
                );

                // Additional media
                for ($i = 1; $i < count($this->mediaUrls); $i++) {
                    usleep(500000); // 0.5s between media items
                    $evolution->sendChannelMedia(
                        $instanceName,
                        $jid,
                        $this->mediaUrls[$i],
                        $this->contentType,
                        ''
                    );
                }
            }

            Log::info("Successfully published to channel: {$this->channel->name}");
        } catch (\Exception $e) {
            Log::error("Failed to publish to channel {$this->channel->name}: " . $e->getMessage());
            throw $e; // Re-throw for retry mechanism
        }
    }
}
