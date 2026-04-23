<?php

namespace Tests\Feature;

use App\Models\BonusAward;
use App\Models\BonusPlan;
use App\Models\CompensationBand;
use App\Models\CompensationReviewCycle;
use App\Models\CompensationReviewEntry;
use App\Models\EmployeeSalary;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CompensationTest extends TestCase
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

    private function makeBand(array $overrides = []): CompensationBand
    {
        return CompensationBand::create(array_merge([
            'grade'          => 'L3',
            'title'          => 'Senior Engineer',
            'category'       => 'individual_contributor',
            'min_kobo'       => 50_000_000,
            'midpoint_kobo'  => 70_000_000,
            'max_kobo'       => 90_000_000,
            'effective_date' => '2026-01-01',
            'is_active'      => true,
        ], $overrides));
    }

    private function makeCycle(array $overrides = []): CompensationReviewCycle
    {
        $hr = $this->hrUser();
        return CompensationReviewCycle::create(array_merge([
            'name'               => 'Annual Review 2026',
            'cycle_type'         => 'annual',
            'review_start_date'  => now()->subDays(5)->toDateString(),
            'review_end_date'    => now()->addDays(20)->toDateString(),
            'effective_date'     => now()->addMonth()->toDateString(),
            'status'             => 'draft',
            'budget_kobo'        => 50_000_000_00,
            'created_by_id'      => $hr->id,
        ], $overrides));
    }

    private function makeBonusPlan(array $overrides = []): BonusPlan
    {
        $hr = $this->hrUser();
        return BonusPlan::create(array_merge([
            'name'              => 'Q4 Bonus',
            'bonus_type'        => 'performance',
            'total_budget_kobo' => 10_000_000_00,
            'status'            => 'draft',
            'created_by_id'     => $hr->id,
        ], $overrides));
    }

    private function makeSalary(User $user, array $overrides = []): EmployeeSalary
    {
        return EmployeeSalary::create(array_merge([
            'user_id'               => $user->id,
            'basic_kobo'            => 50_000_000,
            'housing_kobo'          => 20_000_000,
            'transport_kobo'        => 10_000_000,
            'other_allowances_kobo' => 0,
            'nhf_enrolled'          => false,
            'effective_date'        => '2026-01-01',
        ], $overrides));
    }

    // ── Authentication ────────────────────────────────────────────────────────

    public function test_guest_redirected_from_compensation_bands(): void
    {
        $this->get('/compensation/bands')->assertRedirect('/login');
    }

    public function test_guest_redirected_from_my_rewards(): void
    {
        $this->get('/compensation/my-rewards')->assertRedirect('/login');
    }

    // ── Authorisation ─────────────────────────────────────────────────────────

    public function test_staff_cannot_access_salary_bands(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/compensation/bands')
            ->assertStatus(403);
    }

    public function test_hr_can_access_salary_bands(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/compensation/bands')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->component('Compensation/CompensationBandsPage'));
    }

    public function test_staff_cannot_access_review_cycles(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/compensation/reviews')
            ->assertStatus(403);
    }

    public function test_staff_cannot_access_bonus_plans(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/compensation/bonus')
            ->assertStatus(403);
    }

    public function test_staff_can_access_my_rewards(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/compensation/my-rewards')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->component('Compensation/TotalRewardsPage'));
    }

    // ── Salary Bands ──────────────────────────────────────────────────────────

    public function test_hr_can_create_salary_band(): void
    {
        $this->actingAs($this->hrUser())
            ->post('/compensation/bands', [
                'grade'          => 'M1',
                'title'          => 'Engineering Manager',
                'category'       => 'manager',
                'min_kobo'       => 80_000_000,
                'midpoint_kobo'  => 100_000_000,
                'max_kobo'       => 120_000_000,
                'effective_date' => '2026-01-01',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('compensation_bands', ['grade' => 'M1', 'title' => 'Engineering Manager']);
    }

    public function test_hr_can_update_salary_band(): void
    {
        $hr   = $this->hrUser();
        $band = $this->makeBand();

        $this->actingAs($hr)
            ->put("/compensation/bands/{$band->id}", [
                'title'          => 'Updated Title',
                'category'       => 'individual_contributor',
                'min_kobo'       => 55_000_000,
                'midpoint_kobo'  => 75_000_000,
                'max_kobo'       => 95_000_000,
                'effective_date' => '2026-01-01',
                'is_active'      => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('compensation_bands', ['id' => $band->id, 'title' => 'Updated Title']);
    }

    public function test_hr_can_delete_salary_band(): void
    {
        $hr   = $this->hrUser();
        $band = $this->makeBand();

        $this->actingAs($hr)
            ->delete("/compensation/bands/{$band->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('compensation_bands', ['id' => $band->id]);
    }

    public function test_band_creation_validates_midpoint_greater_than_min(): void
    {
        $this->actingAs($this->hrUser())
            ->post('/compensation/bands', [
                'grade'          => 'X1',
                'title'          => 'Test',
                'category'       => 'individual_contributor',
                'min_kobo'       => 90_000_000,
                'midpoint_kobo'  => 50_000_000,   // less than min — should fail
                'max_kobo'       => 120_000_000,
                'effective_date' => '2026-01-01',
            ])
            ->assertSessionHasErrors(['midpoint_kobo']);
    }

    // ── Compensation Band Model ────────────────────────────────────────────────

    public function test_band_comparatio_calculated_correctly(): void
    {
        $band = $this->makeBand([
            'midpoint_kobo' => 70_000_000,
        ]);

        // Salary at midpoint → comparatio = 1.0
        $this->assertSame(1.0, $band->comparatio(70_000_000));

        // Salary below midpoint
        $this->assertEqualsWithDelta(0.857, $band->comparatio(60_000_000), 0.001);
    }

    public function test_band_range_position_calculated_correctly(): void
    {
        $band = $this->makeBand([
            'min_kobo'      => 50_000_000,
            'midpoint_kobo' => 70_000_000,
            'max_kobo'      => 90_000_000,
        ]);

        // At minimum → position = 0
        $this->assertSame(0.0, $band->rangePosition(50_000_000));

        // At maximum → position = 1
        $this->assertSame(1.0, $band->rangePosition(90_000_000));

        // At midpoint → position = 0.5
        $this->assertSame(0.5, $band->rangePosition(70_000_000));
    }

    // ── Review Cycles ─────────────────────────────────────────────────────────

    public function test_hr_can_create_review_cycle(): void
    {
        $this->actingAs($this->hrUser())
            ->post('/compensation/reviews', [
                'name'               => 'Mid-Year 2026',
                'cycle_type'         => 'mid_year',
                'review_start_date'  => '2026-06-01',
                'review_end_date'    => '2026-06-30',
                'effective_date'     => '2026-07-01',
                'budget_kobo'        => 20_000_000,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('compensation_review_cycles', [
            'name'   => 'Mid-Year 2026',
            'status' => 'draft',
        ]);
    }

    public function test_draft_cycle_can_be_activated_and_entries_created(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $this->makeSalary($staff);

        $cycle = $this->makeCycle(['status' => 'draft']);

        $this->actingAs($hr)
            ->post("/compensation/reviews/{$cycle->id}/activate")
            ->assertRedirect();

        $this->assertDatabaseHas('compensation_review_cycles', ['id' => $cycle->id, 'status' => 'active']);

        // Entry should exist for staff with salary
        $this->assertDatabaseHas('compensation_review_entries', [
            'cycle_id' => $cycle->id,
            'user_id'  => $staff->id,
        ]);
    }

    public function test_non_draft_cycle_cannot_be_activated(): void
    {
        $hr    = $this->hrUser();
        $cycle = $this->makeCycle(['status' => 'active']);

        $this->actingAs($hr)
            ->post("/compensation/reviews/{$cycle->id}/activate")
            ->assertStatus(422);
    }

    public function test_active_cycle_can_be_closed(): void
    {
        $hr    = $this->hrUser();
        $cycle = $this->makeCycle(['status' => 'active']);

        $this->actingAs($hr)
            ->post("/compensation/reviews/{$cycle->id}/close")
            ->assertRedirect();

        $this->assertDatabaseHas('compensation_review_cycles', ['id' => $cycle->id, 'status' => 'closed']);
    }

    public function test_review_entry_can_be_submitted(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $cycle = $this->makeCycle(['status' => 'active']);

        $entry = CompensationReviewEntry::create([
            'cycle_id'            => $cycle->id,
            'user_id'             => $staff->id,
            'current_salary_kobo' => 80_000_000,
            'status'              => 'pending',
        ]);

        $this->actingAs($hr)
            ->put("/compensation/review-entries/{$entry->id}", [
                'proposed_salary_kobo' => 88_000_000,
                'merit_basis_points'   => 1000,
                'recommendation'       => 'increase',
                'rationale'            => 'Excellent performance',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('compensation_review_entries', [
            'id'                   => $entry->id,
            'proposed_salary_kobo' => 88_000_000,
            'status'               => 'submitted',
        ]);
    }

    public function test_submitted_entry_can_be_approved_and_salary_updated(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $this->makeSalary($staff);

        $cycle = $this->makeCycle(['status' => 'active']);

        $entry = CompensationReviewEntry::create([
            'cycle_id'             => $cycle->id,
            'user_id'              => $staff->id,
            'current_salary_kobo'  => 80_000_000,
            'proposed_salary_kobo' => 88_000_000,
            'merit_basis_points'   => 1000,
            'recommendation'       => 'increase',
            'status'               => 'submitted',
        ]);

        $this->actingAs($hr)
            ->post("/compensation/review-entries/{$entry->id}/approve")
            ->assertRedirect();

        $this->assertDatabaseHas('compensation_review_entries', ['id' => $entry->id, 'status' => 'approved']);

        // A new salary record should have been created
        $this->assertDatabaseCount('employee_salaries', 2);
    }

    public function test_submitted_entry_can_be_rejected(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $cycle = $this->makeCycle(['status' => 'active']);

        $entry = CompensationReviewEntry::create([
            'cycle_id'             => $cycle->id,
            'user_id'              => $staff->id,
            'current_salary_kobo'  => 80_000_000,
            'proposed_salary_kobo' => 88_000_000,
            'status'               => 'submitted',
        ]);

        $this->actingAs($hr)
            ->post("/compensation/review-entries/{$entry->id}/reject", ['rationale' => 'Budget exceeded'])
            ->assertRedirect();

        $this->assertDatabaseHas('compensation_review_entries', ['id' => $entry->id, 'status' => 'rejected']);
    }

    public function test_pending_entry_cannot_be_approved(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $cycle = $this->makeCycle(['status' => 'active']);

        $entry = CompensationReviewEntry::create([
            'cycle_id'            => $cycle->id,
            'user_id'             => $staff->id,
            'current_salary_kobo' => 80_000_000,
            'status'              => 'pending',
        ]);

        $this->actingAs($hr)
            ->post("/compensation/review-entries/{$entry->id}/approve")
            ->assertStatus(422);
    }

    // ── Bonus Plans ───────────────────────────────────────────────────────────

    public function test_hr_can_create_bonus_plan(): void
    {
        $this->actingAs($this->hrUser())
            ->post('/compensation/bonus', [
                'name'              => 'FY2026 Annual Bonus',
                'bonus_type'        => 'annual',
                'total_budget_kobo' => 50_000_000,
                'period_label'      => 'FY2026',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bonus_plans', [
            'name'   => 'FY2026 Annual Bonus',
            'status' => 'draft',
        ]);
    }

    public function test_draft_plan_can_be_activated(): void
    {
        $hr   = $this->hrUser();
        $plan = $this->makeBonusPlan(['status' => 'draft']);

        $this->actingAs($hr)
            ->post("/compensation/bonus/{$plan->id}/activate")
            ->assertRedirect();

        $this->assertDatabaseHas('bonus_plans', ['id' => $plan->id, 'status' => 'active']);
    }

    public function test_active_plan_can_receive_awards(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makeBonusPlan(['status' => 'active']);

        $this->actingAs($hr)
            ->post("/compensation/bonus/{$plan->id}/awards", [
                'user_id'     => $staff->id,
                'amount_kobo' => 500_000_00,
                'rationale'   => 'Outstanding Q4 performance',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bonus_awards', [
            'bonus_plan_id' => $plan->id,
            'user_id'       => $staff->id,
            'amount_kobo'   => 500_000_00,
            'status'        => 'draft',
        ]);
    }

    public function test_draft_plan_cannot_receive_awards(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makeBonusPlan(['status' => 'draft']);

        $this->actingAs($hr)
            ->post("/compensation/bonus/{$plan->id}/awards", [
                'user_id'     => $staff->id,
                'amount_kobo' => 500_000_00,
            ])
            ->assertStatus(422);
    }

    public function test_draft_award_can_be_approved(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makeBonusPlan(['status' => 'active']);

        $award = BonusAward::create([
            'bonus_plan_id' => $plan->id,
            'user_id'       => $staff->id,
            'amount_kobo'   => 500_000_00,
            'status'        => 'draft',
        ]);

        $this->actingAs($hr)
            ->post("/compensation/bonus-awards/{$award->id}/approve")
            ->assertRedirect();

        $this->assertDatabaseHas('bonus_awards', ['id' => $award->id, 'status' => 'approved']);
    }

    public function test_approved_award_can_be_marked_paid(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makeBonusPlan(['status' => 'active']);

        $award = BonusAward::create([
            'bonus_plan_id' => $plan->id,
            'user_id'       => $staff->id,
            'amount_kobo'   => 500_000_00,
            'status'        => 'approved',
            'approved_by_id'=> $hr->id,
            'approved_at'   => now(),
        ]);

        $this->actingAs($hr)
            ->post("/compensation/bonus-awards/{$award->id}/mark-paid")
            ->assertRedirect();

        $this->assertDatabaseHas('bonus_awards', ['id' => $award->id, 'status' => 'paid']);
    }

    public function test_draft_award_can_be_deleted(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makeBonusPlan(['status' => 'active']);

        $award = BonusAward::create([
            'bonus_plan_id' => $plan->id,
            'user_id'       => $staff->id,
            'amount_kobo'   => 100_000_00,
            'status'        => 'draft',
        ]);

        $this->actingAs($hr)
            ->delete("/compensation/bonus-awards/{$award->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('bonus_awards', ['id' => $award->id]);
    }

    public function test_approved_award_cannot_be_deleted(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makeBonusPlan(['status' => 'active']);

        $award = BonusAward::create([
            'bonus_plan_id'  => $plan->id,
            'user_id'        => $staff->id,
            'amount_kobo'    => 100_000_00,
            'status'         => 'approved',
            'approved_by_id' => $hr->id,
            'approved_at'    => now(),
        ]);

        $this->actingAs($hr)
            ->delete("/compensation/bonus-awards/{$award->id}")
            ->assertStatus(422);
    }

    // ── BonusPlan Model ───────────────────────────────────────────────────────

    public function test_bonus_plan_committed_kobo_sums_approved_and_paid(): void
    {
        $hr    = $this->hrUser();
        $staff = $this->staffUser();
        $plan  = $this->makeBonusPlan(['status' => 'active', 'total_budget_kobo' => 10_000_000_00]);

        BonusAward::create(['bonus_plan_id' => $plan->id, 'user_id' => $staff->id, 'amount_kobo' => 200_000_00, 'status' => 'approved', 'approved_by_id' => $hr->id, 'approved_at' => now()]);
        BonusAward::create(['bonus_plan_id' => $plan->id, 'user_id' => $hr->id,    'amount_kobo' => 300_000_00, 'status' => 'draft']);

        $plan->refresh();

        $this->assertSame(200_000_00, $plan->committedKobo());
        $this->assertSame(10_000_000_00 - 200_000_00, $plan->remainingBudgetKobo());
    }

    // ── CompensationReviewEntry Model ─────────────────────────────────────────

    public function test_review_entry_merit_percent_converts_basis_points(): void
    {
        $entry = new CompensationReviewEntry([
            'merit_basis_points'   => 750,
            'current_salary_kobo'  => 80_000_000,
            'proposed_salary_kobo' => 86_000_000,
        ]);

        $this->assertEqualsWithDelta(0.075, $entry->meritPercent(), 0.0001);
        $this->assertSame(6_000_000, $entry->increaseKobo());
    }
}
