<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DynamicFieldsTest extends TestCase
{
    use RefreshDatabase;

    public function test_subscription_validation_and_cost()
    {
        $user = User::factory()->create();
        
        $wallet = Wallet::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'balance' => 1000.00
        ]);

        $service = Service::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'external_service_id' => 10175,
            'name' => 'Auto Reposts',
            'category' => 'Instagram',
            'platform' => 'Instagram',
            'type' => 'Subscriptions',
            'rate' => 10.00,
            'min_order' => 10,
            'max_order' => 1000,
            'refill' => false,
            'cancel' => false,
            'is_active' => true
        ]);

        // Act: place subscription order
        $response = $this->actingAs($user, 'api')->postJson('/api/orders', [
            'service_id' => $service->id,
            'custom_data' => [
                'username' => 'test_user',
                'min' => 100,
                'max' => 500,
                'posts' => 10,
                'delay' => 5
            ]
        ]);

        $response->assertStatus(201);
        
        // Assert: cost = (500 * 10) * 10 / 1000 = 50.00
        $this->assertEquals(950.00, floatval($wallet->fresh()->balance));

        $order = Order::first();
        $this->assertEquals('test_user', $order->link);
        $this->assertEquals(1, $order->quantity);
        $this->assertEquals(50.00, floatval($order->cost));
        
        $details = json_decode($order->comments, true);
        $this->assertEquals(100, $details['min']);
        $this->assertEquals(500, $details['max']);
    }
}
