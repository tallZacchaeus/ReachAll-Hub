<?php

namespace App\Services\Finance;

use App\Models\Finance\CostCentre;
use App\Models\Finance\Requisition;

/**
 * Budget Enforcer — called at every Finance-tier approval.
 *
 * Computes the projected spend for a cost centre (used + incoming) against
 * its annual budget and returns a status code:
 *
 *   allow     — projected spend < 80% of budget
 *   warn_80   — projected spend ≥ 80% and < 90%
 *   warn_90   — projected spend ≥ 90% and < 100%
 *   block_100 — projected spend ≥ 100%; only CEO can override with documented reason
 *
 * Budget consumption counts requisitions in statuses:
 * approving | approved | matched | paid | posted.
 * This ensures a requisition counts against the budget as soon as it enters
 * the approval chain — not only after three-way matching — preventing
 * over-commitment when multiple requests are approved concurrently.
 * Optionally scoped to a financial period.
 */
class BudgetEnforcer
{
    /**
     * Statuses that count as committed spend.
     * 'cancelled' and 'rejected' are excluded by not being listed here.
     */
    private const COMMITTED_STATUSES = ['approving', 'approved', 'matched', 'paid', 'posted'];

    /**
     * @return array{
     *   status: 'allow'|'warn_80'|'warn_90'|'block_100',
     *   percentage: float,
     *   used_kobo: int,
     *   projected_kobo: int,
     *   budget_kobo: int
     * }
     */
    public static function check(
        CostCentre $costCentre,
        int $newAmountKobo,
        ?int $periodId = null
    ): array {
        $query = Requisition::where('cost_centre_id', $costCentre->id)
            ->whereIn('status', self::COMMITTED_STATUSES);

        if ($periodId) {
            $query->where('financial_period_id', $periodId);
        }

        $usedKobo = (int) $query->sum('amount_kobo');
        $projectedKobo = $usedKobo + $newAmountKobo;
        $budgetKobo = $costCentre->budget_kobo;

        // If no budget is set, allow unconditionally
        if ($budgetKobo <= 0) {
            return [
                'status' => 'allow',
                'percentage' => 0.0,
                'used_kobo' => $usedKobo,
                'projected_kobo' => $projectedKobo,
                'budget_kobo' => $budgetKobo,
            ];
        }

        $pct = ($projectedKobo / $budgetKobo) * 100.0;

        $status = match (true) {
            $pct >= 100.0 => 'block_100',
            $pct >= 90.0 => 'warn_90',
            $pct >= 80.0 => 'warn_80',
            default => 'allow',
        };

        return [
            'status' => $status,
            'percentage' => round($pct, 2),
            'used_kobo' => $usedKobo,
            'projected_kobo' => $projectedKobo,
            'budget_kobo' => $budgetKobo,
        ];
    }

    /**
     * Convenience: returns the budget percentage for a cost centre
     * (current committed spend only, not including a new request).
     */
    public static function currentPercentage(CostCentre $costCentre, ?int $periodId = null): float
    {
        $result = self::check($costCentre, 0, $periodId);
        // Compute from used alone
        if ($result['budget_kobo'] <= 0) {
            return 0.0;
        }

        return round(($result['used_kobo'] / $result['budget_kobo']) * 100.0, 2);
    }
}
