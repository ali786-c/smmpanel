<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Order;
use App\Models\SystemSetting;
use App\Models\UserRole;
use App\Models\WalletTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * DailyDigest – morning profit & health summary sent to all admin users.
 *
 * Runs at 08:00 every day.  Covers the previous calendar day.
 *
 * Includes:
 *  – Revenue & profit for yesterday
 *  – Orders by status (completed, partial, cancelled, pending)
 *  – Negative-margin order count (if any)
 *  – Stale-order warning (orders stuck >48 h)
 *  – Price-watch last-alert summary
 *  – Quick actions link
 */
class DailyDigest extends Command
{
    protected $signature   = 'automation:daily-digest {--date= : Override date (Y-m-d, defaults to yesterday)}';
    protected $description = 'Send daily profit & health digest to admin users';

    public function handle(): int
    {
        $date      = $this->option('date') ? \Carbon\Carbon::parse($this->option('date')) : now()->subDay();
        $dateLabel = $date->toDateString();

        $this->info("Building daily digest for {$dateLabel}...");

        // ── Yesterday's orders ─────────────────────────────────────────────
        $orders = Order::whereDate('created_at', $dateLabel)->get();

        $totalRevenue      = $orders->sum('cost');
        $totalProvCost     = $orders->sum('provider_cost');
        $grossProfit       = $totalRevenue - $totalProvCost;
        $marginPct         = $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 1) : 0;

        $byStatus = $orders->groupBy('status')->map->count();

        // Negative margin orders: orders where cost ≤ provider_cost
        $negativeMarginCount = $orders->filter(fn($o) => $o->provider_cost > 0 && $o->cost <= $o->provider_cost)->count();

        // ── Stale orders (>48 h, still in progress) ────────────────────────
        $staleCount = Order::whereIn('status', ['Pending', 'In progress', 'Processing'])
            ->where('created_at', '<=', now()->subHours(48))
            ->count();

        // ── Price watch last alert ─────────────────────────────────────────
        $priceRaw   = SystemSetting::get('price_watch_last_alert');
        $priceAlert = $priceRaw ? json_decode($priceRaw, true) : null;

        // ── Yesterday's deposits ──────────────────────────────────────────
        $deposits = WalletTransaction::where('type', 'deposit')
            ->whereDate('created_at', $dateLabel)
            ->sum('amount');

        // ── Build notification message ─────────────────────────────────────
        $statusLines = '';
        foreach (['Completed', 'In progress', 'Pending', 'Partial', 'Cancelled', 'Refunded'] as $s) {
            $cnt = $byStatus->get($s, 0);
            if ($cnt > 0) {
                $statusLines .= "  {$s}: {$cnt}\n";
            }
        }

        $healthEmoji = $marginPct >= 20 ? '✅' : ($marginPct >= 5 ? '⚠️' : '🔴');

        $title = "{$healthEmoji} Daily Digest – {$dateLabel}";

        $message = "Revenue: \${$totalRevenue} | Profit: \${$grossProfit} ({$marginPct}%)\n"
            . "Orders placed: {$orders->count()}\n"
            . ($statusLines ?: '')
            . ($negativeMarginCount > 0 ? "🔴 Negative-margin orders: {$negativeMarginCount}\n" : '')
            . ($staleCount > 0 ? "⏳ Stale orders (>48h): {$staleCount} – check Critical Alerts\n" : '')
            . ($priceAlert && ($priceAlert['raised'] ?? 0) > 0
                ? "💰 Price-watch: {$priceAlert['raised']} service(s) auto-corrected since {$priceAlert['at']}\n"
                : '')
            . "Deposits received: \${$deposits}";

        $type = $marginPct < 5 ? 'error' : ($marginPct < 20 ? 'warning' : 'success');

        // ── Notify admins ──────────────────────────────────────────────────
        $adminIds = UserRole::where('role', 'admin')->pluck('user_id');
        $sent = 0;

        foreach ($adminIds as $adminId) {
            Notification::create([
                'id'         => (string) Str::uuid(),
                'user_id'    => $adminId,
                'title'      => $title,
                'message'    => $message,
                'type'       => $type,
                'link'       => '/admin/critical-alerts',
                'read'       => false,
                'created_at' => now(),
            ]);
            $sent++;
        }

        $this->info("Digest sent to {$sent} admin(s).");
        $this->table(
            ['Metric', 'Value'],
            [
                ['Date',                   $dateLabel],
                ['Orders',                 $orders->count()],
                ['Revenue',                "\${$totalRevenue}"],
                ['Provider cost',          "\${$totalProvCost}"],
                ['Gross profit',           "\${$grossProfit}"],
                ['Margin',                 "{$marginPct}%"],
                ['Negative-margin orders', $negativeMarginCount],
                ['Stale orders (>48h)',    $staleCount],
                ['Deposits',               "\${$deposits}"],
                ['Admins notified',        $sent],
            ]
        );

        Log::info('automation:daily-digest completed', [
            'date'     => $dateLabel,
            'revenue'  => $totalRevenue,
            'profit'   => $grossProfit,
            'margin'   => $marginPct,
            'stale'    => $staleCount,
            'admins'   => $sent,
        ]);

        return Command::SUCCESS;
    }
}
