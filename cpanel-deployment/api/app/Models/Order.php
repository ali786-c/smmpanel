<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'orders';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'user_id', 'service_id', 'external_order_id', 'provider_order_id', 'link',
        'quantity', 'comments', 'cost', 'provider_cost', 'status', 'start_count',
        'remains', 'coupon_id', 'notes', 'refund_status',
        'speedup_requested_at', 'cancel_requested_at', 'cancel_request_status', 'stale_pinged_at', 'escalation_stage',
    ];

    protected $appends = ['profit'];

    public function getProfitAttribute()
    {
        return (float) $this->cost - (float) ($this->provider_cost ?? 0);
    }

    protected $casts = [
        'cost' => 'decimal:4',
        'provider_cost' => 'decimal:4',
        'quantity' => 'integer',
        'start_count' => 'integer',
        'remains' => 'integer',
    ];

    protected static function booted()
    {
        static::updating(function ($order) {
            if ($order->isDirty('status') && $order->status === 'Cancelled') {
                if ($order->refund_status !== 'refunded' && $order->cost > 0) {
                    $order->status = 'Refunded';
                    $order->refund_status = 'refunded';

                    // Run refund in database transaction
                    \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
                        $wallet = \App\Models\Wallet::firstOrCreate(
                            ['user_id' => $order->user_id],
                            [
                                'id'      => (string) \Illuminate\Support\Str::uuid(),
                                'balance' => 0,
                            ]
                        );
                        $wallet->increment('balance', $order->cost);

                        \App\Models\WalletTransaction::create([
                            'id'             => (string) \Illuminate\Support\Str::uuid(),
                            'user_id'        => $order->user_id,
                            'type'           => 'refund',
                            'amount'         => $order->cost,
                            'description'    => "Refund for order #{$order->id}",
                            'reference_id'   => $order->id,
                            'payment_method' => 'system',
                            'status'         => 'completed',
                            'created_at'     => now(),
                        ]);

                        \App\Models\RefundLog::create([
                            'id'       => (string) \Illuminate\Support\Str::uuid(),
                            'order_id' => $order->id,
                            'user_id'  => $order->user_id,
                            'amount'   => $order->cost,
                            'reason'   => 'Automated refund: order cancelled',
                            'status'   => 'completed',
                            'created_at' => now(),
                        ]);

                        \App\Models\Notification::create([
                            'id' => (string) \Illuminate\Support\Str::uuid(),
                            'user_id' => $order->user_id,
                            'title' => 'Refund Processed',
                            'message' => "\${$order->cost} has been refunded to your wallet for order #{$order->id}.",
                            'type' => 'success',
                            'link' => '/dashboard/wallet',
                            'read' => false,
                            'created_at' => now(),
                        ]);
                    });
                } else {
                    $order->status = 'Refunded';
                    $order->refund_status = 'refunded';
                }
            }
        });

        static::created(function ($order) {
            try {
                // Find if the user has an active referral relationship
                $referral = \App\Models\Referral::where('referred_id', $order->user_id)
                    ->where('status', 'active')
                    ->first();

                if ($referral && $order->cost > 0) {
                    $commissionRate = (float) $referral->commission_rate;
                    $commissionAmount = round($order->cost * $commissionRate, 4);

                    if ($commissionAmount > 0) {
                        // Increment total_earnings and available_balance
                        $referral->increment('total_earnings', $commissionAmount);
                        $referral->increment('available_balance', $commissionAmount);

                        // Send notification to referrer
                        \App\Models\Notification::create([
                            'id'         => (string) \Illuminate\Support\Str::uuid(),
                            'user_id'    => $referral->referrer_id,
                            'title'      => 'Referral Commission',
                            'message'    => "You earned \${$commissionAmount} commission from a referral order.",
                            'type'       => 'promo',
                            'read'       => false,
                            'created_at' => now(),
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Failed to process referral commission', [
                    'order_id' => $order->id,
                    'error'    => $e->getMessage()
                ]);
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class, 'coupon_id');
    }
}
