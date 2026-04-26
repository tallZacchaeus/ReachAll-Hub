<?php

namespace App\Services\Finance;

use App\Models\Finance\FinancialPeriod;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * ClosedPeriodGuard — prevents writes to transactions dated in a closed period.
 *
 * Usage:
 *   ClosedPeriodGuard::assertWriteable($date, $user);
 *   // throws \Illuminate\Http\Exceptions\HttpResponseException (422) if blocked
 *
 * CEO/Superadmin bypass:
 *   Pass $override = true (they confirmed the override in the UI).
 */
class ClosedPeriodGuard
{
    /**
     * Abort with 422 if $date falls in a closed period and the user
     * is not CEO/Superadmin providing an explicit override.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    public static function assertWriteable(
        \DateTimeInterface|string $date,
        User $user,
        bool $ceoOverride = false
    ): void {
        $d = $date instanceof \DateTimeInterface
            ? CarbonImmutable::instance($date)
            : CarbonImmutable::parse($date);

        $period = FinancialPeriod::where('year', $d->year)
            ->where('month', $d->month)
            ->first();

        if (! $period || ! $period->isClosed()) {
            return; // period open or doesn't exist → allow
        }

        // Finance executives with explicit override flag may proceed.
        if ($ceoOverride && $user->hasPermission('finance.exec')) {
            return;
        }

        abort(422, "The financial period {$period->getLabel()} is closed. No new transactions can be recorded in a closed period.");
    }

    /**
     * Returns true when the date falls in a closed period.
     */
    public static function isClosed(\DateTimeInterface|string $date): bool
    {
        $d = $date instanceof \DateTimeInterface
            ? CarbonImmutable::instance($date)
            : CarbonImmutable::parse($date);

        $period = FinancialPeriod::where('year', $d->year)
            ->where('month', $d->month)
            ->first();

        return $period?->isClosed() ?? false;
    }
}
