<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Keywords Table (for SEO targeting and LRU selection)
        Schema::create('blog_keywords', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('keyword')->unique();
            $table->string('status')->default('active'); // active, inactive
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
        });

        // 2. Automation Config Table (Single row for settings)
        Schema::create('blog_automation_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->boolean('is_enabled')->default(false);
            $table->string('frequency')->default('daily'); 
            $table->json('social_channels')->nullable(); // For Telegram, Discord, etc.
            $table->timestamp('last_run_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_automation_configs');
        Schema::dropIfExists('blog_keywords');
    }
};
