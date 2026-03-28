<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_view_reports_with_real_data(): void
    {
        $manager = User::factory()->create([
            'employee_id' => 'EMP001',
            'department' => 'People Operations',
            'role' => 'management',
        ]);

        $staff = User::factory()->create([
            'employee_id' => 'EMP101',
            'name' => 'Janet Cole',
            'department' => 'Engineering',
            'role' => 'staff',
            'status' => 'active',
        ]);

        Task::create([
            'title' => 'Compile review calibration notes',
            'assigned_to_user_id' => $staff->id,
            'assigned_by_user_id' => $manager->id,
            'priority' => 'high',
            'due_date' => now()->addDays(5)->toDateString(),
            'status' => 'in-progress',
            'progress' => 40,
            'department' => 'Engineering',
            'project' => 'Calibration',
            'subtasks' => [],
            'tags' => [],
            'attachments' => [],
        ]);

        $this->actingAs($manager)
            ->get(route('reports'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ReportsPage')
                ->where('reportPeriod', 'current')
                ->where('reportType', 'comprehensive')
                ->has('reportData.summaryCards', 4)
                ->has('reportData.taskTrend', 6)
                ->has('reportData.departmentData')
                ->has('reportData.statusDistribution', 4)
                ->has('reportData.priorityDistribution', 3)
                ->has('reportData.departmentWorkload')
            );
    }

    public function test_reports_csv_export_streams_real_task_sections(): void
    {
        $manager = User::factory()->create([
            'employee_id' => 'EMP001',
            'department' => 'People Operations',
            'role' => 'management',
        ]);

        $staff = User::factory()->create([
            'employee_id' => 'EMP202',
            'name' => 'Samuel Bright',
            'department' => 'Operations',
            'role' => 'staff',
            'status' => 'active',
        ]);

        Task::create([
            'title' => 'Prepare report export validation',
            'assigned_to_user_id' => $staff->id,
            'assigned_by_user_id' => $manager->id,
            'priority' => 'medium',
            'due_date' => now()->addWeek()->toDateString(),
            'status' => 'completed',
            'progress' => 100,
            'department' => 'Operations',
            'project' => 'Reporting',
            'subtasks' => [],
            'tags' => [],
            'attachments' => [],
        ]);

        $response = $this->actingAs($manager)
            ->get(route('reports.export-csv', [
                'period' => 'all',
                'type' => 'comprehensive',
            ]));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type', ''));

        $content = $response->streamedContent();

        $this->assertStringContainsString('Task Trend', $content);
        $this->assertStringContainsString('Top Performers', $content);
        $this->assertStringContainsString('Samuel Bright', $content);
        $this->assertStringContainsString('Operations', $content);
    }

    public function test_report_type_filter_is_preserved_for_staff_mode(): void
    {
        $manager = User::factory()->create([
            'employee_id' => 'EMP303',
            'department' => 'People Operations',
            'role' => 'management',
        ]);

        $this->actingAs($manager)
            ->get(route('reports', [
                'period' => 'all',
                'type' => 'staff',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ReportsPage')
                ->where('reportPeriod', 'all')
                ->where('reportType', 'staff')
            );
    }
}
