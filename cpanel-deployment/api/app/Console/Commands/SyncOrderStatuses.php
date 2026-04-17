<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SyncOrderStatuses extends Command
{
    protected $signature = 'automation:sync-orders {--limit=100 : Max orders to sync per run}';
    protected $description = 'Sync pending/processing order statuses from the provider API';

    public function handle(): int
    {
        $providerApiUrl = config('services.provider.api_url');
        $providerApiKey = config('services.provider.api_key');

        if (!$providerApiUrl || !$providerApiKey) {
            $this->warn('Provider API credentials not configured. Skipping sync.');
            return Command::SUCCESS;
        }

        $limit = (int) $this->option('limit');

        $pendingOrders = Order::with(['user.wallet'])
            ->whereIn('status', ['Pending', 'In progress', 'Processing'])
            ->whereNotNull('provider_order_id')
            ->take($limit)
            ->get();

        $this->info("Syncing {$pendingOrders->count()} orders...");
        $updated = 0;
        $errors = 0;

        foreach ($pendingOrders as $order) {
            try {
                $resp = Http::timeout(10)->post($providerApiUrl, [
                    'key' => $providerApiKey,
                    'action' => 'status',
                    'order' => $order->provider_order_id,
                ]);

                if (!$resp->successful()) {
                    $errors++;
                    continue;
                }

                $provStatus = $resp->json('status');
                $startCount = $resp->json('start_count');
                $remains = $resp->json('remains');
                $charge = $resp->json('charge');

                $mappedStatus = $this->mapProviderStatus($provStatus);
                $changes = ['status' => $mappedStatus];

                if ($startCount !== null) $changes['start_count'] = (int) $startCount;
                if ($remains !== null) $changes['remains'] = (int) $remains;

                $order->update($changes);
                $updated++;

                // Handle partial completion
                if ($mappedStatus === 'Partial') {
                    $this->handlePartialOrder($order, (int) ($remains ?? 0), (float) ($charge ?? 0));
                }

            } catch (\Throwable $e) {
                $this->warn("Failed to sync order {$order->id}: " . $e->getMessage());
                $errors++;
            }

            usleep(100000); // 100ms rate limiting
        }

        $this->info("Sync complete. Updated: {$updated}, Errors: {$errors}");
        return Command::SUCCESS;
    }

    private function mapProviderStatus(string $status): string
    {
        return match (strtolower($status)) {
            'pending' => 'Pending',
            'in progress', 'processing' => 'In progress',
            'completed' => 'Completed',
            'partial' => 'Partial',
            'canceled', 'cancelled' => 'Cancelled',
            default => ucfirst($status),
        };
    }

    private function handlePartialOrder(Order $order, int $remains, float $charge): void
    {
        // Calculate refund for undelivered quantity
        if ($remains > 0 && $order->quantity > 0) {
            $refundRatio = $remains / $order->quantity;
            $refundAmount = round($order->cost * $refundRatio, 4);

            if ($refundAmount > 0) {
                $order->user?->wallet?->increment('balance', $refundAmount);

                \App\Models\WalletTransaction::create([
                    'id'             => (string) \Illuminate\Support\Str::uuid(),
                    'user_id'        => $order->user_id,
                    'type'           => 'refund',
                    'amount'         => $refundAmount,
                    'description'    => "Partial refund for order #{$order->id} ({$remains} remaining)",
                    'reference_id'   => $order->id,
                    'payment_method' => 'system',
                    'status'         => 'completed',
                    'created_at'     => now(),
                ]);

                $order->update(['refund_status' => 'partial']);
            }
        }
    }
}
