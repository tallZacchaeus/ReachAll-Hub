<?php

namespace Tests\Feature;

use App\Jobs\Finance\PostLedgerEntry;
use App\Models\Finance\AccountCode;
use App\Models\Finance\ApprovalStep;
use App\Models\Finance\CostCentre;
use App\Models\Finance\FinanceAuditLog;
use App\Models\Finance\FinancialPeriod;
use App\Models\Finance\Payment;
use App\Models\Finance\Requisition;
use App\Models\Finance\Vendor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Sprint 2 regression tests — security and financial integrity audit findings.
 *
 * Fix 1 (CAT1-07–09): Session secure/encrypt defaults (config-level — no runtime test).
 * Fix 2 (CAT3-01/02): Financial entities archived not deleted; FK restrictOnDelete.
 * Fix 3 (CAT3-03):    FinanceAuditLog is immutable — updates and deletes throw LogicException.
 * Fix 4 (CAT2-01):    Self-approval prevention — requester never in their own approval chain.
 * Fix 5 (CAT8-02):    Double-submit prevention — already-paid requisition returns error.
 * Fix 6 (CAT2-09):    Closed-period guard in PostLedgerEntry job — job fails, no ledger entry.
 * Fix 7 (CAT2-08):    CEO override reason minimum 20 chars.
 */
class Sprint2RegressionTest extends TestCase
{
    use RefreshDatabase;

    // ── Fixtures ─────────────────────────────────────────────────────────────

    private function makeFinanceAdmin(): User
    {
        return User::factory()->create(['role' => 'finance', 'status' => 'active']);
    }

    private function makeStaff(): User
    {
        return User::factory()->create(['role' => 'staff', 'status' => 'active']);
    }

    private function makeCeo(): User
    {
        return User::factory()->create(['role' => 'ceo', 'status' => 'active']);
    }

    private static int $seq = 0;

    private function makeVendor(User $creator, string $status = 'active'): Vendor
    {
        self::$seq++;

        return Vendor::create([
            'name' => 'Vendor S2-'.self::$seq,
            'status' => $status,
            'created_by' => $creator->id,
        ]);
    }

    private function makeRequisition(User $requester, array $overrides = []): Requisition
    {
        self::$seq++;
        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
        $vendor = Vendor::create(['name' => 'RV-'.self::$seq, 'status' => 'active', 'created_by' => $admin->id]);
        $cc = CostCentre::create(['code' => 'S2'.str_pad((string) self::$seq, 2, '0', STR_PAD_LEFT), 'name' => 'S2-'.self::$seq, 'budget_kobo' => 100_000_000_00, 'status' => 'active', 'created_by' => $admin->id]);
        $ac = AccountCode::create(['code' => 'S2A'.self::$seq, 'category' => '6000', 'description' => 'S2 Test', 'tax_vat_applicable' => false, 'tax_wht_applicable' => false, 'status' => 'active', 'created_by' => $admin->id]);

        return Requisition::create(array_merge([
            'request_id' => 'REQS2-'.self::$seq,
            'requester_id' => $requester->id,
            'type' => 'OPEX',
            'amount_kobo' => 5_000_000,
            'currency' => 'NGN',
            'exchange_rate' => 1.0,
            'cost_centre_id' => $cc->id,
            'account_code_id' => $ac->id,
            'vendor_id' => $vendor->id,
            'urgency' => 'standard',
            'description' => 'Sprint 2 regression test requisition.',
            'status' => 'approved',
            'tax_vat_kobo' => 0,
            'tax_wht_kobo' => 0,
            'total_kobo' => 5_000_000,
            'created_by' => $requester->id,
            'submitted_at' => now(),
        ], $overrides));
    }

    // ── Fix 2: Financial entity archival (not deletion) ──────────────────────

    /**
     * DELETE /finance/admin/vendors/{id} archives the vendor (status = 'archived')
     * instead of hard-deleting it.
     */
    public function test_vendor_destroy_archives_instead_of_deleting(): void
    {
        $finance = $this->makeFinanceAdmin();
        $vendor = $this->makeVendor($finance);

        $response = $this->actingAs($finance)
            ->delete(route('finance.vendors.destroy', $vendor->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Record still exists in DB
        $this->assertDatabaseHas('vendors', ['id' => $vendor->id, 'status' => 'archived']);
        // Record is NOT physically gone
        $this->assertNotNull(Vendor::find($vendor->id));
    }

    /**
     * DELETE /finance/admin/vendors/{id} on a vendor that has requisitions → archived, not deleted.
     * The restrictOnDelete FK constraint would block a hard delete anyway.
     */
    public function test_vendor_with_requisitions_is_archived_not_deleted(): void
    {
        $finance = $this->makeFinanceAdmin();
        $staff = $this->makeStaff();
        $vendor = $this->makeVendor($finance);

        // Create a requisition linked to this vendor
        $req = $this->makeRequisition($staff, ['vendor_id' => $vendor->id]);

        $response = $this->actingAs($finance)
            ->delete(route('finance.vendors.destroy', $vendor->id));

        $response->assertRedirect();

        // Vendor is still in the DB, archived
        $this->assertDatabaseHas('vendors', ['id' => $vendor->id, 'status' => 'archived']);
        // The requisition's FK is still intact
        $this->assertDatabaseHas('requisitions', ['id' => $req->id, 'vendor_id' => $vendor->id]);
    }

    /**
     * DELETE /finance/admin/cost-centres/{id} archives the cost centre.
     */
    public function test_cost_centre_destroy_archives_instead_of_deleting(): void
    {
        $finance = $this->makeFinanceAdmin();

        $cc = CostCentre::create([
            'code' => '8888',
            'name' => 'Archive Test CC',
            'budget_kobo' => 1_000_000,
            'status' => 'active',
            'created_by' => $finance->id,
        ]);

        $response = $this->actingAs($finance)
            ->delete(route('finance.cost-centres.destroy', $cc->id));

        $response->assertRedirect();
        $this->assertDatabaseHas('cost_centres', ['id' => $cc->id, 'status' => 'archived']);
        $this->assertNotNull(CostCentre::find($cc->id));
    }

    // ── Fix 3: FinanceAuditLog immutability ───────────────────────────────────

    /**
     * Attempting to update an audit log entry throws LogicException.
     */
    public function test_audit_log_update_throws_logic_exception(): void
    {
        FinanceAuditLog::insert([
            'user_id' => null,
            'model_type' => Requisition::class,
            'model_id' => 1,
            'action' => 'created',
            'logged_at' => now()->toDateTimeString(),
        ]);

        $entry = FinanceAuditLog::first();
        $this->assertNotNull($entry);

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('immutable');

        $entry->update(['action' => 'tampered']);
    }

    /**
     * Attempting to delete an audit log entry throws LogicException.
     */
    public function test_audit_log_delete_throws_logic_exception(): void
    {
        FinanceAuditLog::insert([
            'user_id' => null,
            'model_type' => Requisition::class,
            'model_id' => 1,
            'action' => 'created',
            'logged_at' => now()->toDateTimeString(),
        ]);

        $entry = FinanceAuditLog::first();
        $this->assertNotNull($entry);

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('immutable');

        $entry->delete();
    }

    // ── Fix 4: Self-approval prevention ──────────────────────────────────────

    /**
     * When the requester is also the cost centre head, they must NOT appear
     * in their own approval chain. The ApprovalRouter must resolve a different approver.
     */
    public function test_requester_who_is_cost_centre_head_is_not_their_own_approver(): void
    {
        // User is management (potential approver) AND cost centre head
        $requester = User::factory()->create([
            'role' => 'management',
            'department' => 'IT & Digital',
            'status' => 'active',
        ]);

        // Another management user in the same department who can be the fallback approver
        User::factory()->create([
            'role' => 'management',
            'department' => 'IT & Digital',
            'status' => 'active',
        ]);

        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);

        // Cost centre with the requester as head
        $cc = CostCentre::create([
            'code' => '9991',
            'name' => 'Self-Approval Test CC',
            'budget_kobo' => 100_000_000_00,
            'status' => 'active',
            'head_user_id' => $requester->id,   // requester IS the cost centre head
            'created_by' => $admin->id,
        ]);

        $ac = AccountCode::create([
            'code' => '9S01',
            'category' => '9000',
            'description' => 'Self-Approval Test AC',
            'tax_vat_applicable' => false,
            'tax_wht_applicable' => false,
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        $vendor = Vendor::create(['name' => 'Self-Approval Vendor', 'status' => 'active', 'created_by' => $admin->id]);

        Storage::fake('public');

        $response = $this->actingAs($requester)
            ->post(route('finance.requisitions.store'), [
                'type' => 'OPEX',
                'amount_naira' => 50_000,      // ₦50K → Line Manager tier
                'currency' => 'NGN',
                'exchange_rate' => '1',
                'cost_centre_id' => $cc->id,
                'account_code_id' => $ac->id,
                'vendor_id' => $vendor->id,
                'urgency' => 'standard',
                'description' => 'Self-approval prevention test requisition for Sprint 2.',
                'supporting_docs' => [
                    \Illuminate\Http\UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
                ],
            ]);

        $response->assertRedirect();

        $req = Requisition::where('requester_id', $requester->id)->first();
        $steps = ApprovalStep::where('requisition_id', $req->id)->get();

        $this->assertNotEmpty($steps, 'At least one approval step should have been created.');

        foreach ($steps as $step) {
            $this->assertNotEquals(
                $requester->id,
                $step->approver_id,
                "Requester (id={$requester->id}) must not be their own approver in any step."
            );
        }
    }

    // ── Fix 5: Double-submit prevention ──────────────────────────────────────

    /**
     * Attempting to pay an already-paid requisition returns a redirect with an error flash.
     */
    public function test_already_paid_requisition_returns_error_on_second_pay_attempt(): void
    {
        Storage::fake('public');

        $finance = $this->makeFinanceAdmin();
        $staff = $this->makeStaff();
        $req = $this->makeRequisition($staff, ['status' => 'paid']);  // already paid

        $response = $this->actingAs($finance)
            ->post(route('finance.payments.pay', $req->id), [
                'method' => 'bank_transfer',
                'reference' => 'TRN-DOUBLE-001',
                'paid_at' => now()->toDateString(),
                'proof' => \Illuminate\Http\UploadedFile::fake()->create('proof.pdf', 50, 'application/pdf'),
            ]);

        // Should redirect back with an error, not process the payment
        $response->assertRedirect();
        $response->assertSessionHas('error');

        // No payment record should have been created
        $this->assertDatabaseMissing('payments', ['requisition_id' => $req->id]);
    }

    /**
     * Attempting to pay an already-posted requisition also returns an error.
     */
    public function test_already_posted_requisition_returns_error_on_pay_attempt(): void
    {
        Storage::fake('public');

        $finance = $this->makeFinanceAdmin();
        $staff = $this->makeStaff();
        $req = $this->makeRequisition($staff, ['status' => 'posted']);

        $response = $this->actingAs($finance)
            ->post(route('finance.payments.pay', $req->id), [
                'method' => 'bank_transfer',
                'reference' => 'TRN-DOUBLE-002',
                'paid_at' => now()->toDateString(),
                'proof' => \Illuminate\Http\UploadedFile::fake()->create('proof.pdf', 50, 'application/pdf'),
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('payments', ['requisition_id' => $req->id]);
    }

    // ── Fix 6: Closed period guard in queued jobs ─────────────────────────────

    /**
     * PostLedgerEntry short-circuits (no ledger entry, no exception propagated) when
     * the requisition's financial period is closed. $this->fail() marks the job as
     * permanently failed in the queue worker — outside that context it returns early.
     */
    public function test_post_ledger_entry_short_circuits_for_closed_period(): void
    {
        $finance = $this->makeFinanceAdmin();
        $staff = $this->makeStaff();

        $period = FinancialPeriod::create([
            'year' => now()->subMonth()->year,
            'month' => now()->subMonth()->month,
            'status' => 'open',
            'opened_at' => now()->subMonth()->startOfMonth(),
        ]);

        $req = $this->makeRequisition($staff, [
            'financial_period_id' => $period->id,
            'status' => 'paid',
        ]);

        Storage::fake('public');

        $payment = Payment::create([
            'requisition_id' => $req->id,
            'amount_kobo' => $req->total_kobo,
            'method' => 'bank_transfer',
            'reference' => 'TRN-PERIOD-001',
            'paid_at' => now(),
            'paid_by' => $finance->id,
            'proof_path' => 'finance/payments/test.pdf',
        ]);

        // Close the period BEFORE the job runs
        $period->update(['status' => 'closed', 'closed_at' => now()]);

        // handle() should return early (no exception bubbles out in direct calls)
        (new PostLedgerEntry($payment->id))->handle();

        // Assert the job did NOT create a ledger entry — that is the observable guard
        $this->assertDatabaseMissing('ledger_entries', ['payment_id' => $payment->id]);
        // Requisition should NOT have been advanced to 'posted'
        $req->refresh();
        $this->assertNotSame('posted', $req->status, 'Requisition must not be marked posted when period is closed.');
    }

    /**
     * After PostLedgerEntry fails on a closed period, no LedgerEntry is created.
     */
    public function test_no_ledger_entry_created_when_period_is_closed(): void
    {
        $finance = $this->makeFinanceAdmin();
        $staff = $this->makeStaff();

        $period = FinancialPeriod::create([
            'year' => 2025,
            'month' => 12,
            'status' => 'closed',
            'opened_at' => '2025-12-01',
            'closed_at' => '2025-12-31',
        ]);

        $req = $this->makeRequisition($staff, [
            'financial_period_id' => $period->id,
            'status' => 'paid',
        ]);

        Storage::fake('public');

        $payment = Payment::create([
            'requisition_id' => $req->id,
            'amount_kobo' => $req->total_kobo,
            'method' => 'bank_transfer',
            'reference' => 'TRN-PERIOD-002',
            'paid_at' => now(),
            'paid_by' => $finance->id,
            'proof_path' => 'finance/payments/test2.pdf',
        ]);

        try {
            (new PostLedgerEntry($payment->id))->handle();
        } catch (\Illuminate\Queue\ManuallyFailedException $e) {
            // Expected — job correctly refused to post
        }

        // No ledger entry should exist
        $this->assertDatabaseMissing('ledger_entries', ['payment_id' => $payment->id]);
    }

    // ── Fix 7: CEO override reason minimum length ─────────────────────────────

    /**
     * CEO budget override with reason < 20 chars → 422 validation error.
     */
    public function test_ceo_override_reason_too_short_is_rejected(): void
    {
        $ceo = $this->makeCeo();
        $step = $this->makeBudgetOverrideStep($ceo);

        $response = $this->actingAs($ceo)
            ->withHeaders(['Accept' => 'application/json'])
            ->post(route('finance.approvals.decide', $step->id), [
                'action' => 'approve',
                'override_reason' => 'ok',   // 2 chars — way below min:20
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['override_reason']);
    }

    /**
     * CEO budget override with reason = 25 chars (≥ 20) → passes validation.
     */
    public function test_ceo_override_reason_25_chars_is_accepted(): void
    {
        $ceo = $this->makeCeo();
        $step = $this->makeBudgetOverrideStep($ceo);

        $response = $this->actingAs($ceo)
            ->withHeaders(['Accept' => 'application/json'])
            ->post(route('finance.approvals.decide', $step->id), [
                'action' => 'approve',
                'override_reason' => 'This justification is long enough',  // > 20 chars
            ]);

        // Any non-422 status means validation passed (may redirect or return 200)
        if ($response->status() === 422) {
            $response->assertJsonMissingValidationErrors(['override_reason']);
        }
        $this->assertNotSame(422, $response->status(), 'A 25+ char override reason must pass validation.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Create a budget-override ApprovalStep assigned to the given approver.
     */
    private function makeBudgetOverrideStep(User $approver): ApprovalStep
    {
        $staff = $this->makeStaff();
        $req = $this->makeRequisition($staff, ['budget_override_required' => true]);

        return ApprovalStep::create([
            'requisition_id' => $req->id,
            'approver_id' => $approver->id,
            'level' => 99,
            'role_label' => 'CEO Budget Override',
            'status' => 'pending',
            'is_budget_override' => true,
            'sla_deadline' => now()->addHours(48),
        ]);
    }
}
