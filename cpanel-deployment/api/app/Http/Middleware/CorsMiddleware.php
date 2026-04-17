<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * CorsMiddleware
 * Restricts cross-origin requests to the known frontend origins.
 */
class CorsMiddleware
{
    private array $allowedOrigins = [];

    public function __construct()
    {
        $frontend = config('app.frontend_url', env('FRONTEND_URL', ''));
        $replitDomain = env('REPLIT_DEV_DOMAIN', '');

        $this->allowedOrigins = array_filter(array_unique([
            'http://localhost:18150',
            'http://localhost:80',
            $frontend,
            $replitDomain ? "https://{$replitDomain}" : null,
        ]));
    }

    public function handle(Request $request, Closure $next)
    {
        $origin = $request->headers->get('Origin', '');

        // Handle preflight
        if ($request->isMethod('OPTIONS')) {
            return $this->buildResponse($request, response('', 204), $origin);
        }

        $response = $next($request);
        return $this->buildResponse($request, $response, $origin);
    }

    private function buildResponse(Request $request, $response, string $origin)
    {
        if ($this->isAllowedOrigin($origin)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        $response->headers->set('Access-Control-Max-Age', '86400');
        $response->headers->set('Vary', 'Origin');

        return $response;
    }

    private function isAllowedOrigin(string $origin): bool
    {
        if (empty($origin)) return false;

        // Always allow from the same Replit workspace domain
        if (str_contains($origin, '.spock.replit.dev') || str_contains($origin, '.replit.dev')) {
            return true;
        }

        foreach ($this->allowedOrigins as $allowed) {
            if ($allowed && ($origin === $allowed || str_starts_with($origin, $allowed))) {
                return true;
            }
        }

        return false;
    }
}
