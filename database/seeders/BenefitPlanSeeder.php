<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BenefitPlanSeeder extends Seeder
{
    private const PLANS = [
        [
            'type'                       => 'hmo',
            'name'                       => 'Standard HMO',
            'provider'                   => 'Hygeia HMO',
            'description'                => 'Basic health maintenance organisation cover for employees.',
            'employee_contribution_type' => 'none',
            'employee_contribution_value'=> 0,
            'employer_contribution_type' => 'fixed',
            // ₦15,000/month employer contribution (kobo)
            'employer_contribution_value'=> 1_500_000,
            'is_waivable'                => false,
            'sort_order'                 => 10,
        ],
        [
            'type'                       => 'hmo',
            'name'                       => 'Family HMO',
            'provider'                   => 'Hygeia HMO',
            'description'                => 'Extended HMO cover including spouse and up to 4 children.',
            'employee_contribution_type' => 'fixed',
            // ₦5,000/month employee top-up (kobo)
            'employee_contribution_value'=> 500_000,
            'employer_contribution_type' => 'fixed',
            // ₦25,000/month employer contribution (kobo)
            'employer_contribution_value'=> 2_500_000,
            'is_waivable'                => true,
            'sort_order'                 => 20,
        ],
        [
            'type'                       => 'life_insurance',
            'name'                       => 'Group Life Insurance',
            'provider'                   => 'AXA Mansard',
            'description'                => 'PENCOM-mandated group life insurance — 3× annual basic salary benefit.',
            'employee_contribution_type' => 'none',
            'employee_contribution_value'=> 0,
            'employer_contribution_type' => 'percentage_of_basic',
            // 0.50% of basic salary per month (basis points: 50)
            'employer_contribution_value'=> 50,
            'is_waivable'                => false,
            'sort_order'                 => 30,
        ],
        [
            'type'                       => 'disability',
            'name'                       => 'Disability Insurance',
            'provider'                   => 'AXA Mansard',
            'description'                => 'Income protection cover for permanent disability.',
            'employee_contribution_type' => 'none',
            'employee_contribution_value'=> 0,
            'employer_contribution_type' => 'fixed',
            'employer_contribution_value'=> 200_000, // ₦2,000/month
            'is_waivable'                => true,
            'sort_order'                 => 40,
        ],
        [
            'type'                       => 'pension',
            'name'                       => 'Pension (PENCOM)',
            'provider'                   => 'Stanbic IBTC Pension',
            'description'                => 'Statutory PENCOM pension — 8% employee / 10% employer of pensionable pay. Managed via payroll.',
            'employee_contribution_type' => 'none', // handled by payroll engine
            'employee_contribution_value'=> 0,
            'employer_contribution_type' => 'none',
            'employer_contribution_value'=> 0,
            'is_waivable'                => false,
            'sort_order'                 => 50,
        ],
    ];

    public function run(): void
    {
        foreach (self::PLANS as $plan) {
            DB::table('benefit_plans')->upsert(
                array_merge($plan, [
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]),
                ['type', 'name'],
                ['provider', 'description', 'employee_contribution_type', 'employee_contribution_value',
                 'employer_contribution_type', 'employer_contribution_value', 'is_waivable', 'sort_order', 'updated_at']
            );
        }

        $this->command?->info('Benefit plans seeded (' . count(self::PLANS) . ' plans).');
    }
}
