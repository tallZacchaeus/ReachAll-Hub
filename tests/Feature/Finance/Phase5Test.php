<?php

namespace Tests\Feature\Finance;

use App\Models\Finance\AccountCode;
use App\Models\Finance\CostCentre;
use App\Models\Finance\FinancialPeriod;
use App\Models\Finance\PeriodCloseWaiver;
use App\Models\Finance\Requisition;
use App\Models\Finance\Vendor;
use App\Models\User;
use App\Services\Finance\ClosedPeriodGuard;
use App\Services\Finance\PeriodCloser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Phase 5 feature tests.
 *
 *  1.  Finance dashboard accessible to finance role
 *  2.  Finance dashboard returns role-specific widgets
 *  3.  Reports page accessible to finance + management
 *  4.  Reports page inaccessible to plain staff
 *  5.  Excel export streams a file
 *  6.  ClosedPeriodGuard blocks writes to closed period
 *  7.  ClosedPeriodGuard allows CEO override on closed period
 *  8.  PeriodCloser::initiate() sets period to 'closing'
 *  9.  PeriodCloser::waive() records a waiver
 * 10.  PeriodCloser::coAuthorize() requires checklist clear
 * 11.  PeriodCloser::coAuthorize() rejects same-person as initiator
 * 12.  PeriodCloser::close() requires co-authorisation
 * 13.  Period-close initiate endpoint works
 * 14.  Period-close waive endpoint works
 * 15.  Go-live checklist page loads for superadmin
 * 16.  Go-live checklist page is 403 for non-superadmin
 * 17.  Help pages load without auth requirements
 * 18.  Demo seeder registers and runs without errors
 */
class Phase5Test extends TestCase
{
    use RefreshDatabase;

    // ── Fixtures ─────────────────────────────────────────────────────────────

    private function makeAdmin(): User
    {
        return User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
    }

    private function makeFinanceUser(): User
    {
        return User::factory()->create(['role' => 'finance', 'status' => 'active']);
    }

    private function makeCeo(): User
    {
        return User::factory()->create(['role' => 'ceo', 'status' => 'active']);
    }

    private function makeStaff(): User
    {
        return User::factory()->create(['role' => 'staff', 'status' => 'active']);
    }

    private function makeOpenPeriod(): FinancialPeriod
    {
        return FinancialPeriod::create([
            'year' => now()->year,
            'month' => now()->month,
            'status' => 'open',
            'opened_at' => now()->startOfMonth(),
        ]);
    }

    private function makeClosedPeriod(): FinancialPeriod
    {
        return FinancialPeriod::create([
            'year' => now()->subMonth()->year,
            'month' => now()->subMonth()->month,
            'status' => 'closed',
            'opened_at' => now()->subMonth()->startOfMonth(),
            'closed_at' => now()->subMonth()->endOfMonth(),
        ]);
    }

    private function makeRequisition(array $overrides = []): Requisition
    {
        static $seq = 0;
        $seq++;
        $admin = $this->makeAdmin();
        $vendor = Vendor::create(['name' => "V{$seq}", 'status' => 'active', 'created_by' => $admin->id]);
        $cc = CostCentre::create(['code' => "T{$seq}", 'name' => "T{$seq}", 'budget_kobo' => 100_000_000, 'status' => 'active', 'created_by' => $admin->id]);
        $ac = AccountCode::create(['code' => "A{$seq}", 'category' => '6000', 'description' => 'Test', 'tax_vat_applicable' => false, 'tax_wht_applicable' => false, 'status' => 'active', 'created_by' => $admin->id]);

        return Requisition::create(array_merge([
            'request_id' => "REQ5-{$seq}",
            'requester_id' => $admin->id,
            'type' => 'OPEX',
            'amount_kobo' => 10_000_000,
            'cost_centre_id' => $cc->id,
            'account_code_id' => $ac->id,
            'vendor_id' => $vendor->id,
            'description' => 'Test Phase 5 requisition',
            'status' => 'approved',
            'tax_vat_kobo' => 0,
            'tax_wht_kobo' => 0,
            'total_kobo' => 10_000_000,
            'created_by' => $admin->id,
        ], $overrides));
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    /** Finance user can access the dashboard */
    public function test_finance_dashboard_accessible_to_finance_role(): void
    {
        $user = $this->makeFinanceUser();
        $this->makeOpenPeriod();

        $response = $this->actingAs($user)->get('/finance/dashboard');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Finance/DashboardPage'));
    }

    /** Dashboard returns role-specific widget keys */
    public function test_finance_dashboard_returns_finance_widgets(): void
    {
        $user = $this->makeFinanceUser();
        $this->makeOpenPeriod();

        $response = $this->actingAs($user)->get('/finance/dashboard');

        $response->assertInertia(fn ($page) => $page->component('Finance/DashboardPage')
            ->has('widgets')
            ->where('user_role', 'finance')
        );
    }

    /** Staff can also access the dashboard (staff view) */
    public function test_staff_can_access_finance_dashboard(): void
    {
        $user = $this->makeStaff();
        $this->makeOpenPeriod();

        $response = $this->actingAs($user)->get('/finance/dashboard');

        $response->assertOk();
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    /** Finance user can access the reports page */
    public function test_reports_page_accessible_to_finance(): void
    {
        $user = $this->makeFinanceUser();

        $response = $this->actingAs($user)->get('/finance/reports');

        $response->assertOk();
        $response->assertInertia(fn ($p) => $p->component('Finance/ReportsPage'));
    }

    /** Staff cannot access reports */
    public function test_reports_page_forbidden_for_staff(): void
    {
        $user = $this->makeStaff();

        $response = $this->actingAs($user)->get('/finance/reports');

        $response->assertForbidden();
    }

    /** Excel export returns a downloadable response */
    public function test_excel_export_streams_file(): void
    {
        $user = $this->makeFinanceUser();

        $response = $this->actingAs($user)->get('/finance/reports/export/excel?report_type=budget_vs_actual');

        $response->assertOk();
        $this->assertStringContainsString(
            'spreadsheetml',
            $response->headers->get('content-type') ?? ''
        );
    }

    // ── ClosedPeriodGuard ─────────────────────────────────────────────────────

    /** Writing to a closed period throws a 422 */
    public function test_closed_period_guard_blocks_write(): void
    {
        $closed = $this->makeClosedPeriod();
        $user = $this->makeStaff();

        $date = now()->setYear($closed->year)->setMonth($closed->month)->startOfMonth();

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        ClosedPeriodGuard::assertWriteable($date, $user);
    }

    /** CEO with override flag is allowed to write to a closed period */
    public function test_closed_period_guard_allows_ceo_override(): void
    {
        $closed = $this->makeClosedPeriod();
        $ceo = $this->makeCeo();

        $date = now()->setYear($closed->year)->setMonth($closed->month)->startOfMonth();

        // Should not throw
        ClosedPeriodGuard::assertWriteable($date, $ceo, ceoOverride: true);
        $this->assertTrue(true); // reached here without exception
    }

    /** Open period allows any write */
    public function test_open_period_allows_write(): void
    {
        $this->makeOpenPeriod();
        $user = $this->makeStaff();

        ClosedPeriodGuard::assertWriteable(now(), $user);
        $this->assertTrue(true);
    }

    // ── PeriodCloser service ──────────────────────────────────────────────────

    /** Finance can initiate a period close */
    public function test_period_closer_initiate_sets_closing_status(): void
    {
        Notification::fake();

        $period = $this->makeOpenPeriod();
        $finance = $this->makeFinanceUser();

        PeriodCloser::initiate($period, $finance);

        $this->assertSame('closing', $period->fresh()->status);
        $this->assertSame($finance->id, $period->fresh()->close_initiated_by);
    }

    /** Waive adds a waiver record */
    public function test_period_closer_waive_records_waiver(): void
    {
        $period = $this->makeOpenPeriod();
        $finance = $this->makeFinanceUser();
        $period->update(['status' => 'closing', 'close_initiated_by' => $finance->id]);

        PeriodCloser::waive($period, 'unpaid_requisition', 999, 'Intentionally carried forward to next period.', $finance);

        $this->assertSame(1, PeriodCloseWaiver::where('financial_period_id', $period->id)->count());
    }

    /** Co-authoriser cannot be the same person as initiator */
    public function test_coauthorizer_must_differ_from_initiator(): void
    {
        $finance = $this->makeFinanceUser();
        $period = $this->makeOpenPeriod();
        $period->update(['status' => 'closing', 'close_initiated_by' => $finance->id]);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        PeriodCloser::coAuthorize($period, $finance);
    }

    /** Non-CEO/superadmin cannot co-authorise */
    public function test_only_ceo_or_superadmin_can_coauthorize(): void
    {
        $finance = $this->makeFinanceUser();
        $finance2 = $this->makeFinanceUser();
        $period = $this->makeOpenPeriod();
        $period->update(['status' => 'closing', 'close_initiated_by' => $finance->id]);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        PeriodCloser::coAuthorize($period, $finance2);
    }

    /** close() requires co_authorized_by to be set */
    public function test_close_requires_coauth(): void
    {
        $finance = $this->makeFinanceUser();
        $period = $this->makeOpenPeriod();
        $period->update(['status' => 'closing', 'close_initiated_by' => $finance->id]);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);

        PeriodCloser::close($period, $finance);
    }

    // ── Period close HTTP endpoints ───────────────────────────────────────────

    /** Finance can initiate close via POST /finance/period-close/initiate */
    public function test_period_close_initiate_endpoint(): void
    {
        Notification::fake();

        $period = $this->makeOpenPeriod();
        $finance = $this->makeFinanceUser();

        $response = $this->actingAs($finance)
            ->post('/finance/period-close/initiate', ['period_id' => $period->id]);

        $response->assertRedirect('/finance/period-close');
        $this->assertSame('closing', $period->fresh()->status);
    }

    /** Finance can waive an item via POST /finance/period-close/waive */
    public function test_period_close_waive_endpoint(): void
    {
        $finance = $this->makeFinanceUser();
        $period = $this->makeOpenPeriod();
        $period->update(['status' => 'closing', 'close_initiated_by' => $finance->id]);

        $response = $this->actingAs($finance)
            ->post('/finance/period-close/waive', [
                'period_id' => $period->id,
                'item_type' => 'variance_item',
                'item_id' => 1,
                'reason' => 'Accepted variance within tolerance for period end.',
            ]);

        $response->assertRedirect();
        $this->assertSame(1, PeriodCloseWaiver::count());
    }

    // ── Go-live checklist ─────────────────────────────────────────────────────

    /** Superadmin can view the go-live checklist */
    public function test_go_live_checklist_loads_for_superadmin(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin)->get('/finance/go-live');

        $response->assertOk();
        $response->assertInertia(fn ($p) => $p->component('Finance/GoLiveChecklistPage')
            ->has('checks')
        );
    }

    /** Non-superadmin cannot access go-live checklist */
    public function test_go_live_checklist_forbidden_for_non_superadmin(): void
    {
        $finance = $this->makeFinanceUser();

        $response = $this->actingAs($finance)->get('/finance/go-live');

        $response->assertForbidden();
    }

    // ── Help pages ────────────────────────────────────────────────────────────

    /** Help pages load for the appropriate roles (CAT1-01 fix) */
    public function test_help_pages_load(): void
    {
        // getting-started: any authenticated user may access
        $staff = $this->makeStaff();
        $this->actingAs($staff)->get('/finance/help/getting-started')->assertOk();

        // approvers: management and above (staff is blocked)
        $this->actingAs($staff)->get('/finance/help/approvers')->assertForbidden();
        $mgmt = User::factory()->create(['role' => 'management', 'status' => 'active']);
        $this->actingAs($mgmt)->get('/finance/help/approvers')->assertOk();

        // finance-team: finance/ceo/general_management/superadmin only
        $this->actingAs($staff)->get('/finance/help/finance-team')->assertForbidden();
        $this->actingAs($mgmt)->get('/finance/help/finance-team')->assertForbidden();
        $finance = $this->makeFinanceUser();
        $this->actingAs($finance)->get('/finance/help/finance-team')->assertOk();
    }

    // ── Demo seeder ───────────────────────────────────────────────────────────

    /** FinanceTransactionSeeder can be resolved from the container */
    public function test_finance_transaction_seeder_resolves(): void
    {
        $seeder = app(\Database\Seeders\Finance\FinanceTransactionSeeder::class);
        $this->assertInstanceOf(\Database\Seeders\Finance\FinanceTransactionSeeder::class, $seeder);
    }
}
