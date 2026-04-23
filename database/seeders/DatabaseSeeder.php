<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $staff = [
            // Super Admin
            [
                'employee_id' => 'EMP001',
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'department' => 'Project Management',
                'position' => 'Project Manager',
                'role' => 'superadmin',
                'status' => 'active',
                'employee_stage' => 'leader',
            ],
            // HR
            [
                'employee_id' => 'EMP002',
                'name' => 'HR Manager',
                'email' => 'hr@example.com',
                'department' => 'Project Management',
                'position' => 'Programs Coordinator',
                'role' => 'hr',
                'status' => 'active',
                'employee_stage' => 'leader',
            ],
            // Management
            [
                'employee_id' => 'EMP003',
                'name' => 'Team Lead',
                'email' => 'management@example.com',
                'department' => 'Product Team',
                'position' => 'Product Manager',
                'role' => 'management',
                'status' => 'active',
                'employee_stage' => 'leader',
            ],
            // Performers
            [
                'employee_id' => 'EMP004',
                'name' => 'Jane Doe',
                'email' => 'jane.doe@example.com',
                'department' => 'Video & Production',
                'position' => 'Video Editor',
                'role' => 'staff',
                'status' => 'active',
                'employee_stage' => 'performer',
            ],
            [
                'employee_id' => 'EMP005',
                'name' => 'Mark Hassan',
                'email' => 'mark.hassan@example.com',
                'department' => 'Graphics Design',
                'position' => 'Graphic Designer',
                'role' => 'staff',
                'status' => 'active',
                'employee_stage' => 'performer',
            ],
            [
                'employee_id' => 'EMP006',
                'name' => 'Aisha Bello',
                'email' => 'aisha.bello@example.com',
                'department' => 'Content & Brand Comms',
                'position' => 'Content Writer',
                'role' => 'staff',
                'status' => 'active',
                'employee_stage' => 'performer',
            ],
            // Joiners
            [
                'employee_id' => 'EMP007',
                'name' => 'Tunde Okafor',
                'email' => 'tunde.okafor@example.com',
                'department' => 'Interns',
                'position' => 'Intern',
                'role' => 'staff',
                'status' => 'active',
                'employee_stage' => 'joiner',
            ],
            [
                'employee_id' => 'EMP008',
                'name' => 'Ngozi Adeyemi',
                'email' => 'ngozi.adeyemi@example.com',
                'department' => 'Business Development',
                'position' => 'Business Developer',
                'role' => 'staff',
                'status' => 'active',
                'employee_stage' => 'joiner',
            ],
        ];

        foreach ($staff as $member) {
            User::firstOrCreate(
                ['email' => $member['email']],
                array_merge($member, [
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ])
            );
        }

        // Also keep the default test user
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'employee_id' => 'EMP099',
                'name' => 'Test User',
                'email' => 'test@example.com',
                'department' => 'Product Team',
                'position' => 'Product Manager',
                'role' => 'staff',
                'status' => 'active',
                'employee_stage' => 'performer',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(OrgStructureSeeder::class);
        $this->call(DocumentCategorySeeder::class);
        $this->call(BenefitPlanSeeder::class);
        $this->call(ContentSeeder::class);
        $this->call(FaqSeeder::class);
        $this->call(MasterSeeder::class);

        // Finance module seeders (order matters: periods/codes/vendors before audit logs)
        $this->call(\Database\Seeders\Finance\FinancialPeriodSeeder::class);
        $this->call(\Database\Seeders\Finance\AccountCodeSeeder::class);
        $this->call(\Database\Seeders\Finance\VendorSeeder::class);
        $this->call(\Database\Seeders\Finance\CostCentreSeeder::class);
        $this->call(\Database\Seeders\Finance\PettyCashFloatSeeder::class);
        // Demo transactions (Phase 5) — run last so reference data exists
        $this->call(\Database\Seeders\Finance\FinanceTransactionSeeder::class);
    }
}
