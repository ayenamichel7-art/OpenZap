<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('whatsapp_instance_id')->constrained()->cascadeOnDelete();
            $table->string('channel_jid')->unique(); // e.g. 120363xxxxx@newsletter
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('picture_url')->nullable();
            $table->integer('subscribers_count')->default(0);
            $table->string('invite_link')->nullable();
            $table->boolean('is_owner')->default(false); // true if we created it
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
        });

        // Extend campaigns to support channel target_type
        Schema::table('campaigns', function (Blueprint $table) {
            $table->json('channel_jids')->nullable()->after('group_ids');
        });
    }

    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('channel_jids');
        });
        Schema::dropIfExists('whatsapp_channels');
    }
};
