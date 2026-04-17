<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Service;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * PriceWatch – detects when JustPanel silently raises wholesale prices.
 *
 * Runs every 6 hours.  For each active service:
 *  – Computes what JustPanel now charges vs. what we sell it for.
 *  – If provider_rate >= our selling_rate → we're losing money → auto-raise
 *    our price to (provider_rate × markup) and notify every admin.
 *  – If provider_rate dropped → optionally lower our price to stay competitive.
 *
 * Dry-run mode shows what *would* change without writing anything.
 */
class PriceWatch extends Command
{
    protected $signature = 'automation:price-watch
        {--dry-run : Show changes without saving}
        {--min-margin=10 : Minimum profit margin to maintain (percent)}';

    protected $description = 'Detect JustPanel price changes and auto-correct negative-margin services';

    public function handle(): int
    {
        $this->info('Starting price watch...');

        $providerUrl = config('services.provider.api_url');
        $providerKey = config('services.provider.api_key');

        if (!$providerUrl || !$providerKey) {
            $this->warn('Provider API not configured (PROVIDER_API_URL / PROVIDER_API_KEY). Skipping.');
            return Command::SUCCESS;
        }

        $dryRun    = $this->option('dry-run');
        $minMargin = max(0, (float) $this->option('min-margin')); // e.g. 10 → 10 %
        $markup    = (float) SystemSetting::get('markup_percent', 30);

        // ── 1. Fetch live provider service list ────────────────────────────
        try {
            $resp = Http::timeout(30)->asForm()->post($providerUrl, [
                'key'    => $providerKey,
                'action' => 'services',
            ]);

            if (!$resp->successful()) {
                $this->error('Provider returned HTTP ' . $resp->status());
                return Command::FAILURE;
            }

            $providerServices = $resp->json();
        } catch (\Throwable $e) {
            $this->error('HTTP error fetching services: ' . $e->getMessage());
            return Command::FAILURE;
        }

        if (!is_array($providerServices) || empty($providerServices)) {
            $this->error('Invalid or empty response from provider.');
            return Command::FAILURE;
        }

        // Index by external service ID for quick lookup
        $providerMap = [];
        foreach ($providerServices as $ps) {
            $extId = (int) ($ps['service'] ?? $ps['id'] ?? 0);
            if ($extId) {
                $providerMap[$extId] = (float) ($ps['rate'] ?? 0);
            }
        }

        $this->info('Fetched ' . count($providerMap) . ' services from JustPanel.');

        // ── 2. Compare with our active services ────────────────────────────
        $services = Service::active()->get();

        $priceRaises  = [];
        $priceDrops   = [];
        $unchanged    = 0;
        $notInProvider = 0;

        foreach ($services as $service) {
            $extId = $service->external_service_id;

            if (!isset($providerMap[$extId])) {
                $notInProvider++;
                continue;
            }

            $providerRate = $providerMap[$extId]; // price per 1000
            $ourRate      = (float) $service->rate;

            // Effective margin: how much more we charge over provider cost
            $marginPct = $ourRate > 0
                ? (($ourRate - $providerRate) / $ourRate) * 100
                : -100;

            $isNegative = $providerRate >= $ourRate;
            $isBelowMin = $marginPct < $minMargin;

            if ($isNegative || $isBelowMin) {
                // Target: provider_rate × (1 + desired_markup / 100)
                $targetRate  = round($providerRate * (1 + $markup / 100), 4);

                $priceRaises[] = [
                    'service'        => $service,
                    'provider_rate'  => $providerRate,
                    'old_rate'       => $ourRate,
                    'new_rate'       => $targetRate,
                    'old_margin_pct' => round($marginPct, 1),
                ];

                if (!$dryRun) {
                    $service->update(['rate' => $targetRate]);
                }
            } elseif ($providerRate < $ourRate * 0.5) {
                // Provider dropped price significantly – flag as optional reduction
                $priceDrops[] = [
                    'service'       => $service,
                    'provider_rate' => $providerRate,
                    'our_rate'      => $ourRate,
                ];
                $unchanged++; // We do NOT auto-lower; that's a manual admin decision
            } else {
                $unchanged++;
            }
        }

        // ── 3. Persist a system alert & push admin notifications ───────────
        $totalRaised = count($priceRaises);
        $totalDropped = count($priceDrops);

        if ($totalRaised > 0) {
            $alertLines = [];
            foreach ($priceRaises as $r) {
                $name = $r['service']->name;
                $alertLines[] = "• {$name}: \${$r['old_rate']} → \${$r['new_rate']} (provider now charges \${$r['provider_rate']}, was {$r['old_margin_pct']}% margin)";
                $this->line(($dryRun ? '[DRY-RUN] ' : '') . "PRICE RAISED: {$name}  old={$r['old_rate']}  new={$r['new_rate']}  provider={$r['provider_rate']}");
            }

            $alertMessage = implode("\n", $alertLines);

            // Store alert in system settings so the API can surface it
            SystemSetting::set(
                'price_watch_last_alert',
                json_encode([
                    'raised'    => $totalRaised,
                    'dropped'   => $totalDropped,
                    'at'        => now()->toIso8601String(),
                    'dry_run'   => $dryRun,
                    'services'  => array_map(fn($r) => [
                        'name'          => $r['service']->name,
                        'external_id'   => $r['service']->external_service_id,
                        'provider_rate' => $r['provider_rate'],
                        'old_rate'      => $r['old_rate'],
                        'new_rate'      => $r['new_rate'],
                        'old_margin'    => $r['old_margin_pct'],
                    ], $priceRaises),
                ]),
                'Last price watch alert – auto-generated'
            );

            if (!$dryRun) {
                // Notify all admin users
                $adminUserIds = UserRole::where('role', 'admin')->pluck('user_id');
                foreach ($adminUserIds as $adminId) {
                    Notification::create([
                        'id'         => (string) \Illuminate\Support\Str::uuid(),
                        'user_id'    => $adminId,
                        'title'      => "⚠️ Price Alert: {$totalRaised} service(s) auto-corrected",
                        'message'    => "JustPanel raised wholesale prices on {$totalRaised} service(s). Your selling prices have been automatically adjusted to maintain a {$markup}% margin. Review the Critical Alerts panel for details.",
                        'type'       => 'warning',
                        'link'       => '/admin/critical-alerts',
                        'read'       => false,
                        'created_at' => now(),
                    ]);
                }
            }
        }

        // ── 4. Summary ─────────────────────────────────────────────────────
        $mode = $dryRun ? '[DRY-RUN] ' : '';
        $this->info("{$mode}Price watch complete.");
        $this->table(
            ['Metric', 'Count'],
            [
                ['Services checked',           $services->count()],
                ['Not in provider catalog',     $notInProvider],
                ['Prices auto-raised (fixes)',  $totalRaised],
                ['Provider dropped prices',     $totalDropped],
                ['Unchanged / healthy',         $unchanged],
            ]
        );

        if ($totalDropped > 0) {
            $this->warn("Provider dropped prices on {$totalDropped} service(s) but we did NOT auto-lower. Review manually to stay competitive.");
        }

        Log::info('automation:price-watch completed', [
            'raised'    => $totalRaised,
            'dropped'   => $totalDropped,
            'unchanged' => $unchanged,
            'dry_run'   => $dryRun,
        ]);

        return Command::SUCCESS;
    }
}
