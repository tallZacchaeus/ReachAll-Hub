<?php

namespace App\Services\Finance;

class MoneyHelper
{
    /**
     * Convert kobo integer to Naira float.
     * e.g. 100000 → 1000.00
     */
    public static function fromKobo(int $kobo): float
    {
        return $kobo / 100;
    }

    /**
     * Convert Naira float/string to kobo integer.
     * e.g. 1000.00 → 100000
     * Rounds to nearest kobo.
     */
    public static function toKobo(float|int|string $naira): int
    {
        return (int) round((float) $naira * 100);
    }

    /**
     * Format kobo integer as a human-readable Naira string.
     * e.g. 100000 → "₦1,000.00"
     */
    public static function format(int $kobo, bool $symbol = true): string
    {
        $naira = self::fromKobo($kobo);
        $formatted = number_format($naira, 2);

        return $symbol ? '₦' . $formatted : $formatted;
    }

    /**
     * Format kobo as compact notation.
     * e.g. 100000000 → "₦1M", 500000 → "₦5K"
     */
    public static function compact(int $kobo): string
    {
        $naira = self::fromKobo($kobo);

        if ($naira >= 1_000_000_000) {
            return '₦' . number_format($naira / 1_000_000_000, 1) . 'B';
        }

        if ($naira >= 1_000_000) {
            return '₦' . number_format($naira / 1_000_000, 1) . 'M';
        }

        if ($naira >= 1_000) {
            return '₦' . number_format($naira / 1_000, 1) . 'K';
        }

        return self::format($kobo);
    }
}
