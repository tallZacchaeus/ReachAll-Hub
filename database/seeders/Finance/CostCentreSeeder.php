<?php

namespace Database\Seeders\Finance;

use App\Models\Finance\CostCentre;
use App\Models\User;
use Illuminate\Database\Seeder;

class CostCentreSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'superadmin')->first();
        $createdBy = $admin?->id;

        /*
         * Hierarchy from FINANCE_CLAUDE.md:
         * 1000 Operations
         *   1100 Media Production
         *     1110 RTVM
         *     1120 Dove TV
         *   1200 IT & Digital
         * 2000 Programs
         *   2100 Outreach & Missions
         *   2200 Training & Academy
         *   2300 Events
         * 3000 Administration
         *   3100 HR
         *   3200 Finance
         *   3300 Facilities
         */
        $tree = [
            // Root level
            ['code' => '1000', 'name' => 'Operations',            'parent' => null,   'budget_kobo' => 50_000_000_00],
            ['code' => '2000', 'name' => 'Programs',              'parent' => null,   'budget_kobo' => 40_000_000_00],
            ['code' => '3000', 'name' => 'Administration',        'parent' => null,   'budget_kobo' => 20_000_000_00],

            // Operations children
            ['code' => '1100', 'name' => 'Media Production',      'parent' => '1000', 'budget_kobo' => 20_000_000_00],
            ['code' => '1200', 'name' => 'IT & Digital',          'parent' => '1000', 'budget_kobo' => 15_000_000_00],

            // Media Production grandchildren
            ['code' => '1110', 'name' => 'RTVM',                  'parent' => '1100', 'budget_kobo' => 10_000_000_00],
            ['code' => '1120', 'name' => 'Dove TV',               'parent' => '1100', 'budget_kobo' => 10_000_000_00],

            // Programs children
            ['code' => '2100', 'name' => 'Outreach & Missions',   'parent' => '2000', 'budget_kobo' => 15_000_000_00],
            ['code' => '2200', 'name' => 'Training & Academy',    'parent' => '2000', 'budget_kobo' => 12_000_000_00],
            ['code' => '2300', 'name' => 'Events',                'parent' => '2000', 'budget_kobo' => 8_000_000_00],

            // Administration children
            ['code' => '3100', 'name' => 'HR',                    'parent' => '3000', 'budget_kobo' => 6_000_000_00],
            ['code' => '3200', 'name' => 'Finance',               'parent' => '3000', 'budget_kobo' => 5_000_000_00],
            ['code' => '3300', 'name' => 'Facilities',            'parent' => '3000', 'budget_kobo' => 8_000_000_00],
        ];

        // First pass: create all nodes (no parent constraint yet)
        $codeToId = [];
        foreach ($tree as $row) {
            $cc = CostCentre::firstOrCreate(
                ['code' => $row['code']],
                [
                    'name' => $row['name'],
                    'parent_id' => null,
                    'budget_kobo' => $row['budget_kobo'],
                    'status' => 'active',
                    'created_by' => $createdBy,
                ]
            );
            $codeToId[$row['code']] = $cc->id;
        }

        // Second pass: wire up parent_id
        foreach ($tree as $row) {
            if ($row['parent'] !== null) {
                CostCentre::where('code', $row['code'])->update([
                    'parent_id' => $codeToId[$row['parent']],
                ]);
            }
        }
    }
}
