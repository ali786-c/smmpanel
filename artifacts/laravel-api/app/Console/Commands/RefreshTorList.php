<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * RefreshTorList
 *
 * Downloads the official Tor Project bulk exit-node list once a day and
 * stores it in the Laravel cache (file driver by default).
 *
 * The ThreatMiddleware and SecurityMonitor both read from this cache,
 * so no API key or external service subscription is required.
 *
 * Source: https://check.torproject.org/torbulkexitlist
 * (Public domain, updated every 30 minutes by the Tor Project.)
 */
class RefreshTorList extends Command
{
    protected $signature   = 'security:refresh-tor-list';
    protected $description = 'Download and cache the Tor exit-node IP list from the Tor Project';

    public function handle(): int
    {
        $this->info('Fetching Tor exit-node list...');

        try {
            $response = Http::timeout(30)->get('https://check.torproject.org/torbulkexitlist');

            if (!$response->successful()) {
                $this->error('Failed to fetch: HTTP ' . $response->status());
                return Command::FAILURE;
            }

            $raw  = $response->body();
            $ips  = array_filter(
                array_map('trim', explode("\n", $raw)),
                fn($line) => filter_var($line, FILTER_VALIDATE_IP) !== false
            );
            $ips  = array_values($ips);

            // Cache for 25 hours — slightly longer than the refresh interval to
            // avoid a window where the cache has expired but cron hasn't run yet.
            Cache::put('tor_exit_nodes', $ips, now()->addHours(25));

            $this->info('Tor exit-node list updated. ' . count($ips) . ' IPs cached.');

            Log::info('security:refresh-tor-list', ['count' => count($ips)]);

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Error: ' . $e->getMessage());
            Log::error('security:refresh-tor-list failed', ['error' => $e->getMessage()]);
            return Command::FAILURE;
        }
    }
}
