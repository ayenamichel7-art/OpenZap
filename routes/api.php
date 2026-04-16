<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\WhatsappInstanceController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\ChannelController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\ApiKeyController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ─── Public Auth Routes (Rate Limited) ──────────────────────────────────────
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// ─── Protected Routes ───────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // WhatsApp Instances
    Route::apiResource('whatsapp-instances', WhatsappInstanceController::class);
    Route::post('whatsapp-instances/{instance}/connect', [WhatsappInstanceController::class, 'connect']);
    Route::post('whatsapp-instances/{instance}/pairing-code', [WhatsappInstanceController::class, 'pairingCode']);
    Route::get('whatsapp-instances/{instance}/groups', [WhatsappInstanceController::class, 'groups']);

    // Contacts
    Route::post('contacts/google-sheets', [ContactController::class, 'importGoogleSheet']);
    Route::post('contacts/bulk', [ContactController::class, 'bulkStore']);
    Route::apiResource('contacts', ContactController::class);

    // Campaigns
    Route::get('campaigns/stats', [CampaignController::class, 'stats']);
    Route::get('campaigns/{campaign}/logs', [CampaignController::class, 'logs']);
    Route::apiResource('campaigns', CampaignController::class);

    // WhatsApp Channels
    Route::get('channels', [ChannelController::class, 'index']);
    Route::post('channels', [ChannelController::class, 'store']);
    Route::get('channels/{channel}', [ChannelController::class, 'show']);
    Route::delete('channels/{channel}', [ChannelController::class, 'destroy']);
    Route::post('channels/detect/{instance}', [ChannelController::class, 'detect']);
    Route::post('channels/publish', [ChannelController::class, 'publish']);

    // API Keys
    Route::get('api-keys', [ApiKeyController::class, 'index']);
    Route::post('api-keys', [ApiKeyController::class, 'store']);
    Route::delete('api-keys/{id}', [ApiKeyController::class, 'destroy']);

    // Admin
    Route::get('admin/overview', [AdminController::class, 'overview']);

    // Media & Templates
    Route::post('media/upload', [MediaController::class, 'store']);
    Route::apiResource('templates', TemplateController::class);
});

// ─── Webhooks (Rate limited + secured by token verification in controller) ──
Route::middleware('throttle:60,1')->group(function () {
    Route::post('webhooks/evolution', [WebhookController::class, 'handle']);
});

