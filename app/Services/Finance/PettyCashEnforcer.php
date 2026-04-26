<?php

namespace App\Services\Finance;

use App\Models\Finance\PettyCashFloat;
use App\Models\Finance\PettyCashTransaction;

/**
 * Hard-rule enforcement for petty cash expenses.
 * No override allowed — blocked means blocked.
 */
class PettyCashEnforcer
{
    // Hard caps (kobo)
    const CAP_SINGLE = 2_000_000; // ₦20,000

    const CAP_DAILY = 5_000_000; // ₦50,000

    const CAP_WEEKLY = 20_000_000; // ₦200,000

    const RECON_DAYS = 30;

    /**
     * Validate a proposed expense against all hard rules.
     *
     * @return array{allowed: bool, reason: string|null}
     */
    public static function validate(PettyCashFloat $float, int $amountKobo): array
    {
        // 1. Float must be active
        if ($float->status !== 'active') {
            return self::block('This petty cash float is suspended.');
        }

        // 2. Sufficient balance
        if ($amountKobo > $float->current_balance_kobo) {
            return self::block('Insufficient float balance. Available: '.MoneyHelper::format($float->current_balance_kobo).'.');
        }

        // 3. Single expense cap
        if ($amountKobo > self::CAP_SINGLE) {
            return self::block(
                'Amount exceeds the ₦20,000 single expense cap. Use a requisition for larger amounts.'
            );
        }

        // 4. Daily cap — uses server-side created_at, not the user-supplied date field.
        // This prevents backdating or forward-dating expenses to bypass the cap.
        $todayTotal = PettyCashTransaction::where('float_id', $float->id)
            ->where('type', 'expense')
            ->whereDate('created_at', now()->toDateString())
            ->whereIn('status', ['pending_recon', 'reconciled'])
            ->sum('amount_kobo');

        if (($todayTotal + $amountKobo) > self::CAP_DAILY) {
            $remaining = self::CAP_DAILY - $todayTotal;

            return self::block(
                'This expense would exceed the ₦50,000 daily cap. '
                .'Remaining today: '.MoneyHelper::format(max(0, $remaining)).'.'
            );
        }

        // 5. Weekly cap (Mon–Sun week) — uses created_at for same reason as daily cap.
        $weekStart = now()->startOfWeek();
        $weeklyTotal = PettyCashTransaction::where('float_id', $float->id)
            ->where('type', 'expense')
            ->where('created_at', '>=', $weekStart->startOfDay()->toDateTimeString())
            ->whereIn('status', ['pending_recon', 'reconciled'])
            ->sum('amount_kobo');

        if (($weeklyTotal + $amountKobo) > self::CAP_WEEKLY) {
            $remaining = self::CAP_WEEKLY - $weeklyTotal;

            return self::block(
                'This expense would exceed the ₦200,000 weekly cap. '
                .'Remaining this week: '.MoneyHelper::format(max(0, $remaining)).'.'
            );
        }

        // 6. 30-day reconciliation block
        $daysSince = $float->daysSinceReconciliation();
        if ($daysSince > self::RECON_DAYS) {
            return self::block(
                "Reconciliation overdue ({$daysSince} days since last reconciliation). "
                .'Submit a reconciliation before logging new expenses.'
            );
        }

        return ['allowed' => true, 'reason' => null];
    }

    private static function block(string $reason): array
    {
        return ['allowed' => false, 'reason' => $reason];
    }
}
