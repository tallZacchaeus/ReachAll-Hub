<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\JobLevel;
use App\Models\JobPosition;
use App\Models\OfficeLocation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrgStructureSeeder extends Seeder
{
    // ── Standard job levels ────────────────────────────────────────────────

    private const LEVELS = [
        ['code' => 'IC1',  'name' => 'Junior',          'sort_order' => 10],
        ['code' => 'IC2',  'name' => 'Mid-Level',        'sort_order' => 20],
        ['code' => 'IC3',  'name' => 'Senior',           'sort_order' => 30],
        ['code' => 'IC4',  'name' => 'Lead',             'sort_order' => 40],
        ['code' => 'M1',   'name' => 'Manager',          'sort_order' => 50],
        ['code' => 'M2',   'name' => 'Senior Manager',   'sort_order' => 60],
        ['code' => 'DIR',  'name' => 'Director',         'sort_order' => 70],
        ['code' => 'VP',   'name' => 'Vice President',   'sort_order' => 80],
        ['code' => 'C',    'name' => 'C-Suite / Executive', 'sort_order' => 90],
    ];

    // ── Default office locations ───────────────────────────────────────────

    private const LOCATIONS = [
        ['code' => 'HQ',    'name' => 'Head Office',   'city' => 'Lagos',   'state' => 'Lagos',  'country' => 'Nigeria'],
        ['code' => 'ABUJA', 'name' => 'Abuja Office',  'city' => 'Abuja',   'state' => 'FCT',    'country' => 'Nigeria'],
        ['code' => 'REMOTE', 'name' => 'Remote',        'city' => null,      'state' => null,     'country' => 'Nigeria'],
    ];

    public function run(): void
    {
        // 1. Seed job levels
        foreach (self::LEVELS as $level) {
            JobLevel::upsert(
                [$level + ['created_at' => now(), 'updated_at' => now()]],
                ['code'],
                ['name', 'sort_order']
            );
        }

        // 2. Seed default office locations
        foreach (self::LOCATIONS as $loc) {
            OfficeLocation::upsert(
                [$loc + ['is_active' => true, 'created_at' => now(), 'updated_at' => now()]],
                ['code'],
                ['name', 'city', 'state', 'country']
            );
        }

        // 3. Derive departments from existing users.department string values
        $existingDepts = DB::table('users')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->pluck('department')
            ->unique()
            ->values();

        foreach ($existingDepts as $deptName) {
            $code = strtoupper(Str::slug($deptName, '_'));
            $code = substr($code, 0, 20);

            $dept = Department::firstOrCreate(
                ['code' => $code],
                ['name' => $deptName, 'is_active' => true]
            );

            // Backfill department_id on users with matching string
            DB::table('users')
                ->where('department', $deptName)
                ->whereNull('department_id')
                ->update(['department_id' => $dept->id]);
        }

        // 4. Derive job positions from existing users.position string values
        $existingPositions = DB::table('users')
            ->whereNotNull('position')
            ->where('position', '!=', '')
            ->pluck('position')
            ->unique()
            ->values();

        foreach ($existingPositions as $posTitle) {
            $code = strtoupper(Str::slug($posTitle, '_'));
            $code = substr($code, 0, 30);

            $pos = JobPosition::firstOrCreate(
                ['code' => $code],
                ['title' => $posTitle, 'is_active' => true]
            );

            // Backfill job_position_id on users with matching string
            DB::table('users')
                ->where('position', $posTitle)
                ->whereNull('job_position_id')
                ->update(['job_position_id' => $pos->id]);
        }

        $this->command?->info('Org structure seeded and user FKs backfilled successfully.');
    }
}
