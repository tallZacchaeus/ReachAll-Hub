<?php

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveRequestsTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_submit_leave_requests_within_remaining_balance(): void
    {
        $staff = User::factory()->create([
            'employee_id' => 'EMP301',
            'role' => 'staff',
        ]);

        $this->actingAs($staff)
            ->from(route('leave'))
            ->post(route('leave.store'), [
                'type' => 'annual',
                'startDate' => now()->addDays(10)->toDateString(),
                'endDate' => now()->addDays(12)->toDateString(),
                'reason' => 'Planned family trip.',
            ])
            ->assertRedirect(route('leave'));

        $this->assertDatabaseHas('leave_requests', [
            'user_id' => $staff->id,
            'type' => 'annual',
            'days' => 3,
            'status' => 'pending',
        ]);
    }

    public function test_staff_cannot_submit_leave_beyond_their_remaining_balance(): void
    {
        $staff = User::factory()->create([
            'employee_id' => 'EMP302',
            'role' => 'staff',
        ]);

        LeaveRequest::create([
            'user_id' => $staff->id,
            'type' => 'personal',
            'start_date' => now()->startOfYear()->addDays(5)->toDateString(),
            'end_date' => now()->startOfYear()->addDays(8)->toDateString(),
            'days' => 4,
            'reason' => 'Already used most personal leave.',
            'status' => 'approved',
        ]);

        $this->actingAs($staff)
            ->from(route('leave'))
            ->post(route('leave.store'), [
                'type' => 'personal',
                'startDate' => now()->addDays(15)->toDateString(),
                'endDate' => now()->addDays(17)->toDateString(),
                'reason' => 'This should exceed remaining balance.',
            ])
            ->assertRedirect(route('leave'))
            ->assertSessionHasErrors('endDate');
    }

    public function test_admin_can_review_leave_requests(): void
    {
        $admin = User::factory()->create([
            'employee_id' => 'EMP001',
            'role' => 'hr',
        ]);

        $staff = User::factory()->create([
            'employee_id' => 'EMP303',
            'role' => 'staff',
        ]);

        $leaveRequest = LeaveRequest::create([
            'user_id' => $staff->id,
            'type' => 'sick',
            'start_date' => now()->addDays(3)->toDateString(),
            'end_date' => now()->addDays(4)->toDateString(),
            'days' => 2,
            'reason' => 'Medical recovery period.',
            'status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->from(route('leave'))
            ->patch(route('leave.status', $leaveRequest), [
                'status' => 'approved',
                'hrComment' => 'Approved. Get well soon.',
            ])
            ->assertRedirect(route('leave'));

        $this->assertDatabaseHas('leave_requests', [
            'id' => $leaveRequest->id,
            'status' => 'approved',
            'reviewed_by_user_id' => $admin->id,
            'hr_comment' => 'Approved. Get well soon.',
        ]);
    }
}
