<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->json('media_urls')->nullable();
            $table->string('content_type')->default('text'); 
            $table->string('target_type')->default('individual'); 
            $table->json('group_ids')->nullable();
            $table->string('timezone')->default('UTC');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn(['media_urls', 'content_type', 'target_type', 'group_ids', 'timezone']);
        });
    }
};
