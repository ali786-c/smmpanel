<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ─── Scheduled Automations ─────────────────────────────────────────────────
// Sync order statuses from provider every 5 minutes
Schedule::command('automation:sync-orders --limit=200')->everyFiveMinutes();

// Provider escalation: detect stale orders, ping JustPanel, open tickets, forward cancel requests
Schedule::command('automation:provider-escalation')->everyThirtyMinutes();

// Refund monitor: check and auto-refund cancelled orders every hour
Schedule::command('automation:refund-monitor')->hourly();

// AI support triage: auto-reply to unanswered tickets every 30 minutes
Schedule::command('automation:ai-support')->everyThirtyMinutes();

// Growth automation: daily re-engagement, promos, abandoned recovery
Schedule::command('automation:growth all')->dailyAt('09:00');

// Friday-specific promo (weekend special)
Schedule::command('automation:growth auto-promo')->weeklyOn(5, '08:00');

// Price watch: detect JustPanel price hikes, auto-correct negative-margin services
// Runs every 6 hours so margin losses are caught same day
Schedule::command('automation:price-watch --min-margin=10')->everySixHours();

// Daily digest: morning profit summary pushed to all admins at 08:00
Schedule::command('automation:daily-digest')->dailyAt('08:00');

// Security: refresh Tor exit-node list from the Tor Project once a day
Schedule::command('security:refresh-tor-list')->dailyAt('03:00');

// Security: scan ticket messages for malicious content / Tor-IP abuse every 15 min
Schedule::command('automation:security-monitor')->everyFifteenMinutes();

// Landing stats: increment order/customer counters once per day
Schedule::command('landing:increment-stats')->dailyAt('00:30');
