<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Landing stats — one row, updated by cron daily
        Schema::create('landing_stats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('total_orders')->default(12847);
            $table->unsignedBigInteger('total_customers')->default(3200);
            $table->unsignedInteger('started_year')->default(2018);
            $table->timestamps();
        });

        // Seed the single stats row
        DB::table('landing_stats')->insert([
            'total_orders'    => 12847,
            'total_customers' => 3200,
            'started_year'    => 2018,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        // Reviews from real users (submitted via form or admin-approved)
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('username', 80);
            $table->string('country', 60)->default('');
            $table->decimal('rating', 3, 1)->default(5.0); // 3.5–5.0
            $table->text('comment');
            $table->string('language', 10)->default('en');
            $table->boolean('is_approved')->default(false);
            $table->timestamps();
        });

        // Seed a few example reviews
        DB::table('reviews')->insert([
            ['username' => 'Alex K.',    'country' => 'United States', 'rating' => 5.0, 'comment' => 'emazingSM transformed our agency workflow completely. Orders are delivered fast and results are consistent.', 'is_approved' => true, 'language' => 'en', 'created_at' => now()->subDays(3),  'updated_at' => now()],
            ['username' => 'Maria S.',   'country' => 'Spain',         'rating' => 4.5, 'comment' => 'Best SMM panel I\'ve used in years. The support team is responsive and pricing is very competitive.', 'is_approved' => true, 'language' => 'en', 'created_at' => now()->subDays(7),  'updated_at' => now()],
            ['username' => 'James T.',   'country' => 'United Kingdom', 'rating' => 5.0, 'comment' => 'Incredible speed. Our client campaigns go live in minutes. This platform is a game changer for agencies.', 'is_approved' => true, 'language' => 'en', 'created_at' => now()->subDays(12), 'updated_at' => now()],
            ['username' => 'Priya R.',   'country' => 'India',         'rating' => 4.5, 'comment' => 'Very affordable rates with reliable delivery. I\'ve tried many panels and this is the most stable one.', 'is_approved' => true, 'language' => 'en', 'created_at' => now()->subDays(20), 'updated_at' => now()],
            ['username' => 'Hassan M.',  'country' => 'UAE',           'rating' => 5.0, 'comment' => 'Great platform for resellers. Auto price sync saves us so much time and protects our margins.', 'is_approved' => true, 'language' => 'en', 'created_at' => now()->subDays(25), 'updated_at' => now()],
            ['username' => 'Sara L.',    'country' => 'France',        'rating' => 4.5, 'comment' => 'Multilingual support is a huge plus for our international clients. Highly recommended!', 'is_approved' => true, 'language' => 'en', 'created_at' => now()->subDays(30), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('landing_stats');
    }
};
