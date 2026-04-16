<?php

namespace App\Services;

use App\Models\Message;
use App\Models\WhatsappInstance;
use Carbon\Carbon;

class GuardianService
{
    /**
     * Check if a text contains Spintax variations.
     * Example: {Hello|Hi|Hey} how are you?
     */
    public function hasSpintax(string $text): bool
    {
        return (bool) preg_match('/\{[^{}]*\}/', $text);
    }

    /**
     * Parse and apply Spintax to a text.
     */
    public function applySpintax(string $text): string
    {
        return preg_replace_callback('/\{([^{}]*)\}/', function ($matches) {
            $parts = explode('|', $matches[1]);
            return $parts[array_rand($parts)];
        }, $text);
    }

    /**
     * Check if current time is within safe hours (default 8AM - 8PM).
     */
    public function isSafeHour(): bool
    {
        $now = Carbon::now();
        $start = Carbon::createFromTime(8, 0, 0);
        $end = Carbon::createFromTime(20, 0, 0);

        return $now->between($start, $end);
    }

    /**
     * Calculate a dynamic delay (in seconds) between messages.
     * New accounts get longer delays.
     */
    public function getRecommendedDelay(WhatsappInstance $instance): int
    {
        $baseDelay = 30; // 30 seconds
        
        if (!$instance->linked_at) {
            return 120; // Very safe for unlinked/fresh accounts
        }

        $daysOld = Carbon::parse($instance->linked_at)->diffInDays(now());

        if ($daysOld < 7) {
            return $baseDelay * 2; // 60 seconds
        }

        return $baseDelay;
    }

    /**
     * Check if instance reached its daily limit.
     * Fix #19: Optimized to use a single query with a subquery instead of N+1.
     */
    public function canSend(WhatsappInstance $instance): bool
    {
        $todayCount = Message::whereIn(
                'campaign_id',
                $instance->campaigns()->select('id')
            )
            ->whereDate('sent_at', Carbon::today())
            ->count();

        return $todayCount < ($instance->daily_limit ?? 50);
    }
}
