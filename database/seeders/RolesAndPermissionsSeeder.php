<?php

namespace Database\Seeders;

use App\Services\PermissionService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesAndPermissionsSeeder extends Seeder
{
    // ── Permission registry ────────────────────────────────────────────────
    // Format: 'name' => ['label', 'module', 'description']

    private const PERMISSIONS = [
        // Core / HR
        'admin.dashboard'        => ['Admin Dashboard',            'core',    'Access the admin dashboard and KPIs'],
        'staff.enroll'           => ['Enroll Staff',               'hr',      'Create, edit, and deactivate staff accounts'],
        'staff.overview'         => ['Staff Overview',             'hr',      'View all staff listing and profiles'],
        'attendance.upload'      => ['Upload Attendance',          'hr',      'Bulk-upload attendance records'],
        'attendance.view-all'    => ['View All Attendance',        'hr',      'View attendance records for any staff member'],
        'leave.review'           => ['Review Leave Requests',      'hr',      'Approve or reject leave requests'],
        'requests.review'        => ['Review Resource Requests',   'hr',      'Approve or reject resource/budget requests'],
        'tasks.manage'           => ['Manage Tasks',               'core',    'Create, assign, and delete any task'],
        'chat.admin'             => ['Chat Administration',        'core',    'Create channels and post to read-only channels'],
        'profile.review'         => ['Review Profile Changes',     'hr',      'Approve or reject staff profile change requests'],
        'content.manage'         => ['Manage Content',             'core',    'Create and edit bulletins, newsletters, FAQs, and content pages'],
        'okr.manage'             => ['Manage OKRs',                'core',    'Create and manage OKRs for any staff member'],
        'jobs.manage'            => ['Manage Job Postings',        'hr',      'Create and manage job postings and recruitment'],
        'learning.manage'        => ['Manage Learning',            'hr',      'Create and manage courses and learning content'],
        'checklist.manage'       => ['Manage Checklists',          'hr',      'Create and manage onboarding checklist templates'],
        'reports.view'           => ['View Reports',               'core',    'View reports and analytics dashboards'],
        'recognition.admin'      => ['Recognition Administration', 'hr',      'Manage recognition awards, nominations, and results'],
        'evaluations.admin'      => ['Evaluations Administration', 'hr',      'Manage performance evaluations and review cycles'],
        'announcements.manage'   => ['Manage Announcements',       'core',    'Post company-wide announcements'],
        'team.dashboard'         => ['Team Dashboard',             'core',    'Access the team dashboard for direct reports'],
        'roles.manage'           => ['Manage Roles & Permissions', 'core',    'Create, edit, and delete roles and assign permissions'],
        'org.manage'             => ['Manage Org Structure',       'hr',      'Create and edit departments, job positions, and office locations'],
        // HR Document Vault
        'documents.manage'       => ['Manage HR Documents',         'hr',      'Upload, version, and manage HR documents for any employee'],
        'documents.sign'         => ['Sign Documents',              'hr',      'Electronically sign or decline HR documents assigned to the employee'],
        // Payroll
        'payroll.manage'         => ['Manage Payroll',              'payroll',   'Create, approve, and manage payroll runs'],
        'payroll.view'           => ['View Payroll',                'payroll',   'View payroll runs and entries (read-only)'],
        'payroll.my-payslips'    => ['View Own Payslips',           'payroll',   'View and download own payslips'],
        // Benefits
        'benefits.manage'        => ['Manage Benefits',             'benefits',      'Create benefit plans, manage enrollments, and process open enrollment elections'],
        'benefits.self-enroll'   => ['Self-Service Benefits',       'benefits',      'View own benefits, manage dependents, and submit enrollment elections'],
        // Compensation
        'compensation.manage'    => ['Manage Compensation',         'compensation',  'Create salary bands, manage review cycles, and approve merit and bonus awards'],
        'compensation.view'      => ['View Compensation',           'compensation',  'Read-only access to salary bands, review cycles, and bonus plans'],
        'compensation.self'      => ['View Own Total Rewards',      'compensation',  'View own compensation details and total rewards statement'],
        // Recruitment / ATS
        'recruitment.manage'     => ['Manage Recruitment',          'recruitment',   'Create job requisitions, manage candidates, pipeline, and extend offers'],
        'recruitment.view'       => ['View Recruitment',            'recruitment',   'Read-only access to requisitions, candidate pipeline, and interview data'],
        'recruitment.interview'  => ['Conduct Interviews',          'recruitment',   'View assigned interviews and submit scorecards'],
        // Employee Relations / Case Management
        'er.manage'              => ['Manage ER Cases',             'er',            'Create, assign, and resolve all HR cases including confidential ones'],
        'er.investigate'         => ['Investigate Cases',           'er',            'View assigned investigation cases and add notes'],
        'er.self'                => ['Submit & Track Own Cases',    'er',            'Submit helpdesk tickets and grievances and view own case status'],
        // Compliance
        'compliance.manage'      => ['Manage Compliance',           'compliance',    'Manage compliance documents, DSRs, trainings, and policies'],
        'compliance.self'        => ['My Compliance',               'compliance',    'View own compliance records, acknowledge policies, complete trainings, and submit DSRs'],
        // Finance
        'finance.access'         => ['Finance Access',             'finance', 'Access the finance module and submit requisitions'],
        'finance.admin'          => ['Finance Administration',     'finance', 'Validate payments, manage matching, run reconciliations'],
        'finance.exec'           => ['Finance Executive',          'finance', 'Co-authorise period close and budget overrides'],
        'finance.reports'        => ['Finance Reports',            'finance', 'View and export finance reports'],
        'finance.period-close'   => ['Finance Period Close',       'finance', 'Initiate and manage accounting period close'],
        'finance.go-live'        => ['Finance Go-Live',            'finance', 'Access the finance go-live checklist (superadmin only)'],
    ];

    // ── Role registry ──────────────────────────────────────────────────────

    private const ROLES = [
        'staff' => [
            'label'       => 'Staff',
            'description' => 'Standard employee with access to own data only.',
            'is_system'   => true,
            'permissions' => [
                'finance.access',
                'documents.sign',
                'payroll.my-payslips',
                'benefits.self-enroll',
                'compensation.self',
                'er.self',
                'compliance.self',
            ],
        ],
        'management' => [
            'label'       => 'Management',
            'description' => 'Team leads and department managers with broad read/approve access.',
            'is_system'   => true,
            'permissions' => [
                'admin.dashboard', 'staff.overview', 'attendance.view-all',
                'leave.review', 'requests.review', 'tasks.manage',
                'chat.admin', 'content.manage', 'okr.manage',
                'learning.manage', 'checklist.manage', 'reports.view',
                'recognition.admin', 'evaluations.admin', 'announcements.manage',
                'team.dashboard',
                'documents.sign',
                'payroll.my-payslips',
                'benefits.self-enroll',
                'compensation.view', 'compensation.self',
                'recruitment.view', 'recruitment.interview',
                'er.investigate', 'er.self',
                'compliance.self',
                'finance.access', 'finance.reports',
            ],
        ],
        'hr' => [
            'label'       => 'Human Resources',
            'description' => 'HR team with full staff lifecycle access and enrollment capabilities.',
            'is_system'   => true,
            'permissions' => [
                'admin.dashboard', 'staff.enroll', 'staff.overview',
                'attendance.upload', 'attendance.view-all',
                'leave.review', 'requests.review', 'tasks.manage',
                'chat.admin', 'profile.review', 'content.manage',
                'okr.manage', 'jobs.manage', 'learning.manage',
                'checklist.manage', 'reports.view', 'recognition.admin',
                'evaluations.admin', 'announcements.manage', 'team.dashboard',
                'org.manage',
                'documents.manage', 'documents.sign',
                'payroll.manage', 'payroll.my-payslips',
                'benefits.manage', 'benefits.self-enroll',
                'compensation.manage', 'compensation.self',
                'recruitment.manage', 'recruitment.interview',
                'er.manage', 'er.investigate', 'er.self',
                'compliance.manage', 'compliance.self',
                'finance.access', 'finance.reports',
            ],
        ],
        'finance' => [
            'label'       => 'Finance',
            'description' => 'Finance team with full access to the finance module.',
            'is_system'   => true,
            'permissions' => [
                'finance.access', 'finance.admin',
                'finance.reports', 'finance.period-close',
                'payroll.manage', 'payroll.view', 'payroll.my-payslips',
                'compensation.view', 'compensation.self',
                'recruitment.interview',
                'compliance.self',
            ],
        ],
        'general_management' => [
            'label'       => 'General Management',
            'description' => 'Senior leadership with executive finance and reporting access.',
            'is_system'   => true,
            'permissions' => [
                'admin.dashboard', 'staff.overview', 'reports.view', 'team.dashboard',
                'finance.access', 'finance.admin', 'finance.exec',
                'finance.reports', 'finance.period-close',
                'compensation.view', 'compensation.self',
                'recruitment.view',
                'compliance.self',
            ],
        ],
        'ceo' => [
            'label'       => 'CEO',
            'description' => 'Chief executive with full finance and executive-level access.',
            'is_system'   => true,
            'permissions' => [
                'admin.dashboard', 'staff.overview', 'reports.view', 'team.dashboard',
                'finance.access', 'finance.admin', 'finance.exec',
                'finance.reports', 'finance.period-close',
                'compensation.view', 'compensation.self',
                'recruitment.view',
                'compliance.manage', 'compliance.self',
            ],
        ],
        'superadmin' => [
            'label'       => 'Super Administrator',
            'description' => 'Unrestricted access to all features. Cannot be deleted.',
            'is_system'   => true,
            // Superadmin bypasses all checks — permission rows are informational only.
            'permissions' => [
                'admin.dashboard', 'staff.enroll', 'staff.overview',
                'attendance.upload', 'attendance.view-all',
                'leave.review', 'requests.review', 'tasks.manage',
                'chat.admin', 'profile.review', 'content.manage',
                'okr.manage', 'jobs.manage', 'learning.manage',
                'checklist.manage', 'reports.view', 'recognition.admin',
                'evaluations.admin', 'announcements.manage', 'team.dashboard',
                'roles.manage', 'org.manage',
                'documents.manage', 'documents.sign',
                'payroll.manage', 'payroll.view', 'payroll.my-payslips',
                'benefits.manage', 'benefits.self-enroll',
                'compensation.manage', 'compensation.view', 'compensation.self',
                'recruitment.manage', 'recruitment.view', 'recruitment.interview',
                'er.manage', 'er.investigate', 'er.self',
                'compliance.manage', 'compliance.self',
                'finance.access', 'finance.admin', 'finance.exec',
                'finance.reports', 'finance.period-close', 'finance.go-live',
            ],
        ],
    ];

    public function run(): void
    {
        // 1. Upsert permissions
        foreach (self::PERMISSIONS as $name => [$label, $module, $description]) {
            DB::table('permissions')->upsert(
                ['name' => $name, 'label' => $label, 'module' => $module, 'description' => $description],
                ['name'],
                ['label', 'module', 'description']
            );
        }

        // 2. Build permission name → id map
        $permissionIds = DB::table('permissions')
            ->whereIn('name', array_keys(self::PERMISSIONS))
            ->pluck('id', 'name')
            ->all();

        // 3. Upsert roles and assign permissions
        foreach (self::ROLES as $roleName => $config) {
            DB::table('roles')->upsert(
                [
                    'name'        => $roleName,
                    'label'       => $config['label'],
                    'description' => $config['description'],
                    'is_system'   => $config['is_system'] ? 1 : 0,
                ],
                ['name'],
                ['label', 'description', 'is_system']
            );

            // 4. Assign permissions: delete stale, insert new
            $permIds = array_map(
                fn (string $p) => $permissionIds[$p] ?? null,
                $config['permissions']
            );
            $permIds = array_filter($permIds);

            DB::table('role_permissions')->where('role', $roleName)->delete();

            $inserts = [];
            foreach ($permIds as $pid) {
                $inserts[] = [
                    'role'          => $roleName,
                    'permission_id' => $pid,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ];
            }
            if ($inserts) {
                DB::table('role_permissions')->insert($inserts);
            }
        }

        PermissionService::clearCache();

        $this->command?->info('Roles and permissions seeded successfully.');
    }
}
