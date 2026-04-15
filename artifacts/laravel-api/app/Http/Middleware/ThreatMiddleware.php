<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\UserRole;
use App\Models\Wallet;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * ThreatMiddleware
 *
 * Attached to /api/auth/register and /api/auth/login.
 * Lightweight, cached IP check — adds < 1ms overhead for known IPs.
 *
 * On register:
 *   • Checks Tor exit node list (file-cached, refreshed daily by cron).
 *   • If positive → rejects registration with 403 and a clear message.
 *
 * On authenticated requests (auth:api applied first):
 *   • Checks current IP.  If flagged AND user has zero balance AND no orders →
 *     marks the account as banned and returns 403.
 *
 * ip-api.com free tier: 1000 req/min, no key required.
 * Results are cached 24h per IP so the external call is essentially a one-time cost.
 */
class ThreatMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $ip = $request->ip();

        // Skip private / loopback addresses (dev environment)
        if ($this->isPrivateIp($ip)) {
            return $next($request);
        }

        // Check our cached assessment for this IP
        $cacheKey  = 'threat_ip_' . md5($ip);
        $cached    = Cache::get($cacheKey); // null = unknown, false = clean, string = threat reason

        if ($cached === null) {
            $cached = $this->assessIp($ip);
            Cache::put($cacheKey, $cached ?? false, now()->addHours(24));
        }

        $threatReason = ($cached && $cached !== false) ? $cached : null;

        if (!$threatReason) {
            return $next($request); // Clean IP — proceed normally
        }

        // ── Tor / VPN detected ────────────────────────────────────────────

        $route = $request->route()?->getName() ?? $request->path();

        // On registration: block outright — don't let them create an account
        if (str_contains($route, 'register') || str_ends_with($request->path(), 'register')) {
            Log::warning('Registration blocked – threat IP', ['ip' => $ip, 'reason' => $threatReason]);
            return response()->json([
                'error' => 'Registration from anonymising networks is not permitted. Please disable your VPN or Tor and try again.',
            ], 403);
        }

        // On authenticated routes: check if already-logged-in user has no value → auto-ban
        $user = auth('api')->user();
        if ($user) {
            $profile = Profile::where('user_id', $user->id)->first();

            if ($profile && !$profile->is_banned) {
                $wallet   = Wallet::where('user_id', $user->id)->first();
                $balance  = (float) ($wallet?->balance ?? 0);
                $hasOrders = \App\Models\Order::where('user_id', $user->id)
                    ->whereIn('status', ['Completed', 'In progress', 'Processing'])
                    ->exists();

                if ($balance <= 0 && !$hasOrders) {
                    $profile->update([
                        'is_banned'  => true,
                        'ban_reason' => "[Auto-ban] {$threatReason} – zero-balance account",
                    ]);

                    $adminId = UserRole::where('role', 'admin')->value('user_id');
                    if ($adminId) {
                        Notification::create([
                            'id'         => (string) Str::uuid(),
                            'user_id'    => $adminId,
                            'title'      => '🚫 Auto-Banned (Threat IP)',
                            'message'    => "User {$user->email} ({$user->id}) auto-banned on request. IP {$ip}: {$threatReason}",
                            'type'       => 'error',
                            'link'       => "/admin/users/{$user->id}",
                            'read'       => false,
                            'created_at' => now(),
                        ]);
                    }

                    return response()->json(['error' => 'Your account has been suspended. Contact support.'], 403);
                }
            }
        }

        // Threat IP but user has value — let them through, log it
        Log::info('Threat IP permitted (has value)', ['ip' => $ip, 'reason' => $threatReason]);

        return $next($request);
    }

    // ──────────────────────────────────────────────────────────────────────

    private function assessIp(string $ip): ?string
    {
        // 1. Local Tor exit-node list (no network call)
        $torList = Cache::get('tor_exit_nodes', []);
        if (in_array($ip, $torList, true)) {
            return 'Tor exit node';
        }

        // 2. ip-api.com
        try {
            $resp = Http::timeout(4)->get("http://ip-api.com/json/{$ip}", [
                'fields' => 'status,proxy,hosting,tor',
            ]);

            if (!$resp->successful()) return null;

            $data  = $resp->json();
            if (($data['status'] ?? '') !== 'success') return null;

            $flags = [];
            if (!empty($data['tor']))     $flags[] = 'Tor';
            if (!empty($data['proxy']))   $flags[] = 'Proxy/VPN';
            if (!empty($data['hosting'])) $flags[] = 'Datacenter/Hosting';

            return empty($flags) ? null : implode(', ', $flags);
        } catch (\Throwable $e) {
            return null; // Network hiccup — don't penalise user
        }
    }

    private function isPrivateIp(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
    }
}
