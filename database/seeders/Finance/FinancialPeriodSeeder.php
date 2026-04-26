<?php

namespace Database\Seeders\Finance;

use App\Models\Finance\FinancialPeriod;
use Illuminate\Database\Seeder;

class FinancialPeriodSeeder extends Seeder
{
    public function run(): void
    {
        $year = now()->year;

        // Seed all 12 months of current year
        for ($month = 1; $month <= 12; $month++) {
            $currentMonth = now()->month;

            // Past months are closed; current month is open; future months are open (not yet started)
            if ($month < $currentMonth) {
                $status = 'closed';
                $closedAt = now()->setMonth($month)->endOfMonth();
            } else {
                $status = 'open';
                $closedAt = null;
            }

            FinancialPeriod::firstOrCreate(
                ['year' => $year, 'month' => $month],
                [
                    'status' => $status,
                    'opened_at' => now()->setMonth($month)->startOfMonth(),
                    'closed_at' => $closedAt,
                    'closed_by' => null,
                ]
            );
        }
    }
}
