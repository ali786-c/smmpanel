<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ModeratorMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (!$user || !$user->isModerator()) {
            return response()->json(['error' => 'Forbidden: Moderator access required'], 403);
        }

        return $next($request);
    }
}
