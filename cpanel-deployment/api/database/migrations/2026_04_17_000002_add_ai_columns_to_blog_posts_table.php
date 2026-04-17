<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->string('featured_image')->nullable()->after('read_time');
            $table->boolean('is_ai_generated')->default(false)->after('featured_image');
            $table->uuid('keyword_id')->nullable()->after('is_ai_generated');

            $table->foreign('keyword_id')->references('id')->on('blog_keywords')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropForeign(['keyword_id']);
            $table->dropColumn(['featured_image', 'is_ai_generated', 'keyword_id']);
        });
    }
};
