<?php

namespace App\Services;

use HTMLPurifier;
use HTMLPurifier_Config;

/**
 * Server-side HTML sanitiser.
 *
 * Strips disallowed tags and attributes from untrusted HTML before it is
 * stored in the database. Call this in every controller that persists
 * TipTap (or any rich-text) output.
 *
 * Allowed tags mirror the client-side DOMPurify allowlist in
 * resources/js/lib/sanitize.ts so that stored content always matches what
 * the frontend will render.
 *
 * Usage:
 *   $clean = HtmlSanitizer::clean($request->input('body'));
 */
class HtmlSanitizer
{
    private static ?HTMLPurifier $purifier = null;

    public static function clean(?string $dirty): string
    {
        if ($dirty === null || $dirty === '') {
            return '';
        }

        return self::purifier()->purify($dirty);
    }

    private static function purifier(): HTMLPurifier
    {
        if (self::$purifier !== null) {
            return self::$purifier;
        }

        $config = HTMLPurifier_Config::createDefault();

        // Cache purifier config in storage (speeds up subsequent requests)
        $config->set('Cache.SerializerPath', storage_path('framework/htmlpurifier'));

        // Allow the same tags the frontend DOMPurify allowlist permits
        $config->set('HTML.Allowed',
            'p,br,strong,em,u,s,'.
            'h1,h2,h3,h4,h5,h6,'.
            'ul,ol,li,'.
            'a[href|target|rel],blockquote,code,pre,'.
            'img[src|alt|class|style],'.
            'table,thead,tbody,tr,th[colspan|rowspan],td[colspan|rowspan],'.
            'hr,span[class|style],div[class|style],sub,sup'
        );

        // Force rel="noopener noreferrer" on external links
        $config->set('HTML.TargetBlank', true);
        $config->set('HTML.TargetNoreferrer', true);
        $config->set('HTML.TargetNoopener', true);

        // Allow limited CSS properties inside style attributes
        $config->set('CSS.AllowedProperties', 'font-weight,font-style,text-decoration,color,background-color,text-align');

        // Strip id attributes (prevent anchor-jacking)
        $config->set('HTML.ForbiddenAttributes', 'id,onclick,onmouseover,onmouseout,onload,onerror');

        self::$purifier = new HTMLPurifier($config);

        return self::$purifier;
    }
}
