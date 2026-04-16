<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetSecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        channels: __DIR__.'/../routes/channels.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // CAT11-02: Security response headers on every request
        $middleware->append(SetSecurityHeaders::class);

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // CAT11-03: Sentry error monitoring — attach finance context to critical exceptions.
        $exceptions->reportable(function (\Throwable $e) {
            if (app()->bound('sentry') && config('sentry.dsn')) {
                \Sentry\Laravel\Integration::captureUnhandledException($e);
            }
        });

        // Finance-critical exceptions get extra Sentry context so on-call can triage fast.
        $exceptions->reportable(function (\RuntimeException $e) {
            if (app()->bound('sentry') && config('sentry.dsn')) {
                \Sentry\configureScope(function (\Sentry\State\Scope $scope): void {
                    $scope->setTag('module', 'finance');
                });
            }
        });
    })->create();
