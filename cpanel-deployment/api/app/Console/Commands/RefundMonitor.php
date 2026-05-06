<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\RefundLog;
use App\Models\WalletTransaction;
use App\Models\Wallet;
use App\Models\Notification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class RefundMonitor extends Command
{
    protected $signature = 'automation:refund-monitor {--dry-run : Simulate without making changes}';
    protected $description = 'Monitor failed/cancelled orders and process refunds automatically';

    public function handle(): int
    {
        $this->info('Refund monitor is currently DISABLED by admin request.');
        return Command::SUCCESS;
        
        $dryRun = $this->option('dry-run');

        $providerApiUrl = config('services.provider.api_url');
        $providerApiKey = config('services.provider.api_key');

        // Find orders that should be checked for refund eligibility
        $candidateOrders = Order::with(['user.wallet'])
            ->where('status', 'Cancelled')
            ->where('refund_status', 'none')
            ->where('cost', '>', 0)
            ->where('created_at', '>=', now()->subDays(30))
            ->get();

        $processed = 0;
        $refunded = 0;
        $total = $candidateOrders->count();

        $this->info("Found {$total} cancelled orders eligible for refund check.");

        foreach ($candidateOrders as $order) {
            if (!$order->user?->wallet) {
                continue;
            }

            // If provider order exists, verify it was actually cancelled on provider side
            $providerCancelled = true;
            if ($providerApiUrl && $providerApiKey && $order->provider_order_id) {
                try {
                    $resp = Http::timeout(10)->post($providerApiUrl, [
                        'key' => $providerApiKey,
                        'action' => 'status',
                        'order' => $order->provider_order_id,
                    ]);

                    if ($resp->successful()) {
                        $provStatus = strtolower($resp->json('status') ?? '');
                        $providerCancelled = in_array($provStatus, ['canceled', 'cancelled', 'partial', 'error']);
                    }
                } catch (\Throwable $e) {
                    $this->warn("Provider check failed for order {$order->id}: " . $e->getMessage());
                    continue;
                }
            }

            if (!$providerCancelled) {
                continue;
            }

            $refundAmount = $order->cost;

            if ($dryRun) {
                $this->line("[DRY RUN] Would refund \${$refundAmount} for order {$order->id}");
                $refunded++;
                continue;
            }

            DB::transaction(function () use ($order, $refundAmount) {
                $wallet = $order->user->wallet;
                $wallet->increment('balance', $refundAmount);

                WalletTransaction::create([
                    'id'             => (string) Str::uuid(),
                    'user_id'        => $order->user_id,
                    'type'           => 'refund',
                    'amount'         => $refundAmount,
                    'description'    => "Refund for order #{$order->id}",
                    'reference_id'   => $order->id,
                    'payment_method' => 'system',
                    'status'         => 'completed',
                    'created_at'     => now(),
                ]);

                $order->update(['refund_status' => 'refunded']);

                RefundLog::create([
                    'id'       => (string) Str::uuid(),
                    'order_id' => $order->id,
                    'user_id'  => $order->user_id,
                    'amount'   => $refundAmount,
                    'reason'   => 'Automated refund: order cancelled',
                    'status'   => 'completed',
                    'created_at' => now(),
                ]);

                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $order->user_id,
                    'title' => 'Refund Processed',
                    'message' => "\${$refundAmount} has been refunded to your wallet for order #{$order->id}.",
                    'type' => 'success',
                    'link' => '/dashboard/wallet',
                    'read' => false,
                    'created_at' => now(),
                ]);
            });

            $refunded++;
            $processed++;
        }

        $this->info("Processed: {$processed}, Refunded: {$refunded}");
        return Command::SUCCESS;
    }
}
