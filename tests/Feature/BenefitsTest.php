<?php

namespace Tests\Feature;

use App\Models\BenefitEnrollmentElection;
use App\Models\BenefitEnrollmentWindow;
use App\Models\BenefitPlan;
use App\Models\EmployeeBenefitEnrollment;
use App\Models\EmployeeDependent;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BenefitsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function hrUser(): User
    {
        return User::factory()->create(['role' => 'hr', 'status' => 'active']);
    }

    private function staffUser(): User
    {
        return User::factory()->create(['role' => 'staff', 'status' => 'active']);
    }

    private function makePlan(array $overrides = []): BenefitPlan
    {
        return BenefitPlan::create(array_merge([
            'type'                        => 'hmo',
            'name'                        => 'Test HMO',
            'provider'                    => 'Test Provider',
            'employee_contribution_type'  => 'none',
            'employee_contribution_value' => 0,
            'employer_contribution_type'  => 'fixed',
            'employer_contribution_value' => 1_500_000, // ₦15,000 in kobo
            'is_waivable'                 => true,
            'is_active'                   => true,
            'sort_order'                  => 0,
        ], $overrides));
    }

    private function makeWindow(array $overrides = []): BenefitEnrollmentWindow
    {
        $hr = $this->hrUser();
        return BenefitEnrollmentWindow::create(array_merge([
            'name'           => 'Test Window',
            'open_date'      => now()->subDay()->toDateString(),
            'close_date'     => now()->addDays(7)->toDateString(),
            'effective_date' => now()->addMonth()->toDateString(),
            'status'         => 'open',
            'created_by_id'  => $hr->id,
        ], $overrides));
    }

    // ── Authentication ────────────────────────────────────────────────────────

    public function test_guest_redirected_from_benefit_plans(): void
    {
        $this->get('/benefits/plans')->assertRedirect('/login');
    }

    public function test_guest_redirected_from_my_benefits(): void
    {
        $this->get('/benefits/my-benefits')->assertRedirect('/login');
    }

    // ── Authorisation ─────────────────────────────────────────────────────────

    public function test_staff_cannot_access_benefit_plans_admin(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/benefits/plans')
            ->assertStatus(403);
    }

    public function test_hr_can_access_benefit_plans_admin(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/benefits/plans')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->component('Benefits/BenefitPlansPage'));
    }

    public function test_staff_cannot_access_enrollment_admin(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/benefits/enrollments')
            ->assertStatus(403);
    }

    // ── Benefit Plan CRUD ─────────────────────────────────────────────────────

    public function test_hr_can_create_benefit_plan(): void
    {
        $hr = $this->hrUser();

        $this->actingAs($hr)
            ->post('/benefits/plans', [
                'type'                        => 'hmo',
                'name'                        => 'Staff HMO Plan',
                'provider'                    => 'ABC Health',
                'employee_contribution_type'  => 'none',
                'employee_contribution_value' => 0,
                'employer_contribution_type'  => 'fixed',
                'employer_contribution_value' => 2_000_000,
                'is_waivable'                 => true,
                'is_active'                   => true,
                'sort_order'                  => 1,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('benefit_plans', [
            'name'     => 'Staff HMO Plan',
            'provider' => 'ABC Health',
        ]);
    }

    public function test_hr_can_update_benefit_plan(): void
    {
        $hr   = $this->hrUser();
        $plan = $this->makePlan();

        $this->actingAs($hr)
            ->put("/benefits/plans/{$plan->id}", [
                'name'                        => 'Updated HMO',
                'provider'                    => 'New Provider',
                'employee_contribution_type'  => 'none',
                'employee_contribution_value' => 0,
                'employer_contribution_type'  => 'fixed',
                'employer_contribution_value' => 1_500_000,
                'is_waivable'                 => true,
                'is_active'                   => true,
                'sort_order'                  => 0,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('benefit_plans', ['id' => $plan->id, 'name' => 'Updated HMO']);
    }

    public function test_hr_can_delete_plan_with_no_active_enrollments(): void
    {
        $hr   = $this->hrUser();
        $plan = $this->makePlan();

        $this->actingAs($hr)
            ->delete("/benefits/plans/{$plan->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('benefit_plans', ['id' => $plan->id]);
    }

    public function test_hr_cannot_delete_plan_with_active_enrollments(): void
    {
        $hr     = $this->hrUser();
        $staff  = $this->staffUser();
        $plan   = $this->makePlan();

        EmployeeBenefitEnrollment::create([
            'user_id'                    => $staff->id,
            'benefit_plan_id'            => $plan->id,
            'status'                     => 'active',
            'effective_date'             => now()->toDateString(),
            'employee_contribution_kobo' => 0,
            'employer_contribution_kobo' => 1_500_000,
            'enrolled_by_id'             => $hr->id,
        ]);

        $this->actingAs($hr)
            ->delete("/benefits/plans/{$plan->id}")
            ->assertRedirect();

        $this->assertDatabaseHas('benefit_plans', ['id' => $plan->id]);
    }

    public function test_plan_creation_validates_required_fields(): void
    {
        $this->actingAs($this->hrUser())
            ->post('/benefits/plans', [])
            ->assertSessionHasErrors(['name', 'type']);
    }

    // ── Enrollment Windows ────────────────────────────────────────────────────

    public function test_hr_can_create_enrollment_window(): void
    {
        $hr = $this->hrUser();

        $this->actingAs($hr)
            ->post('/benefits/windows', [
                'name'           => 'Annual Enrollment 2026',
                'open_date'      => now()->toDateString(),
                'close_date'     => now()->addDays(14)->toDateString(),
                'effective_date' => now()->addMonth()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('benefit_enrollment_windows', [
            'name'   => 'Annual Enrollment 2026',
            'status' => 'upcoming',
        ]);
    }

    public function test_upcoming_window_can_be_opened(): void
    {
        $hr     = $this->hrUser();
        $window = $this->makeWindow(['status' => 'upcoming']);

        $this->actingAs($hr)
            ->post("/benefits/windows/{$window->id}/open")
            ->assertRedirect();

        $this->assertDatabaseHas('benefit_enrollment_windows', [
            'id'     => $window->id,
            'status' => 'open',
        ]);
    }

    public function test_open_window_cannot_be_opened_again(): void
    {
        $hr     = $this->hrUser();
        $window = $this->makeWindow(['status' => 'open']);

        $this->actingAs($hr)
            ->post("/benefits/windows/{$window->id}/open")
            ->assertStatus(422);
    }

    public function test_upcoming_window_can_be_deleted(): void
    {
        $hr     = $this->hrUser();
        $window = $this->makeWindow(['status' => 'upcoming']);

        $this->actingAs($hr)
            ->delete("/benefits/windows/{$window->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('benefit_enrollment_windows', ['id' => $window->id]);
    }

    public function test_open_window_cannot_be_deleted(): void
    {
        $hr     = $this->hrUser();
        $window = $this->makeWindow(['status' => 'open']);

        $this->actingAs($hr)
            ->delete("/benefits/windows/{$window->id}")
            ->assertStatus(422);
    }

    // ── Enrollment Window Processing ──────────────────────────────────────────

    public function test_process_window_creates_enrollments_for_enroll_elections(): void
    {
        $hr     = $this->hrUser();
        $staff  = $this->staffUser();
        $plan   = $this->makePlan();
        $window = $this->makeWindow();

        BenefitEnrollmentElection::create([
            'enrollment_window_id' => $window->id,
            'user_id'              => $staff->id,
            'benefit_plan_id'      => $plan->id,
            'election'             => 'enroll',
            'status'               => 'submitted',
            'submitted_at'         => now(),
        ]);

        $this->actingAs($hr)
            ->post("/benefits/windows/{$window->id}/process")
            ->assertRedirect();

        $this->assertDatabaseHas('employee_benefit_enrollments', [
            'user_id'         => $staff->id,
            'benefit_plan_id' => $plan->id,
            'status'          => 'active',
        ]);

        $this->assertDatabaseHas('benefit_enrollment_windows', [
            'id'     => $window->id,
            'status' => 'closed',
        ]);

        $this->assertDatabaseHas('benefit_enrollment_elections', [
            'id'     => 1,
            'status' => 'approved',
        ]);
    }

    public function test_process_window_terminates_enrollment_for_waive_elections(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makePlan();

        // Pre-existing active enrollment
        EmployeeBenefitEnrollment::create([
            'user_id'                    => $staff->id,
            'benefit_plan_id'            => $plan->id,
            'status'                     => 'active',
            'effective_date'             => now()->subMonth()->toDateString(),
            'employee_contribution_kobo' => 0,
            'employer_contribution_kobo' => 1_500_000,
            'enrolled_by_id'             => $hr->id,
        ]);

        $window = $this->makeWindow();

        BenefitEnrollmentElection::create([
            'enrollment_window_id' => $window->id,
            'user_id'              => $staff->id,
            'benefit_plan_id'      => $plan->id,
            'election'             => 'waive',
            'status'               => 'submitted',
            'submitted_at'         => now(),
        ]);

        $this->actingAs($hr)
            ->post("/benefits/windows/{$window->id}/process")
            ->assertRedirect();

        $this->assertDatabaseHas('employee_benefit_enrollments', [
            'user_id'         => $staff->id,
            'benefit_plan_id' => $plan->id,
            'status'          => 'terminated',
        ]);
    }

    // ── Manual Enrollment ─────────────────────────────────────────────────────

    public function test_hr_can_manually_enroll_employee(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makePlan();

        $this->actingAs($hr)
            ->post('/benefits/enrollments', [
                'user_id'                    => $staff->id,
                'benefit_plan_id'            => $plan->id,
                'effective_date'             => now()->toDateString(),
                'employee_contribution_kobo' => 0,
                'employer_contribution_kobo' => 1_500_000,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('employee_benefit_enrollments', [
            'user_id'         => $staff->id,
            'benefit_plan_id' => $plan->id,
            'status'          => 'active',
        ]);
    }

    public function test_hr_can_terminate_enrollment(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makePlan();

        $enrollment = EmployeeBenefitEnrollment::create([
            'user_id'                    => $staff->id,
            'benefit_plan_id'            => $plan->id,
            'status'                     => 'active',
            'effective_date'             => now()->subMonth()->toDateString(),
            'employee_contribution_kobo' => 0,
            'employer_contribution_kobo' => 1_500_000,
            'enrolled_by_id'             => $hr->id,
        ]);

        $this->actingAs($hr)
            ->post("/benefits/enrollments/{$enrollment->id}/terminate")
            ->assertRedirect();

        $this->assertDatabaseHas('employee_benefit_enrollments', [
            'id'     => $enrollment->id,
            'status' => 'terminated',
        ]);
    }

    // ── Employee Self-Service: My Benefits ────────────────────────────────────

    public function test_staff_can_view_my_benefits(): void
    {
        $staff = $this->staffUser();

        $this->actingAs($staff)
            ->get('/benefits/my-benefits')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->component('Benefits/MyBenefitsPage'));
    }

    public function test_staff_can_save_enroll_election(): void
    {
        $staff  = $this->staffUser();
        $plan   = $this->makePlan();
        $window = $this->makeWindow();

        $this->actingAs($staff)
            ->post('/benefits/my-benefits/election', [
                'enrollment_window_id' => $window->id,
                'benefit_plan_id'      => $plan->id,
                'election'             => 'enroll',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('benefit_enrollment_elections', [
            'enrollment_window_id' => $window->id,
            'user_id'              => $staff->id,
            'benefit_plan_id'      => $plan->id,
            'election'             => 'enroll',
            'status'               => 'draft',
        ]);
    }

    public function test_staff_can_change_election_from_enroll_to_waive(): void
    {
        $staff  = $this->staffUser();
        $plan   = $this->makePlan(['is_waivable' => true]);
        $window = $this->makeWindow();

        // First election: enroll
        BenefitEnrollmentElection::create([
            'enrollment_window_id' => $window->id,
            'user_id'              => $staff->id,
            'benefit_plan_id'      => $plan->id,
            'election'             => 'enroll',
            'status'               => 'draft',
        ]);

        // Change to waive
        $this->actingAs($staff)
            ->post('/benefits/my-benefits/election', [
                'enrollment_window_id' => $window->id,
                'benefit_plan_id'      => $plan->id,
                'election'             => 'waive',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('benefit_enrollment_elections', [
            'enrollment_window_id' => $window->id,
            'user_id'              => $staff->id,
            'benefit_plan_id'      => $plan->id,
            'election'             => 'waive',
        ]);

        // Only one record, not two
        $this->assertDatabaseCount('benefit_enrollment_elections', 1);
    }

    public function test_staff_cannot_waive_non_waivable_plan(): void
    {
        $staff  = $this->staffUser();
        $plan   = $this->makePlan(['is_waivable' => false]);
        $window = $this->makeWindow();

        $this->actingAs($staff)
            ->post('/benefits/my-benefits/election', [
                'enrollment_window_id' => $window->id,
                'benefit_plan_id'      => $plan->id,
                'election'             => 'waive',
            ])
            ->assertStatus(422);
    }

    public function test_staff_cannot_elect_on_closed_window(): void
    {
        $staff  = $this->staffUser();
        $plan   = $this->makePlan();
        $window = $this->makeWindow(['status' => 'closed']);

        $this->actingAs($staff)
            ->post('/benefits/my-benefits/election', [
                'enrollment_window_id' => $window->id,
                'benefit_plan_id'      => $plan->id,
                'election'             => 'enroll',
            ])
            ->assertStatus(422);
    }

    public function test_staff_can_submit_elections(): void
    {
        $staff  = $this->staffUser();
        $plan   = $this->makePlan();
        $window = $this->makeWindow();

        BenefitEnrollmentElection::create([
            'enrollment_window_id' => $window->id,
            'user_id'              => $staff->id,
            'benefit_plan_id'      => $plan->id,
            'election'             => 'enroll',
            'status'               => 'draft',
        ]);

        $this->actingAs($staff)
            ->post('/benefits/my-benefits/submit', [
                'enrollment_window_id' => $window->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('benefit_enrollment_elections', [
            'enrollment_window_id' => $window->id,
            'user_id'              => $staff->id,
            'status'               => 'submitted',
        ]);
    }

    public function test_staff_cannot_submit_elections_for_closed_window(): void
    {
        $staff  = $this->staffUser();
        $window = $this->makeWindow(['status' => 'closed']);

        $this->actingAs($staff)
            ->post('/benefits/my-benefits/submit', [
                'enrollment_window_id' => $window->id,
            ])
            ->assertStatus(422);
    }

    // ── Dependents ────────────────────────────────────────────────────────────

    public function test_staff_can_add_dependent(): void
    {
        $staff = $this->staffUser();

        $this->actingAs($staff)
            ->post('/benefits/my-benefits/dependents', [
                'name'          => 'Jane Doe',
                'relationship'  => 'spouse',
                'date_of_birth' => '1990-01-01',
                'gender'        => 'female',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('employee_dependents', [
            'user_id'      => $staff->id,
            'name'         => 'Jane Doe',
            'relationship' => 'spouse',
        ]);
    }

    public function test_staff_can_update_own_dependent(): void
    {
        $staff = $this->staffUser();

        $dep = EmployeeDependent::create([
            'user_id'      => $staff->id,
            'name'         => 'Old Name',
            'relationship' => 'child',
            'is_active'    => true,
        ]);

        $this->actingAs($staff)
            ->put("/benefits/my-benefits/dependents/{$dep->id}", [
                'name'         => 'New Name',
                'relationship' => 'child',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('employee_dependents', ['id' => $dep->id, 'name' => 'New Name']);
    }

    public function test_staff_cannot_update_another_users_dependent(): void
    {
        $staffA = $this->staffUser();
        $staffB = $this->staffUser();

        $dep = EmployeeDependent::create([
            'user_id'      => $staffB->id,
            'name'         => 'B Child',
            'relationship' => 'child',
            'is_active'    => true,
        ]);

        $this->actingAs($staffA)
            ->put("/benefits/my-benefits/dependents/{$dep->id}", [
                'name'         => 'Hacked',
                'relationship' => 'child',
            ])
            ->assertStatus(403);
    }

    public function test_staff_can_remove_dependent(): void
    {
        $staff = $this->staffUser();

        $dep = EmployeeDependent::create([
            'user_id'      => $staff->id,
            'name'         => 'To Remove',
            'relationship' => 'parent',
            'is_active'    => true,
        ]);

        $this->actingAs($staff)
            ->delete("/benefits/my-benefits/dependents/{$dep->id}")
            ->assertRedirect();

        $this->assertDatabaseHas('employee_dependents', [
            'id'        => $dep->id,
            'is_active' => false,
        ]);
    }

    public function test_staff_cannot_remove_another_users_dependent(): void
    {
        $staffA = $this->staffUser();
        $staffB = $this->staffUser();

        $dep = EmployeeDependent::create([
            'user_id'      => $staffB->id,
            'name'         => 'B Dep',
            'relationship' => 'sibling',
            'is_active'    => true,
        ]);

        $this->actingAs($staffA)
            ->delete("/benefits/my-benefits/dependents/{$dep->id}")
            ->assertStatus(403);
    }

    public function test_dependent_requires_name_and_relationship(): void
    {
        $staff = $this->staffUser();

        $this->actingAs($staff)
            ->post('/benefits/my-benefits/dependents', [])
            ->assertSessionHasErrors(['name', 'relationship']);
    }

    // ── Model: BenefitPlan contribution computation ───────────────────────────

    public function test_benefit_plan_fixed_contribution_returns_value(): void
    {
        $plan = $this->makePlan([
            'employer_contribution_type'  => 'fixed',
            'employer_contribution_value' => 1_500_000,
        ]);

        $salary = new \App\Models\EmployeeSalary([
            'basic_kobo'            => 50_000_000,
            'housing_kobo'          => 20_000_000,
            'transport_kobo'        => 10_000_000,
            'other_allowances_kobo' => 0,
        ]);

        $this->assertSame(1_500_000, $plan->computeEmployerContribution($salary));
    }

    public function test_benefit_plan_percentage_of_basic_contribution(): void
    {
        $plan = $this->makePlan([
            'employer_contribution_type'  => 'percentage_of_basic',
            'employer_contribution_value' => 50, // 0.50% in basis points
        ]);

        $salary = new \App\Models\EmployeeSalary([
            'basic_kobo'            => 50_000_000,
            'housing_kobo'          => 0,
            'transport_kobo'        => 0,
            'other_allowances_kobo' => 0,
        ]);

        // 0.50% of ₦500,000 = ₦2,500 = 250,000 kobo
        $this->assertSame(250_000, $plan->computeEmployerContribution($salary));
    }

    // ── BenefitEnrollmentWindow: isCurrentlyOpen ──────────────────────────────

    public function test_window_is_currently_open_when_status_open_and_in_date_range(): void
    {
        $window = $this->makeWindow([
            'status'     => 'open',
            'open_date'  => now()->subDay()->toDateString(),
            'close_date' => now()->addDay()->toDateString(),
        ]);

        $this->assertTrue($window->isCurrentlyOpen());
    }

    public function test_window_is_not_currently_open_when_status_upcoming(): void
    {
        $window = $this->makeWindow([
            'status'     => 'upcoming',
            'open_date'  => now()->subDay()->toDateString(),
            'close_date' => now()->addDay()->toDateString(),
        ]);

        $this->assertFalse($window->isCurrentlyOpen());
    }

    public function test_window_is_not_currently_open_when_past_close_date(): void
    {
        $window = $this->makeWindow([
            'status'     => 'open',
            'open_date'  => now()->subDays(10)->toDateString(),
            'close_date' => now()->subDay()->toDateString(),
        ]);

        $this->assertFalse($window->isCurrentlyOpen());
    }
}
