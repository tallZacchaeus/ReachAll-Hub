<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use App\Models\PublicHoliday;
use Illuminate\Database\Seeder;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        // ----------------------------------------------------------------
        // Leave types
        // ----------------------------------------------------------------
        $leaveTypes = [
            // [name, code, days_per_year, accrual_policy, carry_over_days, max_carry_over_days, requires_documentation]
            ['Annual Leave',    'ANNUAL',    20, 'annual',  5,  10, false],
            ['Sick Leave',      'SICK',      10, 'annual',  0,   0, true],
            ['Personal Leave',  'PERSONAL',   5, 'annual',  0,   0, false],
            ['Maternity Leave', 'MATERNITY', 90, 'none',    0,   0, true],
            ['Paternity Leave', 'PATERNITY',  5, 'none',    0,   0, false],
        ];

        foreach ($leaveTypes as [$name, $code, $daysPerYear, $accrualPolicy, $carryOverDays, $maxCarryOverDays, $requiresDocumentation]) {
            LeaveType::firstOrCreate(
                ['code' => $code],
                [
                    'name'                   => $name,
                    'days_per_year'          => $daysPerYear,
                    'accrual_policy'         => $accrualPolicy,
                    'carry_over_days'        => $carryOverDays,
                    'max_carry_over_days'    => $maxCarryOverDays,
                    'requires_documentation' => $requiresDocumentation,
                    'is_active'              => true,
                ]
            );
        }

        // ----------------------------------------------------------------
        // 2026 Nigerian public holidays
        // ----------------------------------------------------------------
        $holidays = [
            ["New Year's Day",      '2026-01-01'],
            ['Good Friday',         '2026-04-03'],
            ['Easter Monday',       '2026-04-06'],
            ["Workers' Day",        '2026-05-01'],
            ['Eid el-Fitr',         '2026-03-31'],
            ['Eid el-Fitr Holiday', '2026-04-01'],
            ['Democracy Day',       '2026-06-12'],
            ['Eid el-Kabir',        '2026-06-06'],
            ['Eid el-Kabir Holiday','2026-06-07'],
            ['Independence Day',    '2026-10-01'],
            ['Eid el-Mawlid',       '2026-09-04'],
            ['Christmas Day',       '2026-12-25'],
            ['Boxing Day',          '2026-12-26'],
        ];

        foreach ($holidays as [$name, $date]) {
            PublicHoliday::firstOrCreate(
                ['date' => $date, 'country_code' => 'NG'],
                [
                    'name'         => $name,
                    'is_recurring' => false, // these are year-specific
                    'is_active'    => true,
                ]
            );
        }
    }
}
