<?php

namespace App\Services\Finance;

use App\Models\Finance\AccountCode;

/**
 * Computes VAT and WHT for a requisition amount.
 *
 * Rules:
 *  - VAT  = 7.5% when account_code.tax_vat_applicable = true
 *  - WHT  = account_code.wht_rate % when tax_wht_applicable = true
 *  - total = amount + VAT − WHT  (WHT is deducted from the gross payable)
 *
 * All values are in KOBO (integer). Never use floats for money.
 */
class TaxCalculator
{
    /** @deprecated Use config('finance.vat_rate') — kept for backwards compatibility in tests. */
    public const VAT_RATE = 0.075; // 7.5 %

    /**
     * @return array{vat_kobo: int, wht_kobo: int, total_kobo: int}
     */
    public static function calculate(int $amountKobo, AccountCode $accountCode): array
    {
        // CAT10-03: Use configurable VAT rate; falls back to 7.5% if config not loaded.
        $vatRate = (float) config('finance.vat_rate', self::VAT_RATE);

        $vatKobo = 0;
        $whtKobo = 0;

        if ($accountCode->tax_vat_applicable) {
            $vatKobo = (int) round($amountKobo * $vatRate);
        }

        if ($accountCode->tax_wht_applicable && $accountCode->wht_rate > 0) {
            $whtKobo = (int) round($amountKobo * ($accountCode->wht_rate / 100));
        }

        // Total payable = gross + VAT − WHT (WHT is withheld from vendor payment)
        $totalKobo = $amountKobo + $vatKobo - $whtKobo;

        return [
            'vat_kobo'   => $vatKobo,
            'wht_kobo'   => $whtKobo,
            'total_kobo' => $totalKobo,
        ];
    }

    /**
     * Preview helper for frontend — returns a plain array of formatted strings.
     *
     * @return array{gross: string, vat: string, wht: string, total: string, vat_applicable: bool, wht_applicable: bool, wht_rate: int|null}
     */
    public static function preview(int $amountKobo, AccountCode $accountCode): array
    {
        $result = self::calculate($amountKobo, $accountCode);

        return [
            'gross'          => MoneyHelper::format($amountKobo),
            'vat'            => MoneyHelper::format($result['vat_kobo']),
            'wht'            => MoneyHelper::format($result['wht_kobo']),
            'total'          => MoneyHelper::format($result['total_kobo']),
            'vat_kobo'       => $result['vat_kobo'],
            'wht_kobo'       => $result['wht_kobo'],
            'total_kobo'     => $result['total_kobo'],
            'vat_applicable' => $accountCode->tax_vat_applicable,
            'wht_applicable' => $accountCode->tax_wht_applicable,
            'wht_rate'       => $accountCode->wht_rate,
        ];
    }
}
