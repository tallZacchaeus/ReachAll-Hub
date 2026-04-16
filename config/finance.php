<?php

/**
 * Finance module configuration.
 *
 * CAT10-03: All rates and thresholds are environment-configurable so they
 * can be updated without a code deployment when FIRS changes the rates.
 */
return [

    // ── Tax Rates ─────────────────────────────────────────────────────────────

    /**
     * Value-Added Tax rate (decimal fraction).
     * Current FIRS rate: 7.5% = 0.075
     * Override via: FINANCE_VAT_RATE=0.075
     */
    'vat_rate' => (float) env('FINANCE_VAT_RATE', 0.075),

    /**
     * Valid WHT percentages accepted in account code setup.
     * FIRS schedule: 5% (rent/dividends), 10% (contracts/commissions).
     */
    'wht_rates' => [5, 10],

    // ── Approval Thresholds (kobo) ────────────────────────────────────────────

    /**
     * Requisitions below this amount can be paid from 'approved' state
     * without a three-way match (₦500K = 50_000_000 kobo).
     */
    'match_threshold_kobo' => (int) env('FINANCE_MATCH_THRESHOLD_KOBO', 50_000_000),

    // ── Petty Cash ────────────────────────────────────────────────────────────

    /**
     * Default single-transaction cap for petty cash expenses (kobo).
     * ₦10,000 = 1_000_000 kobo.
     */
    'petty_cash_single_cap_kobo' => (int) env('FINANCE_PETTY_CASH_SINGLE_CAP_KOBO', 1_000_000),

    // ── Report Exports ───────────────────────────────────────────────────────

    /**
     * CAT6-04: Reports over this row count are queued to a background job
     * instead of being streamed synchronously.
     */
    'report_sync_row_limit' => (int) env('FINANCE_REPORT_SYNC_ROW_LIMIT', 5000),

];
