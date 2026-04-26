<?php

namespace Tests\Feature;

use App\Notifications\Auth\VerifyEmailWithCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StaffEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_staff_enrollment(): void
    {
        $this->get(route('staff-enrollment'))
            ->assertRedirect(route('login'));
    }

    public function test_non_admin_users_cannot_access_staff_enrollment(): void
    {
        $this->actingAs(User::factory()->create([
            'role' => 'staff',
        ]));

        $this->get(route('staff-enrollment'))
            ->assertForbidden();
    }

    public function test_hr_users_can_view_staff_enrollment_page(): void
    {
        $this->actingAs(User::factory()->create([
            'role' => 'hr',
        ]));

        User::factory()->create([
            'employee_id' => 'EMP100',
            'name' => 'Jane Doe',
            'department' => 'Video & Production',
            'position' => 'Video Editor',
            'status' => 'active',
            'role' => 'staff',
        ]);

        $this->get(route('staff-enrollment'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('StaffEnrollmentPage')
                ->has('staffMembers', 2)
                ->where('staffMembers.0.emailVerified', true)
                ->has('departments')
                ->has('positions')
                ->has('roles')
            );
    }

    public function test_hr_users_can_enroll_staff_members(): void
    {
        Notification::fake();

        $admin = User::factory()->create([
            'role' => 'hr',
        ]);

        $response = $this->actingAs($admin)
            ->from(route('staff-enrollment'))
            ->post(route('staff-enrollment.store'), [
                'employeeId' => 'EMP200',
                'firstName' => 'John',
                'lastName' => 'Smith',
                'email' => 'john.smith@example.com',
                'password' => 'password123',
                'department' => 'Project Management',
                'position' => 'Project Manager',
                'role' => 'Management',
            ]);

        $response->assertRedirect(route('staff-enrollment'));

        $user = User::where('employee_id', 'EMP200')->first();

        $this->assertNotNull($user);
        $this->assertSame('John Smith', $user->name);
        $this->assertSame('management', $user->role);
        $this->assertSame('active', $user->status);
        $this->assertNull($user->email_verified_at);
        $this->assertTrue(Hash::check('password123', $user->password));
        Notification::assertSentTo($user, VerifyEmailWithCode::class);
    }

    public function test_hr_users_can_update_and_toggle_staff_status(): void
    {
        Notification::fake();

        $admin = User::factory()->create([
            'role' => 'hr',
        ]);

        $staff = User::factory()->create([
            'employee_id' => 'EMP300',
            'name' => 'Emily Stone',
            'email' => 'emily@example.com',
            'department' => 'Content & Brand Comms',
            'position' => 'Content Writer',
            'status' => 'active',
            'role' => 'staff',
        ]);

        $this->actingAs($admin)
            ->from(route('staff-enrollment'))
            ->put(route('staff-enrollment.update', $staff), [
                'employeeId' => 'EMP300',
                'firstName' => 'Emily',
                'lastName' => 'Stone',
                'email' => 'emily.stone@example.com',
                'department' => 'Graphics Design',
                'position' => 'Graphic Designer',
                'role' => 'HR',
            ])
            ->assertRedirect(route('staff-enrollment'));

        $staff->refresh();

        $this->assertSame('emily.stone@example.com', $staff->email);
        $this->assertSame('Graphics Design', $staff->department);
        $this->assertSame('Graphic Designer', $staff->position);
        $this->assertSame('hr', $staff->role);
        $this->assertNull($staff->email_verified_at);
        Notification::assertSentTo($staff, VerifyEmailWithCode::class);

        $this->actingAs($admin)
            ->from(route('staff-enrollment'))
            ->patch(route('staff-enrollment.toggle-status', $staff))
            ->assertRedirect(route('staff-enrollment'));

        $this->assertSame('inactive', $staff->fresh()->status);
    }

    public function test_hr_users_cannot_delete_their_own_account_from_staff_enrollment(): void
    {
        $admin = User::factory()->create([
            'role' => 'hr',
            'employee_id' => 'EMP999',
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->from(route('staff-enrollment'))
            ->delete(route('staff-enrollment.destroy', $admin))
            ->assertRedirect(route('staff-enrollment'))
            ->assertSessionHas('error', 'You cannot remove your own account.');

        $this->assertNotNull($admin->fresh());
    }

    public function test_hr_users_can_resend_verification_to_unverified_staff(): void
    {
        Notification::fake();

        $admin = User::factory()->create([
            'role' => 'hr',
        ]);

        $staff = User::factory()->unverified()->create([
            'role' => 'staff',
            'email' => 'pending.staff@example.com',
        ]);

        $this->actingAs($admin)
            ->from(route('staff-enrollment'))
            ->post(route('staff-enrollment.resend-verification', $staff))
            ->assertRedirect(route('staff-enrollment'))
            ->assertSessionHas('success', 'Verification email resent successfully.');

        Notification::assertSentTo($staff, VerifyEmailWithCode::class);
    }

    public function test_hr_users_cannot_resend_verification_to_verified_staff(): void
    {
        Notification::fake();

        $admin = User::factory()->create([
            'role' => 'hr',
        ]);

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $this->actingAs($admin)
            ->from(route('staff-enrollment'))
            ->post(route('staff-enrollment.resend-verification', $staff))
            ->assertRedirect(route('staff-enrollment'))
            ->assertSessionHas('error', 'This user has already verified their email address.');

        Notification::assertNothingSent();
    }
}
