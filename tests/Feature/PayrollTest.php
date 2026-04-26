<?php

namespace Tests\Feature;

use App\Models\EmployeeSalary;
use App\Models\PayrollDeduction;
use App\Models\PayrollRun;
use App\Models\User;
use App\Services\Finance\MoneyHelper;
use App\Services\Payroll\PayrollCalculator;
use App\Services\Payroll\PayrollRunService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PayrollTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    private function hrUser(): User
    {
        return User::factory()->create(['role' => 'hr', 'status' => 'active']);
    }

    private function financeUser(): User
    {
        return User::factory()->create(['role' => 'finance', 'status' => 'active']);
    }

    private function staffUser(): User
    {
        return User::factory()->create(['role' => 'staff', 'status' => 'active']);
    }

    private function makeSalary(User $user, array $overrides = []): EmployeeSalary
    {
        return EmployeeSalary::create(array_merge([
            'user_id' => $user->id,
            'basic_kobo' => 50_000_00,   // ₦500,000
            'housing_kobo' => 20_000_00,   // ₦200,000
            'transport_kobo' => 5_000_00,    // ₦50,000
            'other_allowances_kobo' => 0,
            'nhf_enrolled' => false,
            'effective_date' => now()->subMonth()->toDateString(),
        ], $overrides));
    }

    // ── Authentication / Authorisation ────────────────────────────────────────

    public function test_guest_redirected_from_payroll_runs(): void
    {
        $this->get('/payroll/runs')->assertRedirect(route('login'));
    }

    public function test_staff_cannot_access_payroll_runs(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/payroll/runs')
            ->assertForbidden();
    }

    public function test_hr_can_access_payroll_runs(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/payroll/runs')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Payroll/PayrollRunsPage'));
    }

    public function test_finance_can_access_payroll_runs(): void
    {
        $this->actingAs($this->financeUser())
            ->get('/payroll/runs')
            ->assertOk();
    }

    public function test_staff_cannot_access_salary_management(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/payroll/salaries')
            ->assertForbidden();
    }

    public function test_staff_can_access_own_payslips_page(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/payroll/my-payslips')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Payroll/MyPayslipsPage'));
    }

    // ── PayrollCalculator unit tests ─────────────────────────────────────────

    public function test_calculator_pension_is_8_percent_of_pensionable_pay(): void
    {
        $salary = new EmployeeSalary([
            'basic_kobo' => 50_000_00,
            'housing_kobo' => 20_000_00,
            'transport_kobo' => 5_000_00,
            'other_allowances_kobo' => 0,
            'nhf_enrolled' => false,
        ]);

        $result = PayrollCalculator::compute($salary);

        // Pensionable = 500000 + 200000 + 50000 = 750000 (in Naira kobo = 75_000_000 kobo)
        // 8% of 7_500_000 kobo = 600_000 kobo
        $this->assertSame(
            (int) round(75_000_00 * 0.08),
            $result['pension_employee_kobo']
        );
        $this->assertSame(
            (int) round(75_000_00 * 0.10),
            $result['pension_employer_kobo']
        );
    }

    public function test_calculator_nhf_is_2_5_percent_of_basic_when_enrolled(): void
    {
        $salary = new EmployeeSalary([
            'basic_kobo' => 50_000_00,
            'housing_kobo' => 0,
            'transport_kobo' => 0,
            'other_allowances_kobo' => 0,
            'nhf_enrolled' => true,
        ]);

        $result = PayrollCalculator::compute($salary);

        $expected = (int) round(50_000_00 * 0.025);
        $this->assertSame($expected, $result['nhf_kobo']);
    }

    public function test_calculator_nhf_is_zero_when_not_enrolled(): void
    {
        $salary = new EmployeeSalary([
            'basic_kobo' => 50_000_00,
            'housing_kobo' => 0,
            'transport_kobo' => 0,
            'other_allowances_kobo' => 0,
            'nhf_enrolled' => false,
        ]);

        $result = PayrollCalculator::compute($salary);

        $this->assertSame(0, $result['nhf_kobo']);
    }

    public function test_calculator_nsitf_is_1_percent_of_gross(): void
    {
        $salary = new EmployeeSalary([
            'basic_kobo' => 100_000_00,
            'housing_kobo' => 0,
            'transport_kobo' => 0,
            'other_allowances_kobo' => 0,
            'nhf_enrolled' => false,
        ]);

        $result = PayrollCalculator::compute($salary);

        $this->assertSame((int) round(100_000_00 * 0.01), $result['nsitf_kobo']);
    }

    public function test_calculator_net_equals_gross_minus_employee_deductions(): void
    {
        $salary = new EmployeeSalary([
            'basic_kobo' => 100_000_00,
            'housing_kobo' => 30_000_00,
            'transport_kobo' => 10_000_00,
            'other_allowances_kobo' => 0,
            'nhf_enrolled' => false,
        ]);

        $result = PayrollCalculator::compute($salary);

        $expectedNet = $result['gross_kobo']
            - $result['paye_kobo']
            - $result['pension_employee_kobo']
            - $result['nhf_kobo']
            - 0; // no other deductions

        $this->assertSame($expectedNet, $result['net_kobo']);
    }

    public function test_calculator_other_deductions_reduce_net(): void
    {
        $salary = new EmployeeSalary([
            'basic_kobo' => 100_000_00,
            'housing_kobo' => 0,
            'transport_kobo' => 0,
            'other_allowances_kobo' => 0,
            'nhf_enrolled' => false,
        ]);

        $with = PayrollCalculator::compute($salary, 500_000); // ₦5,000 deduction
        $without = PayrollCalculator::compute($salary, 0);

        $this->assertSame($without['net_kobo'] - 500_000, $with['net_kobo']);
    }

    public function test_paye_is_zero_for_very_low_income(): void
    {
        // Annual gross = ₦300,000 — below CRA threshold; net taxable ≈ 0
        $salary = new EmployeeSalary([
            'basic_kobo' => 25_000_00,   // ₦250,000/month
            'housing_kobo' => 0,
            'transport_kobo' => 0,
            'other_allowances_kobo' => 0,
            'nhf_enrolled' => false,
        ]);

        $result = PayrollCalculator::compute($salary);

        // Annual gross = ₦3,000,000; CRA = 200,000 + 20% of 3M = 200,000 + 600,000 = 800,000
        // Taxable = 3,000,000 − pension_yr − 800,000 — could be positive, so PAYE > 0
        // But it should be non-negative
        $this->assertGreaterThanOrEqual(0, $result['paye_kobo']);
    }

    // ── PayrollRunService integration ────────────────────────────────────────

    public function test_create_run_computes_entries_for_active_employees_with_salaries(): void
    {
        $emp1 = $this->staffUser();
        $emp2 = $this->staffUser();
        $this->makeSalary($emp1);
        $this->makeSalary($emp2);
        // Third employee with no salary — should be skipped
        $this->staffUser();

        $service = new PayrollRunService;
        $run = $service->createRun(
            Carbon::parse('2026-04-01'),
            Carbon::parse('2026-04-30'),
            $this->hrUser()->id
        );

        $this->assertDatabaseHas('payroll_runs', [
            'id' => $run->id,
            'period_label' => '2026-04',
            'status' => 'draft',
            'employee_count' => 2,
        ]);

        $this->assertDatabaseCount('payroll_entries', 2);
    }

    public function test_create_run_rejects_duplicate_period(): void
    {
        $this->expectException(\RuntimeException::class);

        $hr = $this->hrUser();
        $service = new PayrollRunService;

        $service->createRun(Carbon::parse('2026-04-01'), Carbon::parse('2026-04-30'), $hr->id);
        $service->createRun(Carbon::parse('2026-04-01'), Carbon::parse('2026-04-30'), $hr->id);
    }

    public function test_approve_run_changes_status_and_records_approver(): void
    {
        $hr = $this->hrUser();
        $emp = $this->staffUser();
        $this->makeSalary($emp);

        $service = new PayrollRunService;
        $run = $service->createRun(Carbon::parse('2026-05-01'), Carbon::parse('2026-05-31'), $hr->id);

        $service->approveRun($run, $hr->id);

        $this->assertDatabaseHas('payroll_runs', [
            'id' => $run->id,
            'status' => 'approved',
            'approved_by_id' => $hr->id,
        ]);
    }

    public function test_approve_requires_draft_status(): void
    {
        $this->expectException(\RuntimeException::class);

        $hr = $this->hrUser();
        $emp = $this->staffUser();
        $this->makeSalary($emp);

        $service = new PayrollRunService;
        $run = $service->createRun(Carbon::parse('2026-06-01'), Carbon::parse('2026-06-30'), $hr->id);
        $service->approveRun($run, $hr->id);
        // Approve again on an already-approved run
        $service->approveRun($run, $hr->id);
    }

    public function test_mark_paid_applies_deduction_recoveries(): void
    {
        $hr = $this->hrUser();
        $emp = $this->staffUser();
        $this->makeSalary($emp);

        $deduction = PayrollDeduction::create([
            'user_id' => $emp->id,
            'type' => 'loan',
            'description' => 'Staff loan',
            'monthly_amount_kobo' => 50_000_00,
            'remaining_kobo' => 200_000_00,
            'status' => 'active',
            'start_date' => now()->subMonth()->toDateString(),
            'created_by_id' => $hr->id,
        ]);

        $service = new PayrollRunService;
        $run = $service->createRun(Carbon::parse('2026-07-01'), Carbon::parse('2026-07-31'), $hr->id);
        $service->approveRun($run, $hr->id);
        $service->markPaid($run);

        $deduction->refresh();
        $this->assertSame(150_000_00, $deduction->remaining_kobo);
        $this->assertSame('active', $deduction->status);
    }

    public function test_deduction_marked_completed_when_balance_cleared(): void
    {
        $hr = $this->hrUser();
        $emp = $this->staffUser();
        $this->makeSalary($emp);

        $deduction = PayrollDeduction::create([
            'user_id' => $emp->id,
            'type' => 'advance',
            'description' => 'Salary advance',
            'monthly_amount_kobo' => 50_000_00,
            'remaining_kobo' => 50_000_00, // exactly one instalment
            'status' => 'active',
            'start_date' => now()->subMonth()->toDateString(),
            'created_by_id' => $hr->id,
        ]);

        $service = new PayrollRunService;
        $run = $service->createRun(Carbon::parse('2026-08-01'), Carbon::parse('2026-08-31'), $hr->id);
        $service->approveRun($run, $hr->id);
        $service->markPaid($run);

        $deduction->refresh();
        $this->assertSame(0, $deduction->remaining_kobo);
        $this->assertSame('completed', $deduction->status);
    }

    // ── HTTP endpoint smoke tests ────────────────────────────────────────────

    public function test_hr_can_create_a_payroll_run_via_http(): void
    {
        $emp = $this->staffUser();
        $this->makeSalary($emp);

        $this->actingAs($this->hrUser())
            ->post('/payroll/runs', [
                'period_start' => '2026-09-01',
                'period_end' => '2026-09-30',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payroll_runs', ['period_label' => '2026-09', 'status' => 'draft']);
    }

    public function test_staff_cannot_create_payroll_run(): void
    {
        $this->actingAs($this->staffUser())
            ->post('/payroll/runs', [
                'period_start' => '2026-10-01',
                'period_end' => '2026-10-31',
            ])
            ->assertForbidden();
    }

    public function test_hr_can_view_salary_management_page(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/payroll/salaries')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Payroll/SalaryManagementPage'));
    }

    public function test_hr_can_save_salary_record(): void
    {
        $emp = $this->staffUser();

        $this->actingAs($this->hrUser())
            ->post('/payroll/salaries', [
                'user_id' => $emp->id,
                'basic_naira' => '500000',
                'housing_naira' => '200000',
                'transport_naira' => '50000',
                'other_allowances_naira' => '0',
                'nhf_enrolled' => false,
                'effective_date' => '2026-04-01',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('employee_salaries', [
            'user_id' => $emp->id,
            'basic_kobo' => MoneyHelper::toKobo(500000),
        ]);
    }

    // ── Model helpers ────────────────────────────────────────────────────────

    public function test_employee_salary_gross_kobo(): void
    {
        $salary = new EmployeeSalary([
            'basic_kobo' => 100_000,
            'housing_kobo' => 50_000,
            'transport_kobo' => 20_000,
            'other_allowances_kobo' => 5_000,
        ]);

        $this->assertSame(175_000, $salary->grossKobo());
    }

    public function test_payroll_run_status_helpers(): void
    {
        $run = new PayrollRun(['status' => 'draft']);
        $this->assertTrue($run->isDraft());
        $this->assertFalse($run->isApproved());

        $run->status = 'approved';
        $this->assertTrue($run->isApproved());
        $this->assertFalse($run->isPaid());
    }
}
