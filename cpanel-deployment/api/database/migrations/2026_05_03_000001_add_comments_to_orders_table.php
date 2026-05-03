<?php
// cpanel-deployment/api/database/migrations/2026_05_03_000001_add_comments_to_orders_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $column) {
            $column->text('comments')->nullable()->after('quantity');
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $column) {
            $column->dropColumn('comments');
        });
    }
};
