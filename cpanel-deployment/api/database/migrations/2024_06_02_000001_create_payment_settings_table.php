<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 30);           // stripe | paypal | crypto
            $table->string('key_name', 80);            // e.g. publishable_key, secret_key, wallet_btc
            $table->text('key_value')->nullable();     // encrypted value
            $table->boolean('is_active')->default(false);
            $table->string('label', 120)->default(''); // human label for admin UI
            $table->timestamps();

            $table->unique(['provider', 'key_name']);
        });

        // Scaffold default rows (values blank — admin fills them in)
        $rows = [
            // Stripe
            ['provider' => 'stripe', 'key_name' => 'publishable_key', 'label' => 'Stripe Publishable Key', 'is_active' => false],
            ['provider' => 'stripe', 'key_name' => 'secret_key',      'label' => 'Stripe Secret Key',      'is_active' => false],
            ['provider' => 'stripe', 'key_name' => 'webhook_secret',  'label' => 'Stripe Webhook Secret',  'is_active' => false],
            // PayPal
            ['provider' => 'paypal', 'key_name' => 'client_id',       'label' => 'PayPal Client ID',       'is_active' => false],
            ['provider' => 'paypal', 'key_name' => 'client_secret',   'label' => 'PayPal Client Secret',   'is_active' => false],
            ['provider' => 'paypal', 'key_name' => 'mode',            'label' => 'PayPal Mode (sandbox/live)', 'is_active' => false],
            // Crypto
            ['provider' => 'crypto', 'key_name' => 'wallet_btc',      'label' => 'Bitcoin Wallet Address',  'is_active' => false],
            ['provider' => 'crypto', 'key_name' => 'wallet_eth',      'label' => 'Ethereum Wallet Address', 'is_active' => false],
            ['provider' => 'crypto', 'key_name' => 'wallet_usdt_trc', 'label' => 'USDT (TRC-20) Address',  'is_active' => false],
            ['provider' => 'crypto', 'key_name' => 'wallet_usdt_erc', 'label' => 'USDT (ERC-20) Address',  'is_active' => false],
            ['provider' => 'crypto', 'key_name' => 'min_amount_usd',  'label' => 'Crypto Min Deposit (USD)', 'is_active' => false],
        ];

        foreach ($rows as &$row) {
            $row['created_at'] = now();
            $row['updated_at'] = now();
        }

        DB::table('payment_settings')->insert($rows);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
