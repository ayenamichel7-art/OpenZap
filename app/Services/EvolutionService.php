<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionService
{
    protected string $baseUrl;
    protected string $token;

    public function __construct()
    {
        // Fix #18: Use only config() — env() returns null when config is cached
        $this->baseUrl = config('services.evolution.url');
        $this->token = config('services.evolution.token');
    }

    protected function client()
    {
        return Http::baseUrl($this->baseUrl)
            ->headers(['apikey' => $this->token])
            ->timeout(30);
    }

    public function createInstance(string $name)
    {
        try {
            $response = $this->client()->post('/instance/create', [
                'instanceName' => $name,
                'token' => $this->token,
                'qrcode' => true
            ]);

            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Create Instance Error: " . $e->getMessage());
            return null;
        }
    }

    public function getQrCode(string $instanceName)
    {
        try {
            $response = $this->client()->get("/instance/connect/{$instanceName}");
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - QR Code Error: " . $e->getMessage());
            return null;
        }
    }

    public function getInstanceStatus(string $instanceName)
    {
        try {
            $response = $this->client()->get("/instance/connectionState/{$instanceName}");
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Status Error: " . $e->getMessage());
            return null;
        }
    }

    public function getPairingCode(string $instanceName, string $phoneNumber)
    {
        try {
            $response = $this->client()->get("/instance/connect/pairingCode/{$instanceName}", [
                'number' => $phoneNumber
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Pairing Code Error: " . $e->getMessage());
            return null;
        }
    }

    public function fetchGroups(string $instanceName)
    {
        try {
            $response = $this->client()->get("/group/fetchAllGroups/{$instanceName}?getParticipants=false");
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Fetch Groups Error: " . $e->getMessage());
            return [];
        }
    }

    public function sendMedia(string $instanceName, string $number, string $mediaUrl, string $mediaType, string $caption = '')
    {
        try {
            $response = $this->client()->post("/message/sendMedia/{$instanceName}", [
                'number' => $number,
                'media' => $mediaUrl,
                'mediaType' => $mediaType,
                'caption' => $caption,
                'delay' => 1200
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Send Media Error: " . $e->getMessage());
            return null;
        }
    }

    public function sendMessage(string $instanceName, string $number, string $text)
    {
        try {
            $response = $this->client()->post("/message/sendText/{$instanceName}", [
                'number' => $number,
                'options' => [
                    'delay' => 1200,
                    'presence' => 'composing'
                ],
                'textMessage' => [
                    'text' => $text
                ]
            ]);

            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Send Message Error: " . $e->getMessage());
            return null;
        }
    }

    // ─── CHANNELS / NEWSLETTERS ─────────────────────────────────────────────

    /**
     * Fetch all newsletters/channels the instance is subscribed to or owns.
     */
    public function fetchChannels(string $instanceName): array
    {
        try {
            $response = $this->client()->post("/chat/findNewsletters/{$instanceName}");
            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error("Evolution API - Fetch Channels Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get info about a specific channel by JID.
     */
    public function getChannelInfo(string $instanceName, string $channelJid)
    {
        try {
            $response = $this->client()->post("/chat/findNewsletters/{$instanceName}", [
                'filters' => [
                    'id' => $channelJid
                ]
            ]);
            $channels = $response->json() ?? [];
            return !empty($channels) ? $channels[0] : null;
        } catch (\Exception $e) {
            Log::error("Evolution API - Get Channel Info Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Create a new WhatsApp Channel/Newsletter.
     */
    public function createChannel(string $instanceName, string $name, string $description = '')
    {
        try {
            $response = $this->client()->post("/newsletter/create/{$instanceName}", [
                'name' => $name,
                'description' => $description,
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Create Channel Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Send a text message to a WhatsApp Channel.
     */
    public function sendChannelText(string $instanceName, string $channelJid, string $text)
    {
        try {
            $response = $this->client()->post("/message/sendText/{$instanceName}", [
                'number' => $channelJid,
                'options' => [
                    'delay' => 1200,
                ],
                'textMessage' => [
                    'text' => $text,
                ]
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Send Channel Text Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Send media to a WhatsApp Channel.
     */
    public function sendChannelMedia(string $instanceName, string $channelJid, string $mediaUrl, string $mediaType, string $caption = '')
    {
        try {
            $response = $this->client()->post("/message/sendMedia/{$instanceName}", [
                'number' => $channelJid,
                'media' => $mediaUrl,
                'mediaType' => $mediaType,
                'caption' => $caption,
                'delay' => 1200,
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Send Channel Media Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get the invite link of a channel.
     */
    public function getChannelInviteLink(string $instanceName, string $channelJid)
    {
        try {
            $response = $this->client()->get("/newsletter/inviteInfo/{$instanceName}", [
                'newsletterJid' => $channelJid
            ]);
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Channel Invite Link Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a WhatsApp instance from Evolution API.
     */
    public function deleteInstance(string $instanceName)
    {
        try {
            $response = $this->client()->delete("/instance/delete/{$instanceName}");
            return $response->json();
        } catch (\Exception $e) {
            Log::error("Evolution API - Delete Instance Error: " . $e->getMessage());
            return null;
        }
    }
}

