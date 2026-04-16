<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fix #22: Add missing database indexes for performance optimization.
 * These indexes drastically speed up queries on frequently filtered columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Messages table: status and sent_at are heavily queried for stats and webhook updates
        Schema::table('messages', function (Blueprint $table) {
            $table->index('status', 'idx_messages_status');
            $table->index('sent_at', 'idx_messages_sent_at');
            $table->index(['campaign_id', 'status'], 'idx_messages_campaign_status');
        });

        // Contacts table: phone lookups for duplicate detection during import
        Schema::table('contacts', function (Blueprint $table) {
            $table->index(['user_id', 'phone'], 'idx_contacts_user_phone');
        });

        // Campaigns table: status filtering for dashboard queries
        Schema::table('campaigns', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'idx_campaigns_user_status');
        });

        // WhatsApp instances: status filtering for active instances
        Schema::table('whatsapp_instances', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'idx_instances_user_status');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('idx_messages_status');
            $table->dropIndex('idx_messages_sent_at');
            $table->dropIndex('idx_messages_campaign_status');
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex('idx_contacts_user_phone');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropIndex('idx_campaigns_user_status');
        });

        Schema::table('whatsapp_instances', function (Blueprint $table) {
            $table->dropIndex('idx_instances_user_status');
        });
    }
};
