<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'provider_order_id')) {
                $table->string('provider_order_id')->nullable()->after('external_order_id');
            }
            if (!Schema::hasColumn('orders', 'refund_status')) {
                $table->string('refund_status')->default('none')->after('remains');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumnIfExists('provider_order_id');
            $table->dropColumnIfExists('refund_status');
        });
    }
};
