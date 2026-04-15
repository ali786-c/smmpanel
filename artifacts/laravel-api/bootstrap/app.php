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
            'admin'  => \App\Http\Middleware\AdminMiddleware::class,
            'moderator' => \App\Http\Middleware\ModeratorMiddleware::class,
            'threat' => \App\Http\Middleware\ThreatMiddleware::class,
        ]);

        $middleware->prepend(\App\Http\Middleware\CorsMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = 500;
                $message = 'Server error';

                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json(['error' => $e->errors()], 422);
                }
                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    return response()->json(['error' => 'Unauthenticated'], 401);
                }
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    return response()->json(['error' => 'Not found'], 404);
                }
                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    return response()->json(['error' => 'Resource not found'], 404);
                }
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    return response()->json(['error' => $e->getMessage() ?: 'HTTP error'], $e->getStatusCode());
                }

                return response()->json(['error' => config('app.debug') ? $e->getMessage() : 'Server error'], 500);
            }
        });
    })->create();
