<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add escalation tracking + type + linked order to tickets
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'order_id')) {
                $table->uuid('order_id')->nullable()->after('user_id');
                $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
            }
            if (!Schema::hasColumn('tickets', 'ticket_type')) {
                // Types: general | speedup | cancellation | refund | wrong_link | drop | quality | account | payment | other
                $table->string('ticket_type')->default('general')->after('priority');
            }
            if (!Schema::hasColumn('tickets', 'provider_escalated')) {
                $table->boolean('provider_escalated')->default(false)->after('ticket_type');
            }
            if (!Schema::hasColumn('tickets', 'provider_ticket_ref')) {
                $table->string('provider_ticket_ref')->nullable()->after('provider_escalated');
            }
            if (!Schema::hasColumn('tickets', 'escalated_at')) {
                $table->timestamp('escalated_at')->nullable()->after('provider_ticket_ref');
            }
            if (!Schema::hasColumn('tickets', 'auto_opened')) {
                $table->boolean('auto_opened')->default(false)->after('escalated_at');
            }
        });

        // Add speedup/cancel request tracking to orders
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'speedup_requested_at')) {
                $table->timestamp('speedup_requested_at')->nullable();
            }
            if (!Schema::hasColumn('orders', 'cancel_requested_at')) {
                $table->timestamp('cancel_requested_at')->nullable();
            }
            if (!Schema::hasColumn('orders', 'cancel_request_status')) {
                // none | pending | approved | rejected
                $table->string('cancel_request_status')->default('none');
            }
            if (!Schema::hasColumn('orders', 'stale_pinged_at')) {
                $table->timestamp('stale_pinged_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeignIfExists(['order_id']);
            $table->dropColumnIfExists(['order_id', 'ticket_type', 'provider_escalated', 'provider_ticket_ref', 'escalated_at', 'auto_opened']);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumnIfExists(['speedup_requested_at', 'cancel_requested_at', 'cancel_request_status', 'stale_pinged_at']);
        });
    }
};
