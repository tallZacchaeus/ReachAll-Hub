<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CAT11-02: Security response headers.
 *
 * Applied globally to every web response. CSP is only enforced in production
 * to avoid breaking the Vite dev server (which needs 'unsafe-eval' for HMR).
 */
class SetSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // CSP and HSTS are only enforced in production — Vite dev server needs 'unsafe-eval'
        // for HMR, and HSTS must not be sent over HTTP in dev/staging environments.
        if (app()->isProduction()) {
            // CAT11-01: Strict-Transport-Security — instructs browsers to only use HTTPS
            // for the next year. Prevents SSL-stripping on first contact.
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );

            $response->headers->set(
                'Content-Security-Policy',
                "default-src 'self'; ".
                "script-src 'self'; ".
                "style-src 'self' 'unsafe-inline'; ".
                "img-src 'self' data: blob:; ".
                "font-src 'self'; ".
                "connect-src 'self' wss://*.pusher.com;"
            );
        }

        return $response;
    }
}
