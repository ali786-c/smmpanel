<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin'         => \App\Http\Middleware\AdminMiddleware::class,
            'moderator'     => \App\Http\Middleware\ModeratorMiddleware::class,
            'threat'        => \App\Http\Middleware\ThreatMiddleware::class,
            'login.throttle'=> \App\Http\Middleware\LoginThrottleMiddleware::class,
        ]);

        // Global middleware — applied to every request
        // Note: CORS is handled by Laravel's built-in HandleCors + config/cors.php
        $middleware->append(\App\Http\Middleware\SecurityHeadersMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Force all API routes to return JSON for unauthenticated requests
        $exceptions->shouldRenderJsonWhen(fn($request, $e) => $request->is('api/*'));

        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json(['error' => $e->errors()], 422);
                }
                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    return response()->json(['error' => 'Unauthenticated'], 401);
                }
                // Thrown when Laravel tries to redirect to non-existent 'login' route in API context
                if ($e instanceof \Symfony\Component\Routing\Exception\RouteNotFoundException) {
                    return response()->json(['error' => 'Unauthenticated'], 401);
                }
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    return response()->json(['error' => 'Not found'], 404);
                }
                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    return response()->json(['error' => 'Resource not found'], 404);
                }
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    $msg = $e->getStatusCode() >= 500 ? 'Server error' : ($e->getMessage() ?: 'HTTP error');
                    return response()->json(['error' => $msg], $e->getStatusCode());
                }

                // Never expose raw exception messages in production
                return response()->json(['error' => config('app.debug') ? $e->getMessage() : 'Server error'], 500);
            }
        });
    })->create();
