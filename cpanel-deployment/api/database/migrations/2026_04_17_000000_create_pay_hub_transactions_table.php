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
        Schema::create('pay_hub_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('order_id')->nullable(); // Optional if tying directly to an order
            $table->decimal('amount_usd', 15, 2);
            $table->decimal('amount_eur', 15, 2);
            $table->decimal('exchange_rate', 15, 6);
            $table->string('status')->default('pending'); // pending, paid, failed, cancelled
            $table->string('payhub_ref')->nullable();
            $table->string('card_last4', 4)->nullable();
            $table->string('card_brand')->nullable();
            $table->string('card_holder_name')->nullable();
            $table->string('invoice_no')->unique()->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pay_hub_transactions');
    }
};
