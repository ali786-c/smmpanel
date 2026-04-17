<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * LoginThrottleMiddleware
 * Brute-force protection for login endpoint.
 * Max 5 failed attempts per IP per 15 minutes → 10-min lockout.
 */
class LoginThrottleMiddleware
{
    private const MAX_ATTEMPTS    = 5;
    private const DECAY_MINUTES   = 15;
    private const LOCKOUT_MINUTES = 10;

    public function handle(Request $request, Closure $next)
    {
        $ip  = $request->ip();
        $key = 'login_attempts_' . md5($ip);

        $lockoutKey = 'login_lockout_' . md5($ip);
        if (Cache::has($lockoutKey)) {
            $seconds = Cache::get($lockoutKey . '_ttl', self::LOCKOUT_MINUTES * 60);
            return response()->json([
                'error' => 'Too many failed login attempts. Please try again in ' . ceil($seconds / 60) . ' minutes.',
            ], 429);
        }

        $response = $next($request);

        // Track failures (401 = wrong credentials)
        if ($response->getStatusCode() === 401) {
            $attempts = Cache::increment($key);
            if ($attempts === 1) {
                Cache::put($key, 1, now()->addMinutes(self::DECAY_MINUTES));
            }

            if ($attempts >= self::MAX_ATTEMPTS) {
                $ttl = self::LOCKOUT_MINUTES * 60;
                Cache::put($lockoutKey, true, now()->addSeconds($ttl));
                Cache::put($lockoutKey . '_ttl', $ttl, now()->addSeconds($ttl));
                Cache::forget($key);
                Log::warning('Login lockout triggered', ['ip' => $ip, 'attempts' => $attempts]);

                return response()->json([
                    'error' => 'Too many failed login attempts. Account locked for ' . self::LOCKOUT_MINUTES . ' minutes.',
                ], 429);
            }

            $remaining = self::MAX_ATTEMPTS - $attempts;
            $data = json_decode($response->getContent(), true);
            $data['attempts_remaining'] = $remaining;
            return response()->json($data, 401);
        }

        // On success, clear attempt counter
        if ($response->getStatusCode() === 200) {
            Cache::forget($key);
            Cache::forget($lockoutKey);
        }

        return $response;
    }
}
