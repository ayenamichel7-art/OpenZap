<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\WhatsappInstance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle incoming webhooks from Evolution API.
     * Secured by verifying the apikey header.
     */
    public function handle(Request $request)
    {
        // Fix #16: Verify webhook authenticity
        $expectedToken = config('services.evolution.token');
        $receivedToken = $request->header('apikey');

        if ($expectedToken && $receivedToken !== $expectedToken) {
            Log::warning("Webhook rejected: invalid apikey header.");
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        Log::info("Webhook Received: {$event}");

        switch ($event) {
            case 'messages.upsert':
                $this->handleMessageUpsert($data);
                break;
            case 'messages.update':
                $this->handleMessageUpdate($data);
                break;
            case 'connection.update':
                $this->handleConnectionUpdate($data);
                break;
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Handle new message confirmations from Evolution API.
     * Fix #20: Implement basic incoming message handling.
     */
    protected function handleMessageUpsert($data)
    {
        if (!$data) return;

        $key = $data['key'] ?? null;
        if (!$key) return;

        $messageId = $key['id'] ?? null;
        $fromMe = $key['fromMe'] ?? false;

        // Only process outgoing message confirmations (sent by us)
        if ($fromMe && $messageId) {
            $message = Message::where('external_id', $messageId)->first();
            if ($message && $message->status === 'pending') {
                $message->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);
            }
        }

        Log::info("Message upsert processed", ['messageId' => $messageId, 'fromMe' => $fromMe]);
    }

    /**
     * Handle message status updates: DELIVERED, READ, etc.
     */
    protected function handleMessageUpdate($data)
    {
        $status = $data['status'] ?? null;
        $remoteJid = $data['key']['remoteJid'] ?? null;
        $id = $data['key']['id'] ?? null;

        if (!$id) return;

        $message = Message::where('external_id', $id)->first();

        if ($message) {
            if ($status == 3) {
                $message->update(['status' => 'delivered', 'delivered_at' => now()]);
            } elseif ($status == 4) {
                $message->update(['status' => 'read', 'read_at' => now()]);
            }
        }
    }

    /**
     * Handle WhatsApp connection status changes.
     */
    protected function handleConnectionUpdate($data)
    {
        $instanceName = $data['instance'] ?? null;
        $state = $data['state'] ?? null;

        if (!$instanceName || !$state) return;

        $instance = WhatsappInstance::where('name', $instanceName)->first();

        if ($instance) {
            $newStatus = match ($state) {
                'open' => 'connected',
                'close' => 'disconnected',
                'connecting' => 'connecting',
                default => $instance->status,
            };

            $updateData = ['status' => $newStatus];

            // Mark linked_at when first connected
            if ($newStatus === 'connected' && !$instance->linked_at) {
                $updateData['linked_at'] = now();
            }

            $instance->update($updateData);
            Log::info("Instance {$instanceName} status updated to: {$newStatus}");
        }
    }
}
