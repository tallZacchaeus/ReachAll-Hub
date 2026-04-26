<?php

namespace App\Services;

use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\PublicHoliday;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class LeaveService
{
    /**
     * Count working days between two dates (inclusive), excluding weekends
     * and active Nigerian public holidays. Public holiday list is cached for 5 minutes
     * to avoid N+1 lookups when processing multiple requests in one request cycle.
     */
    public static function workingDaysBetween(Carbon $start, Carbon $end): float
    {
        $holidayDates = self::getHolidayDates();

        $workingDays = 0;
        $current = $start->copy()->startOfDay();
        $finish  = $end->copy()->startOfDay();

        while ($current->lte($finish)) {
            // Skip weekends
            if (! $current->isWeekend()) {
                $dateKey = $current->format('Y-m-d');
                if (! $holidayDates->contains($dateKey)) {
                    $workingDays++;
                }
            }
            $current->addDay();
        }

        return (float) $workingDays;
    }

    /**
     * Get or create a LeaveBalance record for a given user / type / year.
     * Entitled days are seeded from the leave type's days_per_year on first creation.
     */
    public static function getOrCreateBalance(User $user, LeaveType $leaveType, int $year): LeaveBalance
    {
        return LeaveBalance::firstOrCreate(
            [
                'user_id'       => $user->id,
                'leave_type_id' => $leaveType->id,
                'year'          => $year,
            ],
            [
                'entitled_days'     => $leaveType->days_per_year,
                'used_days'         => 0,
                'carried_over_days' => 0,
            ]
        );
    }

    /**
     * Deduct the working days of an approved leave request from the employee's balance.
     * Only acts when the request has a leave_type_id set (new-style requests).
     */
    public static function deductBalance(LeaveRequest $request): void
    {
        if ($request->leave_type_id === null) {
            return;
        }

        /** @var LeaveType $leaveType */
        $leaveType = $request->leaveType;
        if ($leaveType === null) {
            return;
        }

        $year = $request->start_date
            ? $request->start_date->year
            : now()->year;

        $user = $request->user;
        if ($user === null) {
            return;
        }

        $days = $request->working_days ?? $request->days ?? 0;

        $balance = self::getOrCreateBalance($user, $leaveType, $year);
        $balance->increment('used_days', $days);
    }

    /**
     * Restore days to balance when a previously-approved request is rejected or cancelled.
     * Only acts when the request has a leave_type_id set.
     */
    public static function restoreBalance(LeaveRequest $request): void
    {
        if ($request->leave_type_id === null) {
            return;
        }

        /** @var LeaveType $leaveType */
        $leaveType = $request->leaveType;
        if ($leaveType === null) {
            return;
        }

        $year = $request->start_date
            ? $request->start_date->year
            : now()->year;

        $user = $request->user;
        if ($user === null) {
            return;
        }

        $days = $request->working_days ?? $request->days ?? 0;

        $balance = self::getOrCreateBalance($user, $leaveType, $year);
        // Never let used_days go below 0
        $newUsed = max(0.0, (float) $balance->used_days - (float) $days);
        $balance->update(['used_days' => $newUsed]);
    }

    /**
     * Return a cached Collection of holiday date strings (Y-m-d) for NG.
     * Cache TTL: 5 minutes — cheap re-hydration but avoids per-day N+1 queries.
     */
    private static function getHolidayDates(): Collection
    {
        return Cache::remember('public_holidays_ng', 300, function (): Collection {
            return PublicHoliday::active()
                ->where('country_code', 'NG')
                ->pluck('date')
                ->map(fn ($date) => $date instanceof Carbon
                    ? $date->format('Y-m-d')
                    : (string) $date
                );
        });
    }
}
