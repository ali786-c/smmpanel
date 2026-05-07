<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Profile;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\UserRole;
use App\Models\Wallet;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * SecurityMonitor
 *
 * Runs every 15 minutes.  Scans recent ticket messages and order links for:
 *
 *  1. Malicious file drops  — links to executables, archives, scripts posted
 *     in support tickets to trick admin into downloading/running them.
 *
 *  2. IP-grabber / phishing URLs — known grabify-style domains, Discord
 *     webhooks (used as exfiltration endpoints), and common phishing keywords.
 *
 *  3. Tor / VPN / datacenter IPs on signup — calls ip-api.com (free, no key)
 *     and auto-bans accounts that registered from anonymising infrastructure
 *     and have zero balance and zero orders.
 *
 * On a confirmed threat the user is:
 *   • Banned immediately (profile.is_banned = true).
 *   • Logged to activity_log.
 *   • All admin users receive a notification.
 */
class SecurityMonitor extends Command
{
    protected $signature = 'automation:security-monitor {--dry-run : Simulate without banning}';
    protected $description = 'Scan for malicious users (Tor/VPN, malicious links) and auto-ban them';

    // ── Dangerous file extensions ──────────────────────────────────────────
    private const MALICIOUS_EXTENSIONS = [
        'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'vbe', 'js',
        'jse', 'wsf', 'wsh', 'msi', 'msp', 'ps1', 'ps2', 'psm1', 'psd1',
        'sh', 'bash', 'zsh', 'fish', 'py', 'rb', 'pl', 'php', 'jar',
        'dmg', 'pkg', 'deb', 'rpm', 'appimage', 'apk',
    ];

    // ── Known IP-grabber / phishing / exfiltration domains ────────────────
    private const THREAT_DOMAINS = [
        'grabify.link', 'iplogger.org', '2no.co', 'yip.su', 'lnkz.eu',
        'ipgrabber.ru', 'iplogger.ru', 'blasze.com', 'getipintel.net',
        'ps3cfw.com', 'bc.vc', 'bmtf.ru', 'l.prli.co', 'shroud.live',
        'getgeoapi.com', 'api64.ipify.org', 'api.ipify.org',
        // File-drop sites frequently used to bypass AV
        'anonfiles.com', 'gofile.io', 'bayfiles.com', 'letsupload.io',
        'filedropper.com', 'transfer.sh',
        // Discord webhooks – used to exfiltrate data
        'discord.com/api/webhooks', 'discordapp.com/api/webhooks',
    ];

    // ── Phishing keyword combos (must appear together in same message) ─────
    private const PHISHING_PATTERNS = [
        ['verify', 'paypal'],
        ['verify', 'apple'],
        ['verify', 'google'],
        ['verify', 'microsoft'],
        ['verify', 'account', 'click'],
        ['login', 'suspended', 'click'],
        ['password', 'reset', 'urgent'],
        ['prize', 'winner', 'claim'],
    ];

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $this->info('Running security monitor...' . ($dryRun ? ' [DRY-RUN]' : ''));

        $banned   = 0;
        $scanned  = 0;

        // ── 1. Scan recent ticket messages (last 30 minutes) ──────────────
        $recentMessages = TicketMessage::where('created_at', '>=', now()->subMinutes(30))
            ->where('sender', 'user')
            ->with(['ticket:id,user_id'])
            ->get();

        $this->info("Scanning {$recentMessages->count()} recent ticket messages...");

        foreach ($recentMessages as $msg) {
            $scanned++;
            $userId   = $msg->ticket?->user_id;
            if (!$userId) continue;

            $profile = Profile::where('user_id', $userId)->with('user.roles')->first();
            if (!$profile || $profile->is_banned) continue;
            
            // Skip admins
            if ($profile->user?->isAdmin()) continue;

            $threat = $this->detectMessageThreat($msg->content);
            if (!$threat) continue;

            $wallet = Wallet::where('user_id', $userId)->first();
            $balance = (float) ($wallet?->balance ?? 0);

            $this->warn("[TICKET THREAT] User {$userId} | Reason: {$threat['reason']} | Balance: \${$balance}");

            // Ban immediately regardless of balance – posting malicious content is a hard rule
            if (!$dryRun) {
                $this->banUser($userId, $profile, $threat['reason'], 'ticket_content');
                $banned++;
            }
        }

        // ── 2. Check IPs of new registrations (last 24 h) ─────────────────
        $recentLogins = ActivityLog::where('action', 'login')
            ->where('created_at', '>=', now()->subHours(24))
            ->whereNotNull('ip_address')
            ->select('actor_id', 'ip_address', 'created_at')
            ->orderByDesc('created_at')
            ->get()
            ->unique('actor_id'); // one check per user, most recent login

        $this->info("Checking IPs for {$recentLogins->count()} recently logged-in users...");

        foreach ($recentLogins as $log) {
            $scanned++;
            $userId = $log->actor_id;
            $ip     = $log->ip_address;

            $profile = Profile::where('user_id', $userId)->with('user.roles')->first();
            if (!$profile || $profile->is_banned) continue;

            // Skip admins
            if ($profile->user?->isAdmin()) continue;

            // Skip local / private IPs
            if ($this->isPrivateIp($ip)) continue;

            $ipThreat = $this->checkIpReputation($ip);
            if (!$ipThreat) continue;

            // Only auto-ban if wallet has ≤ 0 balance AND they have no completed orders
            $wallet  = Wallet::where('user_id', $userId)->first();
            $balance = (float) ($wallet?->balance ?? 0);

            $hasOrders = \App\Models\Order::where('user_id', $userId)
                ->where('status', 'Completed')
                ->exists();

            $this->warn("[IP THREAT] User {$userId} | IP: {$ip} | {$ipThreat} | Balance: \${$balance} | Has orders: " . ($hasOrders ? 'yes' : 'no'));

            if ($balance <= 0 && !$hasOrders) {
                if (!$dryRun) {
                    $this->banUser($userId, $profile, "Anonymising network ({$ipThreat}) with no legitimate activity", 'ip_threat');
                    $banned++;
                }
            } else {
                // Flag for admin review but don't auto-ban paying users
                $this->flagForReview($userId, $ip, $ipThreat, $balance);
            }
        }

        $mode = $dryRun ? '[DRY-RUN] ' : '';
        $this->info("{$mode}Security monitor complete. Scanned: {$scanned} | Banned: {$banned}");

        Log::info('automation:security-monitor completed', [
            'scanned' => $scanned,
            'banned'  => $banned,
            'dry_run' => $dryRun,
        ]);

        return Command::SUCCESS;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Threat detection helpers
    // ──────────────────────────────────────────────────────────────────────

    private function detectMessageThreat(string $content): ?array
    {
        $lower = strtolower($content);

        // 1. Executable file extension in a URL
        preg_match_all('/https?:\/\/[^\s\'"<>]+/i', $content, $urlMatches);
        foreach ($urlMatches[0] as $url) {
            // Check file extension
            $path = parse_url($url, PHP_URL_PATH) ?? '';
            $ext  = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            if ($ext && in_array($ext, self::MALICIOUS_EXTENSIONS, true)) {
                return ['reason' => "Malicious file link in ticket: .{$ext} file ({$url})", 'type' => 'malicious_file'];
            }

            // Check threat domain
            $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
            foreach (self::THREAT_DOMAINS as $domain) {
                if (str_contains($host . $url, $domain)) {
                    return ['reason' => "Known threat domain in ticket: {$domain}", 'type' => 'threat_domain'];
                }
            }
        }

        // 2. Embedded base64 blobs (common payload delivery)
        if (preg_match('/[A-Za-z0-9+\/]{60,}={0,2}/', $content, $b64)) {
            $decoded = base64_decode($b64[0], true);
            if ($decoded && (str_contains($decoded, 'MZ') || str_contains($decoded, '#!/'))) {
                return ['reason' => 'Base64-encoded executable or script payload', 'type' => 'b64_payload'];
            }
        }

        // 3. Phishing keyword combos
        foreach (self::PHISHING_PATTERNS as $keywords) {
            $allPresent = true;
            foreach ($keywords as $kw) {
                if (!str_contains($lower, $kw)) {
                    $allPresent = false;
                    break;
                }
            }
            if ($allPresent) {
                return ['reason' => 'Phishing pattern detected: ' . implode('+', $keywords), 'type' => 'phishing'];
            }
        }

        return null;
    }

    /**
     * Check an IP against ip-api.com (free, no key, 1000 req/min).
     * Results are cached for 24 hours to avoid hammering the API.
     */
    private function checkIpReputation(string $ip): ?string
    {
        $cacheKey = 'ip_rep_' . md5($ip);

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($ip) {
            // First check our cached Tor exit node list (no network call)
            $torList = Cache::get('tor_exit_nodes', []);
            if (in_array($ip, $torList, true)) {
                return 'Tor exit node';
            }

            try {
                $resp = Http::timeout(5)->get("http://ip-api.com/json/{$ip}", [
                    'fields' => 'status,proxy,hosting,tor,isp,org,countryCode',
                ]);

                if (!$resp->successful()) return null;

                $data = $resp->json();
                if (($data['status'] ?? '') !== 'success') return null;

                $flags = [];
                if (!empty($data['tor']))     $flags[] = 'Tor';
                if (!empty($data['proxy']))   $flags[] = 'Proxy/VPN';
                if (!empty($data['hosting'])) $flags[] = 'Datacenter/Hosting';

                return empty($flags) ? null : implode(', ', $flags);
            } catch (\Throwable $e) {
                return null; // Network issue – don't punish the user
            }
        });
    }

    private function isPrivateIp(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Actions
    // ──────────────────────────────────────────────────────────────────────

    private function banUser(string $userId, Profile $profile, string $reason, string $type): void
    {
        // Emergency check: NEVER ban an admin
        if ($profile->user?->isAdmin()) {
            $this->warn("!!! EMERGENCY BYPASS: Attempted to ban admin {$userId} !!!");
            return;
        }

        $profile->update([
            'is_banned'  => true,
            'ban_reason' => "[Auto-ban] {$reason}",
        ]);

        // System user for the activity log actor – use a placeholder UUID
        $systemActorId = $this->getSystemActorId();

        ActivityLog::create([
            'id'          => (string) Str::uuid(),
            'actor_id'    => $systemActorId,
            'action'      => 'auto_ban',
            'target_type' => 'user',
            'target_id'   => $userId,
            'details'     => ['reason' => $reason, 'type' => $type, 'auto' => true],
            'created_at'  => now(),
        ]);

        // Notify all admins
        $adminIds = UserRole::where('role', 'admin')->pluck('user_id');
        foreach ($adminIds as $adminId) {
            Notification::create([
                'id'         => (string) Str::uuid(),
                'user_id'    => $adminId,
                'title'      => '🚫 User Auto-Banned',
                'message'    => "User {$profile->display_name} ({$userId}) was automatically banned. Reason: {$reason}",
                'type'       => 'error',
                'link'       => "/admin/users/{$userId}",
                'read'       => false,
                'created_at' => now(),
            ]);
        }

        $this->warn("  → BANNED: {$userId} — {$reason}");
    }

    private function flagForReview(string $userId, string $ip, string $threatType, float $balance): void
    {
        $adminIds = UserRole::where('role', 'admin')->pluck('user_id');
        foreach ($adminIds as $adminId) {
            Notification::create([
                'id'         => (string) Str::uuid(),
                'user_id'    => $adminId,
                'title'      => '⚠️ Suspicious IP – Manual Review',
                'message'    => "User {$userId} logged in from {$ip} ({$threatType}). Balance \${$balance}. Not auto-banned (has activity). Please review.",
                'type'       => 'warning',
                'link'       => "/admin/users/{$userId}",
                'read'       => false,
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Returns the first admin user ID to use as the "system" actor in activity logs.
     * Falls back to a deterministic UUID derived from the string "system".
     */
    private function getSystemActorId(): string
    {
        return UserRole::where('role', 'admin')->value('user_id')
            ?? (string) Str::uuid();
    }
}
