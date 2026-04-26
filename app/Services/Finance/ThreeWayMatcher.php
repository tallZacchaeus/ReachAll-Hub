<?php

namespace App\Services\Finance;

use App\Models\Finance\GoodsReceipt;
use App\Models\Finance\Invoice;
use App\Models\Finance\Requisition;

/**
 * Three-Way Matcher (Requisition ↔ Invoice ↔ Goods Receipt).
 *
 * Rules:
 *  - Invoice amount must be within TOLERANCE_KOBO of the requisition amount.
 *  - Invoice vendor must match the requisition vendor (if both are set).
 *  - A goods receipt must exist (confirming delivery).
 *
 * Thresholds:
 *  - ≥ ₦500K: three-way match REQUIRED before payment.
 *  - < ₦500K: match is OPTIONAL (system warns but does not block).
 *
 * Tolerance: ₦100 (10,000 kobo) — per FINANCE_SPEC.md.
 */
class ThreeWayMatcher
{
    /** ₦100 in kobo — minor discrepancy tolerance (per FINANCE_SPEC.md) */
    public const TOLERANCE_KOBO = 10_000;

    /** ₦500,000 in kobo — match is REQUIRED above this */
    public const MATCH_REQUIRED_THRESHOLD_KOBO = 50_000_000;

    /**
     * Run three-way match and return result.
     *
     * @return array{
     *   match_status: 'matched'|'variance'|'blocked',
     *   variance_kobo: int,
     *   flags: array<array{code: string, description: string}>,
     *   requires_match: bool
     * }
     */
    public static function match(Requisition $req, Invoice $invoice, GoodsReceipt $receipt): array
    {
        $flags = [];
        $varianceKobo = 0;

        // ── 1. Vendor consistency ────────────────────────────────────────────
        if ($req->vendor_id && $invoice->vendor_id && $req->vendor_id !== $invoice->vendor_id) {
            $flags[] = [
                'code' => 'VENDOR_MISMATCH',
                'description' => 'Invoice vendor does not match the requisition vendor.',
            ];
        }

        // ── 2. Amount tolerance check ────────────────────────────────────────
        $varianceKobo = $invoice->amount_kobo - $req->amount_kobo;
        if (\abs($varianceKobo) > self::TOLERANCE_KOBO) {
            $flags[] = [
                'code' => 'INVOICE_AMOUNT_VARIANCE',
                'description' => sprintf(
                    'Invoice amount %s differs from requisition amount %s (variance: %s).',
                    MoneyHelper::format($invoice->amount_kobo),
                    MoneyHelper::format($req->amount_kobo),
                    MoneyHelper::format(\abs($varianceKobo))
                ),
            ];
        }

        // ── 3. Determine match status ────────────────────────────────────────
        $hasVendorMismatch = collect($flags)->contains('code', 'VENDOR_MISMATCH');

        $matchStatus = match (true) {
            empty($flags) => 'matched',
            $hasVendorMismatch => 'blocked',  // vendor mismatch = hard block
            default => 'variance', // amount variance = CEO review
        };

        // If within tolerance, clear the variance for display purposes
        if ($matchStatus === 'matched') {
            $varianceKobo = 0;
        }

        return [
            'match_status' => $matchStatus,
            'variance_kobo' => $varianceKobo,
            'flags' => $flags,
            'requires_match' => self::isMatchRequired($req),
        ];
    }

    public static function isMatchRequired(Requisition $req): bool
    {
        return $req->amount_kobo >= self::MATCH_REQUIRED_THRESHOLD_KOBO;
    }
}
