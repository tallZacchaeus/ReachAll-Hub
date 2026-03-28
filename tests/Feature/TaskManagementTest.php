<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TaskManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_tasks(): void
    {
        $this->get(route('tasks'))
            ->assertRedirect(route('login'));
    }

    public function test_management_users_can_view_tasks_page(): void
    {
        $manager = User::factory()->create([
            'employee_id' => 'EMP001',
            'role' => 'management',
        ]);

        $assignee = User::factory()->create([
            'employee_id' => 'EMP100',
            'name' => 'Alex Stone',
            'department' => 'Engineering',
            'role' => 'staff',
        ]);

        Task::create([
            'title' => 'Prepare onboarding checklist',
            'assigned_to_user_id' => $assignee->id,
            'assigned_by_user_id' => $manager->id,
            'priority' => 'medium',
            'due_date' => '2026-04-10',
            'status' => 'todo',
            'progress' => 0,
            'department' => 'Engineering',
            'project' => 'Onboarding',
            'subtasks' => [],
            'tags' => [],
            'attachments' => [],
        ]);

        $this->actingAs($manager)
            ->get(route('tasks'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('TasksPage')
                ->has('tasks', 1)
                ->has('staffOptions')
                ->has('departments')
                ->has('projects')
                ->where('currentUserEmployeeId', 'EMP001')
            );
    }

    public function test_staff_users_only_see_their_accessible_tasks(): void
    {
        $manager = User::factory()->create([
            'employee_id' => 'EMP001',
            'role' => 'management',
        ]);

        $staff = User::factory()->create([
            'employee_id' => 'EMP200',
            'role' => 'staff',
        ]);

        $otherStaff = User::factory()->create([
            'employee_id' => 'EMP201',
            'role' => 'staff',
        ]);

        $visibleTask = Task::create([
            'title' => 'Complete evaluation form',
            'assigned_to_user_id' => $staff->id,
            'assigned_by_user_id' => $manager->id,
            'priority' => 'high',
            'due_date' => '2026-04-12',
            'status' => 'todo',
            'progress' => 0,
            'department' => 'Human Resources',
            'project' => 'Q2 Reviews',
            'subtasks' => [],
            'tags' => [],
            'attachments' => [],
        ]);

        Task::create([
            'title' => 'Private admin task',
            'assigned_to_user_id' => $otherStaff->id,
            'assigned_by_user_id' => $manager->id,
            'priority' => 'low',
            'due_date' => '2026-04-15',
            'status' => 'todo',
            'progress' => 0,
            'department' => 'Operations',
            'project' => 'Internal',
            'subtasks' => [],
            'tags' => [],
            'attachments' => [],
        ]);

        $this->actingAs($staff)
            ->get(route('tasks'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('TasksPage')
                ->has('tasks', 1)
                ->where('tasks.0.id', (string) $visibleTask->id)
                ->where('staffOptions.0.employeeId', 'EMP200')
            );
    }

    public function test_management_users_can_create_tasks_for_other_staff(): void
    {
        $manager = User::factory()->create([
            'employee_id' => 'EMP001',
            'role' => 'management',
        ]);

        $assignee = User::factory()->create([
            'employee_id' => 'EMP300',
            'department' => 'Engineering',
            'role' => 'staff',
        ]);

        $this->actingAs($manager)
            ->from(route('tasks'))
            ->post(route('tasks.store'), [
                'title' => 'Review technical competency matrix',
                'assignedTo' => 'EMP300',
                'priority' => 'high',
                'dueDate' => '2026-04-20',
                'description' => 'Validate role expectations before publishing.',
                'department' => 'Engineering',
                'project' => 'Evaluation Rollout',
            ])
            ->assertRedirect(route('tasks'));

        $this->assertDatabaseHas('tasks', [
            'title' => 'Review technical competency matrix',
            'assigned_to_user_id' => $assignee->id,
            'assigned_by_user_id' => $manager->id,
            'priority' => 'high',
            'status' => 'todo',
            'project' => 'Evaluation Rollout',
        ]);
    }

    public function test_assigned_staff_can_update_status_and_add_comments(): void
    {
        $manager = User::factory()->create([
            'employee_id' => 'EMP001',
            'role' => 'management',
        ]);

        $assignee = User::factory()->create([
            'employee_id' => 'EMP400',
            'name' => 'Rita Cole',
            'role' => 'staff',
        ]);

        $task = Task::create([
            'title' => 'Compile review evidence',
            'assigned_to_user_id' => $assignee->id,
            'assigned_by_user_id' => $manager->id,
            'priority' => 'medium',
            'due_date' => '2026-04-18',
            'status' => 'in-progress',
            'progress' => 60,
            'department' => 'Operations',
            'project' => 'Annual Review',
            'subtasks' => [],
            'tags' => [],
            'attachments' => [],
        ]);

        $this->actingAs($assignee)
            ->from(route('tasks'))
            ->patch(route('tasks.status', $task), [
                'status' => 'completed',
            ])
            ->assertRedirect(route('tasks'));

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'completed',
            'progress' => 100,
        ]);

        $this->actingAs($assignee)
            ->from(route('tasks'))
            ->post(route('tasks.comments.store', $task), [
                'text' => 'All supporting material has been attached.',
            ])
            ->assertRedirect(route('tasks'));

        $this->assertDatabaseHas('task_comments', [
            'task_id' => $task->id,
            'user_id' => $assignee->id,
            'text' => 'All supporting material has been attached.',
        ]);
    }

    public function test_unassigned_staff_cannot_mutate_tasks_they_do_not_own(): void
    {
        $manager = User::factory()->create([
            'employee_id' => 'EMP001',
            'role' => 'management',
        ]);

        $assignee = User::factory()->create([
            'employee_id' => 'EMP500',
            'role' => 'staff',
        ]);

        $otherStaff = User::factory()->create([
            'employee_id' => 'EMP501',
            'role' => 'staff',
        ]);

        $task = Task::create([
            'title' => 'Calibrate review scores',
            'assigned_to_user_id' => $assignee->id,
            'assigned_by_user_id' => $manager->id,
            'priority' => 'medium',
            'due_date' => '2026-04-22',
            'status' => 'todo',
            'progress' => 0,
            'department' => 'People Operations',
            'project' => 'Calibration',
            'subtasks' => [],
            'tags' => [],
            'attachments' => [],
        ]);

        $this->actingAs($otherStaff)
            ->patch(route('tasks.status', $task), [
                'status' => 'completed',
            ])
            ->assertForbidden();

        $this->actingAs($otherStaff)
            ->post(route('tasks.comments.store', $task), [
                'text' => 'I should not be able to post here.',
            ])
            ->assertForbidden();

        $this->actingAs($otherStaff)
            ->delete(route('tasks.destroy', $task))
            ->assertForbidden();
    }
}
