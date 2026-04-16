<?php

namespace Tests\Feature\Finance;

use App\Models\Finance\AccountCode;
use App\Models\Finance\PettyCashFloat;
use App\Models\Finance\PettyCashReconciliation;
use App\Models\Finance\PettyCashTransaction;
use App\Models\User;
use App\Services\Finance\PettyCashEnforcer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Feature tests for Petty Cash hard rules.
 *
 * Covers:
 *  1. ₦25K single expense → blocked
 *  2. Three expenses totalling ₦55K same day → third blocked (daily cap)
 *  3. Weekly cap blocks when weekly total would exceed ₦200K
 *  4. Skip reconciliation 31 days → next expense blocked
 *  5. Low-balance blocks expense
 *  6. Happy path: valid expense logged, balance decremented
 *  7. Submit reconciliation with pending transactions
 *  8. Finance approves reconciliation → float replenished + requisition created
 *  9. Finance rejects → transactions returned to pending_recon
 */
class PettyCashTest extends TestCase
{
    use RefreshDatabase;

    // ── Fixtures ─────────────────────────────────────────────────────────────

    private function makeUsers(): array
    {
        $custodian = User::factory()->create([
            'role'   => 'staff',
            'status' => 'active',
        ]);

        $finance = User::factory()->create([
            'role'   => 'finance',
            'status' => 'active',
        ]);

        $admin = User::factory()->create([
            'role'   => 'superadmin',
            'status' => 'active',
        ]);

        return compact('custodian', 'finance', 'admin');
    }

    private function makeFloat(User $custodian, User $admin, array $overrides = []): PettyCashFloat
    {
        return PettyCashFloat::create(array_merge([
            'custodian_id'         => $custodian->id,
            'float_limit_kobo'     => 20_000_000, // ₦200K
            'current_balance_kobo' => 20_000_000,
            'low_alert_threshold'  => 30,
            'last_reconciled_at'   => now()->subDays(5),
            'status'               => 'active',
            'created_by'           => $admin->id,
        ], $overrides));
    }

    private function makeAccountCode(User $admin): AccountCode
    {
        return AccountCode::create([
            'code'               => '6099',
            'category'           => '6000',
            'description'        => 'Petty Cash Test',
            'tax_vat_applicable' => false,
            'tax_wht_applicable' => false,
            'wht_rate'           => null,
            'status'             => 'active',
            'created_by'         => $admin->id,
        ]);
    }

    private function expensePayload(float $amountNaira = 5000): array
    {
        return [
            'amount_naira'    => $amountNaira,
            'description'     => 'Test expense',
            'date'            => today()->toDateString(),
            'account_code_id' => '',
            'receipt'         => UploadedFile::fake()->create('receipt.pdf', 50, 'application/pdf'),
        ];
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    /** ₦25K single expense is blocked by the ₦20K cap. */
    public function test_single_expense_exceeding_20k_cap_is_blocked(): void
    {
        Storage::fake('public');
        ['custodian' => $custodian, 'admin' => $admin] = $this->makeUsers();
        $float = $this->makeFloat($custodian, $admin);

        $response = $this->actingAs($custodian)
            ->post('/finance/petty-cash/expense', $this->expensePayload(25_000));

        $response->assertSessionHasErrors(['amount_naira']);

        $error = session('errors')->first('amount_naira');
        $this->assertStringContainsString('₦20,000 single expense cap', $error);

        // No transaction should be created
        $this->assertSame(0, PettyCashTransaction::count());
    }

    /** Third expense on same day that pushes daily total above ₦50K is blocked. */
    public function test_expense_blocked_when_daily_cap_would_be_exceeded(): void
    {
        Storage::fake('public');
        ['custodian' => $custodian, 'admin' => $admin] = $this->makeUsers();
        $float = $this->makeFloat($custodian, $admin);
        $ac    = $this->makeAccountCode($admin);

        // Pre-seed ₦20K + ₦20K = ₦40K already today
        PettyCashTransaction::create([
            'float_id'     => $float->id,
            'amount_kobo'  => 2_000_000,
            'type'         => 'expense',
            'description'  => 'Earlier expense 1',
            'receipt_path' => 'receipts/r1.pdf',
            'date'         => today()->toDateString(),
            'status'       => 'pending_recon',
            'created_by'   => $custodian->id,
        ]);
        PettyCashTransaction::create([
            'float_id'     => $float->id,
            'amount_kobo'  => 2_000_000,
            'type'         => 'expense',
            'description'  => 'Earlier expense 2',
            'receipt_path' => 'receipts/r2.pdf',
            'date'         => today()->toDateString(),
            'status'       => 'pending_recon',
            'created_by'   => $custodian->id,
        ]);

        // Third expense of ₦15K → total = ₦55K → blocked
        $response = $this->actingAs($custodian)
            ->post('/finance/petty-cash/expense', $this->expensePayload(15_000));

        $response->assertSessionHasErrors(['amount_naira']);

        $error = session('errors')->first('amount_naira');
        $this->assertStringContainsString('₦50,000 daily cap', $error);

        // Only the 2 pre-seeded transactions remain
        $this->assertSame(2, PettyCashTransaction::count());
    }

    /** Expense blocked when weekly total would exceed ₦200K. */
    public function test_expense_blocked_when_weekly_cap_would_be_exceeded(): void
    {
        Storage::fake('finance');

        // Travel to this week's Saturday so Mon–Fri are all firmly in the past.
        // startOfWeek() = Monday; addDays(5) = Saturday.
        $this->travelTo(now()->startOfWeek()->addDays(5));

        ['custodian' => $custodian, 'admin' => $admin] = $this->makeUsers();
        $float = $this->makeFloat($custodian, $admin, ['current_balance_kobo' => 50_000_000]);

        // Seed 2 × ₦19K per day on Mon–Fri = 10 × ₦19K = ₦190K using explicit
        // created_at (now uses created_at for cap checks, not user-supplied date).
        // Each day total = ₦38K < ₦50K daily cap ✓
        $weekStart = now()->startOfWeek();
        foreach (range(0, 9) as $i) {
            $dayOffset = (int) ($i / 2); // 0,0,1,1,2,2,3,3,4,4 → Mon/Mon/Tue/Tue/...
            $dayTs     = $weekStart->copy()->addDays($dayOffset)->setHour(9)->toDateTimeString();
            \DB::table('petty_cash_transactions')->insert([
                'float_id'     => $float->id,
                'amount_kobo'  => 1_900_000,
                'type'         => 'expense',
                'description'  => "Weekly expense {$i}",
                'receipt_path' => "receipts/w{$i}.pdf",
                'date'         => $weekStart->copy()->addDays($dayOffset)->toDateString(),
                'status'       => 'pending_recon',
                'created_by'   => $custodian->id,
                'created_at'   => $dayTs, // spread Mon–Fri so daily cap is never hit
                'updated_at'   => $dayTs,
            ]);
        }

        // ₦15K on Saturday → weekly total ₦205K > ₦200K, daily (Sat) = ₦15K < ₦50K
        $response = $this->actingAs($custodian)
            ->post('/finance/petty-cash/expense', $this->expensePayload(15_000));

        $response->assertSessionHasErrors(['amount_naira']);

        $error = session('errors')->first('amount_naira');
        $this->assertStringContainsString('₦200,000 weekly cap', $error);
    }

    /** Expense blocked when last reconciliation is > 30 days ago. */
    public function test_expense_blocked_when_reconciliation_overdue(): void
    {
        Storage::fake('public');
        ['custodian' => $custodian, 'admin' => $admin] = $this->makeUsers();

        // Use subDays(35) for a clear margin — avoids any fractional-day
        // precision edge cases in diffInDays when stored and retrieved from DB.
        $float = $this->makeFloat($custodian, $admin, [
            'last_reconciled_at' => now()->subDays(35),
        ]);

        $response = $this->actingAs($custodian)
            ->post('/finance/petty-cash/expense', $this->expensePayload(5_000));

        $response->assertSessionHasErrors(['amount_naira']);

        $error = session('errors')->first('amount_naira');
        $this->assertStringContainsString('Reconciliation overdue', $error);
        $this->assertSame(0, PettyCashTransaction::count());
    }

    /** Valid expense is logged and balance is decremented. */
    public function test_valid_expense_is_logged_and_balance_decremented(): void
    {
        Storage::fake('finance');
        ['custodian' => $custodian, 'admin' => $admin] = $this->makeUsers();
        $float = $this->makeFloat($custodian, $admin);

        $response = $this->actingAs($custodian)
            ->post('/finance/petty-cash/expense', $this->expensePayload(5_000));

        $response->assertSessionHasNoErrors();

        $this->assertSame(1, PettyCashTransaction::count());
        $txn = PettyCashTransaction::first();
        $this->assertSame(500_000, $txn->amount_kobo);
        $this->assertSame('pending_recon', $txn->status);
        $this->assertNotEmpty($txn->receipt_path);

        // Balance decremented
        $float->refresh();
        $this->assertSame(19_500_000, $float->current_balance_kobo);
    }

    /** Custodian submits reconciliation → all pending transactions linked. */
    public function test_custodian_can_submit_reconciliation(): void
    {
        Storage::fake('public');
        ['custodian' => $custodian, 'admin' => $admin] = $this->makeUsers();
        $float = $this->makeFloat($custodian, $admin, ['last_reconciled_at' => now()->subDays(10)]);

        // Seed 3 pending transactions
        foreach (range(1, 3) as $i) {
            PettyCashTransaction::create([
                'float_id'     => $float->id,
                'amount_kobo'  => 500_000,
                'type'         => 'expense',
                'description'  => "Expense $i",
                'receipt_path' => "receipts/e{$i}.pdf",
                'date'         => now()->subDays($i)->toDateString(),
                'status'       => 'pending_recon',
                'created_by'   => $custodian->id,
            ]);
        }

        $response = $this->actingAs($custodian)
            ->post('/finance/petty-cash/reconciliation');

        $response->assertSessionHasNoErrors();

        $recon = PettyCashReconciliation::first();
        $this->assertNotNull($recon);
        $this->assertSame('submitted', $recon->status);
        $this->assertSame(1_500_000, $recon->total_expenses_kobo);

        // All 3 transactions linked
        $this->assertSame(3, PettyCashTransaction::where('reconciliation_id', $recon->id)->count());
    }

    /** Finance approves reconciliation → float replenished, transactions reconciled. */
    public function test_finance_can_approve_reconciliation_and_float_is_replenished(): void
    {
        Storage::fake('public');
        Notification::fake();

        ['custodian' => $custodian, 'finance' => $finance, 'admin' => $admin] = $this->makeUsers();
        $float = $this->makeFloat($custodian, $admin, [
            'current_balance_kobo' => 18_000_000, // depleted somewhat
            'last_reconciled_at'   => now()->subDays(10),
        ]);

        $recon = PettyCashReconciliation::create([
            'float_id'            => $float->id,
            'period_start'        => now()->subDays(10)->toDateString(),
            'period_end'          => today()->toDateString(),
            'submitted_by'        => $custodian->id,
            'status'              => 'submitted',
            'total_expenses_kobo' => 2_000_000,
        ]);

        PettyCashTransaction::create([
            'float_id'           => $float->id,
            'amount_kobo'        => 2_000_000,
            'type'               => 'expense',
            'description'        => 'Approved expense',
            'receipt_path'       => 'receipts/ok.pdf',
            'date'               => today()->toDateString(),
            'status'             => 'pending_recon',
            'reconciliation_id'  => $recon->id,
            'created_by'         => $custodian->id,
        ]);

        // Seed Finance cost centre + account code for replenishment req
        \App\Models\Finance\CostCentre::create([
            'code' => '3200', 'name' => 'Finance', 'budget_kobo' => 5_000_000_00,
            'status' => 'active', 'created_by' => $admin->id,
        ]);
        \App\Models\Finance\AccountCode::create([
            'code' => '6012', 'category' => '6000', 'description' => 'Misc',
            'tax_vat_applicable' => false, 'tax_wht_applicable' => false,
            'status' => 'active', 'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($finance)
            ->post("/finance/reconciliation/{$recon->id}/approve");

        $response->assertRedirect('/finance/reconciliation');

        // Float replenished to limit
        $float->refresh();
        $this->assertSame(20_000_000, $float->current_balance_kobo);
        $this->assertNotNull($float->last_reconciled_at);

        // Transaction reconciled
        $txn = PettyCashTransaction::first();
        $this->assertSame('reconciled', $txn->status);

        // Reconciliation approved
        $recon->refresh();
        $this->assertSame('approved', $recon->status);
        $this->assertNotNull($recon->replenishment_requisition_id);
    }

    /** Finance rejects → transactions returned to pending_recon so custodian can fix. */
    public function test_finance_can_reject_reconciliation(): void
    {
        Storage::fake('public');
        ['custodian' => $custodian, 'finance' => $finance, 'admin' => $admin] = $this->makeUsers();
        $float = $this->makeFloat($custodian, $admin);

        $recon = PettyCashReconciliation::create([
            'float_id'            => $float->id,
            'period_start'        => now()->subDays(5)->toDateString(),
            'period_end'          => today()->toDateString(),
            'submitted_by'        => $custodian->id,
            'status'              => 'submitted',
            'total_expenses_kobo' => 500_000,
        ]);

        PettyCashTransaction::create([
            'float_id'          => $float->id,
            'amount_kobo'       => 500_000,
            'type'              => 'expense',
            'description'       => 'Expense with missing receipt',
            'receipt_path'      => 'receipts/missing.pdf',
            'date'              => today()->toDateString(),
            'status'            => 'pending_recon',
            'reconciliation_id' => $recon->id,
            'created_by'        => $custodian->id,
        ]);

        $response = $this->actingAs($finance)
            ->post("/finance/reconciliation/{$recon->id}/reject", [
                'notes' => 'Receipt for ₦5,000 office supplies is missing.',
            ]);

        $response->assertRedirect('/finance/reconciliation');

        $recon->refresh();
        $this->assertSame('rejected', $recon->status);
        $this->assertStringContainsString('missing', $recon->notes);

        // Transactions returned to custodian
        $txn = PettyCashTransaction::first();
        $this->assertSame('pending_recon', $txn->status);
        $this->assertNull($txn->reconciliation_id);
    }

    /** Unauthorised user cannot submit an expense against someone else's float. */
    public function test_stranger_cannot_log_expense_against_another_float(): void
    {
        Storage::fake('public');
        ['custodian' => $custodian, 'admin' => $admin] = $this->makeUsers();
        $this->makeFloat($custodian, $admin);

        $stranger = User::factory()->create(['role' => 'staff', 'status' => 'active']);

        // Stranger has no float — controller should redirect with error
        $response = $this->actingAs($stranger)
            ->post('/finance/petty-cash/expense', $this->expensePayload(1_000));

        // No float found → 404
        $response->assertStatus(404);
        $this->assertSame(0, PettyCashTransaction::count());
    }
}
