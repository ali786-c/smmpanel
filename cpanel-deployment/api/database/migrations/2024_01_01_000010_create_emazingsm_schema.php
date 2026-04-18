<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Enable pgcrypto for gen_random_bytes and gen_random_uuid
        DB::statement('CREATE EXTENSION IF NOT EXISTS pgcrypto');

        // ==================== PROFILES ====================
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->string('display_name')->nullable();
            $table->text('avatar_url')->nullable();
            $table->string('phone')->nullable();
            $table->string('api_key')->unique()->nullable()->default(DB::raw("encode(gen_random_bytes(32), 'hex')"));
            $table->string('referral_code')->unique()->nullable();
            $table->boolean('is_banned')->default(false);
            $table->text('ban_reason')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== WALLETS ====================
        Schema::create('wallets', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->decimal('balance', 12, 2)->default(0)->check('balance >= 0');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== WALLET TRANSACTIONS ====================
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->string('type');
            $table->decimal('amount', 12, 2);
            $table->text('description')->nullable();
            $table->string('reference_id')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('status')->default('completed');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== USER ROLES ====================
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->string('role');
            $table->unique(['user_id', 'role']);

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== SERVICES ====================
        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->integer('external_service_id')->unique();
            $table->text('name');
            $table->string('category')->default('Other');
            $table->string('platform')->default('Other');
            $table->string('type')->default('Default');
            $table->decimal('rate', 10, 4);
            $table->integer('min_order')->default(1);
            $table->integer('max_order')->default(100000);
            $table->boolean('refill')->default(false);
            $table->boolean('cancel')->default(false);
            $table->integer('health_score')->default(100);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // ==================== COUPONS ====================
        Schema::create('coupons', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('code')->unique();
            $table->string('discount_type')->default('percentage');
            $table->decimal('discount_value', 10, 2)->default(0);
            $table->decimal('min_order_amount', 10, 2)->default(0);
            $table->integer('max_uses')->nullable();
            $table->integer('used_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // ==================== ORDERS ====================
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->uuid('service_id');
            $table->bigInteger('external_order_id')->nullable();
            $table->text('link');
            $table->integer('quantity');
            $table->decimal('cost', 10, 4);
            $table->decimal('provider_cost', 10, 4)->nullable();
            $table->string('status')->default('Pending');
            $table->integer('start_count')->nullable();
            $table->integer('remains')->nullable();
            $table->uuid('coupon_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
            $table->foreign('coupon_id')->references('id')->on('coupons')->onDelete('set null');
        });

        // ==================== TICKETS ====================
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->string('subject');
            $table->string('status')->default('open');
            $table->string('priority')->default('normal');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== TICKET MESSAGES ====================
        Schema::create('ticket_messages', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('ticket_id');
            $table->string('sender');
            $table->text('content');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
        });

        // ==================== REFUND LOG ====================
        Schema::create('refund_log', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('order_id')->nullable();
            $table->uuid('user_id');
            $table->decimal('amount', 10, 4);
            $table->text('reason')->nullable();
            $table->string('provider_refund_id')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== BLOG POSTS ====================
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('content')->default('');
            $table->text('excerpt')->default('');
            $table->string('category')->default('General');
            $table->json('tags')->default('[]');
            $table->string('status')->default('draft');
            $table->string('meta_title')->default('');
            $table->text('meta_description')->default('');
            $table->integer('read_time')->default(5);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        // ==================== REFERRALS ====================
        Schema::create('referrals', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('referrer_id');
            $table->uuid('referred_id')->unique();
            $table->decimal('commission_rate', 10, 4)->default(0.015);
            $table->decimal('total_earnings', 10, 4)->default(0);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->foreign('referrer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('referred_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== ANNOUNCEMENTS ====================
        Schema::create('announcements', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('title');
            $table->text('content')->default('');
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);
            $table->timestamps();
        });

        // ==================== NOTIFICATIONS ====================
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info');
            $table->string('link')->nullable();
            $table->boolean('read')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== FAVORITE SERVICES ====================
        Schema::create('favorite_services', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->uuid('service_id');
            $table->timestamps();
            $table->unique(['user_id', 'service_id']);

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
        });

        // ==================== NOTIFICATION PREFERENCES ====================
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->boolean('order_updates')->default(true);
            $table->boolean('promotions')->default(true);
            $table->boolean('announcements')->default(true);
            $table->boolean('ticket_replies')->default(true);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== ACTIVITY LOG ====================
        Schema::create('activity_log', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('actor_id');
            $table->string('action');
            $table->string('target_type')->default('');
            $table->uuid('target_id')->nullable();
            $table->jsonb('details')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('actor_id')->references('id')->on('users')->onDelete('cascade');
        });

        // ==================== SYSTEM SETTINGS ====================
        Schema::create('system_settings', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('activity_log');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('favorite_services');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('referrals');
        Schema::dropIfExists('blog_posts');
        Schema::dropIfExists('refund_log');
        Schema::dropIfExists('ticket_messages');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('services');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('profiles');
    }
};
