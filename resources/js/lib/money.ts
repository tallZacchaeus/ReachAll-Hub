/**
 * CAT8-04: Centralised money formatting for the frontend.
 *
 * All monetary values from the API are integers in kobo (100 kobo = ₦1).
 * Never do arithmetic on the formatted string — always work in kobo and
 * format only at the point of display.
 */

/**
 * Format a kobo integer as a Nigerian Naira string.
 * e.g. 150000 → "₦1,500.00"
 */
export function formatNaira(kobo: number): string {
    const naira = kobo / 100;
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(naira);
}

/**
 * Compact format for large amounts in summary widgets.
 * e.g. 5_000_000_00 (₦5M) → "₦5.0M"
 *      150_000_00 (₦150K) → "₦150.0K"
 */
export function formatNairaCompact(kobo: number): string {
    const naira = kobo / 100;
    if (Math.abs(naira) >= 1_000_000) {
        return `₦${(naira / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(naira) >= 1_000) {
        return `₦${(naira / 1_000).toFixed(1)}K`;
    }
    return formatNaira(kobo);
}

/**
 * Convert a naira decimal string (from a form input) to kobo integer.
 * Returns NaN if the input cannot be parsed.
 */
export function nairaToKobo(naira: string | number): number {
    const val = typeof naira === 'string' ? parseFloat(naira) : naira;
    return Math.round(val * 100);
}
