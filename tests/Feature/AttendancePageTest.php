<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AttendancePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_view_their_monthly_attendance(): void
    {
        $user = User::factory()->create([
            'employee_id' => 'EMP001',
            'role' => 'staff',
        ]);

        AttendanceRecord::create([
            'user_id' => $user->id,
            'date' => now()->startOfMonth()->toDateString(),
            'clock_in_at' => now()->startOfMonth()->setTime(8, 45),
            'clock_out_at' => now()->startOfMonth()->setTime(17, 30),
            'total_hours' => 8.75,
            'status' => 'present',
        ]);

        AttendanceRecord::create([
            'user_id' => $user->id,
            'date' => now()->startOfMonth()->addDay()->toDateString(),
            'clock_in_at' => now()->startOfMonth()->addDay()->setTime(9, 15),
            'clock_out_at' => now()->startOfMonth()->addDay()->setTime(17, 45),
            'total_hours' => 8.50,
            'status' => 'late',
            'notes' => 'Traffic delay',
        ]);

        $this->actingAs($user)
            ->get(route('attendance', ['month' => now()->format('Y-m')]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('AttendancePage')
                ->where('selectedMonth', now()->format('Y-m'))
                ->has('attendanceRecords', 2)
                ->where('summary.totalDays', 2)
                ->where('summary.presentDays', 2)
                ->where('summary.lateDays', 1)
            );
    }
}
