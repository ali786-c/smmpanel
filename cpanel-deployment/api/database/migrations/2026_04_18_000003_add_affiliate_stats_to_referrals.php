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
        Schema::table('referrals', function (Blueprint $table) {
            $table->decimal('available_balance', 12, 4)->default(0)->after('total_earnings');
        });

        Schema::table('profiles', function (Blueprint $table) {
            $table->integer('total_visits')->default(0)->after('referral_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('referrals', function (Blueprint $table) {
            $table->dropColumn(['available_balance']);
        });

        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['total_visits']);
        });
    }
};
