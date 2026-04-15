<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('author_name');
            $table->string('author_handle')->nullable();
            $table->string('avatar_seed')->nullable();
            $table->string('platform')->default('Instagram');
            $table->tinyInteger('rating')->default(5);
            $table->text('content');
            $table->integer('followers_count')->nullable();
            $table->string('niche')->nullable();
            $table->string('country_code', 2)->nullable();
            $table->boolean('featured')->default(false);
            $table->timestamp('reviewed_at');
            $table->timestamps();
        });

        Schema::create('landing_stats', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value');
            $table->string('label');
            $table->string('suffix')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_stats');
        Schema::dropIfExists('testimonials');
    }
};
