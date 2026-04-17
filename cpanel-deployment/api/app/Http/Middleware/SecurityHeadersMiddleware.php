<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * SecurityHeadersMiddleware
 * Adds industry-standard HTTP security headers to every API response.
 */
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Prevent clickjacking
        $response->headers->set('X-Frame-Options', 'DENY');

        // Prevent MIME-type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Enable XSS filtering (legacy browsers)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Don't send referrer to other origins
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Strict Transport Security (enforced after first HTTPS load)
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Restrict permissions for sensitive browser features
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        // Content-Security-Policy for APIs — restrict to same origin
        $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

        // Hide server technology
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}
