<?php

namespace Tests\Feature\Finance;

use App\Models\Finance\AccountCode;
use App\Models\Finance\ApprovalStep;
use App\Models\Finance\CostCentre;
use App\Models\Finance\GoodsReceipt;
use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Models\Finance\Requisition;
use App\Models\Finance\Vendor;
use App\Models\User;
use App\Services\Finance\BudgetEnforcer;
use App\Services\Finance\TaxCalculator;
use App\Services\Finance\ThreeWayMatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Phase 4 feature tests.
 *
 *  1. ThreeWayMatcher — ₦600,050 invoice vs ₦600K req → matched (within ₦100 tolerance)
 *  2. ThreeWayMatcher — ₦650K invoice vs ₦600K req → variance flagged
 *  3. ThreeWayMatcher — vendor mismatch → blocked
 *  4. BudgetEnforcer  — cost centre at 95%, new ₦100K → block_100
 *  5. BudgetEnforcer  — cost centre at 75%, new ₦10K  → warn_80
 *  6. TaxCalculator   — WHT 10% on ₦1M → ₦100K withheld
 *  7. TaxCalculator   — VAT 7.5% on ₦1M → ₦75K VAT, total ₦1,075,000
 *  8. Payment blocked for ≥₦500K req without match
 *  9. Payment allowed for < ₦500K req in 'approved' state
 * 10. CEO budget override stores reason + audit entry
 */
class Phase4Test extends TestCase
{
    use RefreshDatabase;

    // ── Fixtures ─────────────────────────────────────────────────────────────

    private function makeRequisition(array $overrides = []): Requisition
    {
        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
        $staff = User::factory()->create(['role' => 'staff',      'status' => 'active']);
        // Use a unique vendor name per call to avoid UNIQUE constraint conflicts
        static $seq = 0;
        $seq++;
        $vendor = Vendor::create([
            'name' => "Test Vendor {$seq}", 'status' => 'active', 'created_by' => $admin->id,
        ]);
        $cc = CostCentre::create([
            'code' => "FX{$seq}", 'name' => 'Operations', 'budget_kobo' => 100_000_000_00,
            'status' => 'active', 'created_by' => $admin->id,
        ]);
        $ac = AccountCode::create([
            'code' => "FA{$seq}", 'category' => '6000', 'description' => 'Test',
            'tax_vat_applicable' => false, 'tax_wht_applicable' => false,
            'status' => 'active', 'created_by' => $admin->id,
        ]);

        return Requisition::create(array_merge([
            'request_id' => "REQ-FX{$seq}",
            'requester_id' => $staff->id,
            'type' => 'OPEX',
            'amount_kobo' => 60_000_000, // ₦600K
            'cost_centre_id' => $cc->id,
            'account_code_id' => $ac->id,
            'vendor_id' => $vendor->id,
            'description' => 'Test requisition',
            'status' => 'approved',
            'tax_vat_kobo' => 0,
            'tax_wht_kobo' => 0,
            'total_kobo' => 60_000_000,
            'created_by' => $admin->id,
        ], $overrides));
    }

    private function makeInvoice(Requisition $req, int $amountKobo, ?int $vendorId = null): Invoice
    {
        return Invoice::create([
            'requisition_id' => $req->id,
            'vendor_id' => $vendorId ?? $req->vendor_id,
            'invoice_number' => 'INV-'.rand(1000, 9999),
            'amount_kobo' => $amountKobo,
            'received_at' => today()->toDateString(),
            'file_path' => 'invoices/test.pdf',
            'match_status' => 'pending',
        ]);
    }

    private function makeReceipt(Requisition $req, ?User $user = null): GoodsReceipt
    {
        $user ??= User::factory()->create(['role' => 'staff', 'status' => 'active']);

        return GoodsReceipt::create([
            'requisition_id' => $req->id,
            'received_by' => $user->id,
            'received_at' => today()->toDateString(),
            'file_path' => 'receipts/test.pdf',
        ]);
    }

    // ── ThreeWayMatcher ───────────────────────────────────────────────────────

    /** ₦600K req, invoice ₦600,050 → diff = 5,000 kobo = ₦50 < ₦100 tolerance → matched */
    public function test_invoice_within_100_naira_tolerance_is_matched(): void
    {
        $req = $this->makeRequisition(['amount_kobo' => 60_000_000]);  // ₦600,000
        $invoice = $this->makeInvoice($req, 60_005_000);                   // ₦600,050 (₦50 variance)
        $receipt = $this->makeReceipt($req);

        $result = ThreeWayMatcher::match($req, $invoice, $receipt);

        $this->assertSame('matched', $result['match_status']);
        $this->assertSame(0, $result['variance_kobo']); // cleared on match
        $this->assertEmpty($result['flags']);
    }

    /** ₦600K req, invoice ₦650K → diff = 5,000,000 kobo → variance */
    public function test_invoice_exceeding_tolerance_is_variance(): void
    {
        $req = $this->makeRequisition(['amount_kobo' => 60_000_000]);  // ₦600K
        $invoice = $this->makeInvoice($req, 65_000_000);                   // ₦650K
        $receipt = $this->makeReceipt($req);

        $result = ThreeWayMatcher::match($req, $invoice, $receipt);

        $this->assertSame('variance', $result['match_status']);
        $this->assertSame(5_000_000, $result['variance_kobo']); // ₦50K positive
        $this->assertNotEmpty($result['flags']);
        $this->assertSame('INVOICE_AMOUNT_VARIANCE', $result['flags'][0]['code']);
    }

    /** Invoice vendor ≠ requisition vendor → blocked */
    public function test_vendor_mismatch_is_blocked(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
        $req = $this->makeRequisition();
        $other = Vendor::create([
            'name' => 'Other Vendor', 'status' => 'active', 'created_by' => $admin->id,
        ]);
        $invoice = $this->makeInvoice($req, $req->amount_kobo, $other->id);
        $receipt = $this->makeReceipt($req);

        $result = ThreeWayMatcher::match($req, $invoice, $receipt);

        $this->assertSame('blocked', $result['match_status']);
        $this->assertTrue(
            collect($result['flags'])->contains('code', 'VENDOR_MISMATCH')
        );
    }

    /** Match is required for reqs ≥ ₦500K */
    public function test_match_required_flag_for_large_requisition(): void
    {
        $req = $this->makeRequisition(['amount_kobo' => 50_000_000]); // ₦500K
        $this->assertTrue(ThreeWayMatcher::isMatchRequired($req));

        $small = $this->makeRequisition(['amount_kobo' => 49_999_999]);
        $this->assertFalse(ThreeWayMatcher::isMatchRequired($small));
    }

    // ── BudgetEnforcer ────────────────────────────────────────────────────────

    /** Cost centre at 95%, ₦100K new req → projected = 105% → block_100 */
    public function test_budget_blocks_at_100_percent(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
        $cc = CostCentre::create([
            'code' => '7000', 'name' => 'Marketing',
            'budget_kobo' => 100_000_000, // ₦1M (100,000,000 kobo)
            'status' => 'active', 'created_by' => $admin->id,
        ]);

        // Pre-seed ₦950K in paid requisitions (95%)
        $staff = User::factory()->create(['role' => 'staff', 'status' => 'active']);
        $ac = AccountCode::firstOrCreate(
            ['code' => '7010'],
            ['category' => '7000', 'description' => 'Travel', 'tax_vat_applicable' => false,
                'tax_wht_applicable' => false, 'status' => 'active', 'created_by' => $admin->id]
        );
        Requisition::create([
            'request_id' => 'REQ-202604-0050',
            'requester_id' => $staff->id,
            'type' => 'OPEX',
            'amount_kobo' => 95_000_000, // ₦950K
            'cost_centre_id' => $cc->id,
            'account_code_id' => $ac->id,
            'description' => 'Existing spend',
            'status' => 'paid',      // counts toward budget
            'tax_vat_kobo' => 0,
            'tax_wht_kobo' => 0,
            'total_kobo' => 95_000_000,
            'created_by' => $admin->id,
        ]);

        // New request: ₦100K → projected = ₦1,050K = 105%
        $result = BudgetEnforcer::check($cc, 10_000_000);

        $this->assertSame('block_100', $result['status']);
        $this->assertGreaterThan(100.0, $result['percentage']);
        $this->assertSame(95_000_000, $result['used_kobo']);
    }

    /** Cost centre at 75%, ₦60K new req → projected = 81% → warn_80 */
    public function test_budget_warns_at_80_percent(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
        $cc = CostCentre::create([
            'code' => '7001', 'name' => 'Events',
            'budget_kobo' => 100_000_000, // ₦1M (100,000,000 kobo)
            'status' => 'active', 'created_by' => $admin->id,
        ]);

        $staff = User::factory()->create(['role' => 'staff', 'status' => 'active']);
        $ac = AccountCode::firstOrCreate(
            ['code' => '7011'],
            ['category' => '7000', 'description' => 'Events',
                'tax_vat_applicable' => false, 'tax_wht_applicable' => false,
                'status' => 'active', 'created_by' => $admin->id]
        );
        Requisition::create([
            'request_id' => 'REQ-202604-0051',
            'requester_id' => $staff->id,
            'type' => 'OPEX',
            'amount_kobo' => 75_000_000, // ₦750K (75%)
            'cost_centre_id' => $cc->id,
            'account_code_id' => $ac->id,
            'description' => 'Events spend',
            'status' => 'paid',
            'tax_vat_kobo' => 0,
            'tax_wht_kobo' => 0,
            'total_kobo' => 75_000_000,
            'created_by' => $admin->id,
        ]);

        // ₦60K → projected = ₦810K = 81%
        $result = BudgetEnforcer::check($cc, 6_000_000);

        $this->assertSame('warn_80', $result['status']);
        $this->assertGreaterThan(80.0, $result['percentage']);
        $this->assertLessThan(90.0, $result['percentage']);
    }

    /** No budget set → always allow */
    public function test_budget_allows_when_no_budget_set(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
        $cc = CostCentre::create([
            'code' => '7002', 'name' => 'Misc', 'budget_kobo' => 0,
            'status' => 'active', 'created_by' => $admin->id,
        ]);

        $result = BudgetEnforcer::check($cc, 999_999_999);

        $this->assertSame('allow', $result['status']);
    }

    // ── TaxCalculator ─────────────────────────────────────────────────────────

    /** WHT 10% on ₦1M → ₦100K withheld, total = ₦900K */
    public function test_wht_10_percent_on_1m(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
        $ac = AccountCode::create([
            'code' => '8010', 'category' => '8000', 'description' => 'Consulting',
            'tax_vat_applicable' => false, 'tax_wht_applicable' => true, 'wht_rate' => 10,
            'status' => 'active', 'created_by' => $admin->id,
        ]);

        $result = TaxCalculator::calculate(100_000_000, $ac); // ₦1M

        $this->assertSame(0, $result['vat_kobo']);
        $this->assertSame(10_000_000, $result['wht_kobo']);   // ₦100K
        $this->assertSame(90_000_000, $result['total_kobo']); // ₦900K net
    }

    /** VAT 7.5% on ₦1M → ₦75K VAT, total = ₦1,075,000 */
    public function test_vat_7_5_percent_on_1m(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
        $ac = AccountCode::create([
            'code' => '8011', 'category' => '8000', 'description' => 'Production',
            'tax_vat_applicable' => true, 'tax_wht_applicable' => false,
            'status' => 'active', 'created_by' => $admin->id,
        ]);

        $result = TaxCalculator::calculate(100_000_000, $ac); // ₦1M

        $this->assertSame(7_500_000, $result['vat_kobo']);   // ₦75K
        $this->assertSame(0, $result['wht_kobo']);
        $this->assertSame(107_500_000, $result['total_kobo']); // ₦1,075,000
    }

    /** WHT 5% + VAT 7.5% together */
    public function test_combined_vat_and_wht(): void
    {
        $admin = User::factory()->create(['role' => 'superadmin', 'status' => 'active']);
        $ac = AccountCode::create([
            'code' => '8012', 'category' => '8000', 'description' => 'Ad Agency',
            'tax_vat_applicable' => true, 'tax_wht_applicable' => true, 'wht_rate' => 5,
            'status' => 'active', 'created_by' => $admin->id,
        ]);

        // ₦1M: VAT = ₦75K, WHT = ₦50K, total = ₦1M + ₦75K - ₦50K = ₦1,025,000
        $result = TaxCalculator::calculate(100_000_000, $ac);

        $this->assertSame(7_500_000, $result['vat_kobo']);
        $this->assertSame(5_000_000, $result['wht_kobo']);
        $this->assertSame(102_500_000, $result['total_kobo']);
    }

    // ── Payment gate ──────────────────────────────────────────────────────────

    /** ≥ ₦500K approved (not matched) → canPay() returns false */
    public function test_large_req_cannot_pay_without_match(): void
    {
        $req = $this->makeRequisition(['amount_kobo' => 50_000_000, 'status' => 'approved']);
        $this->assertFalse($req->canPay());
    }

    /** ≥ ₦500K matched → canPay() returns true */
    public function test_large_req_can_pay_when_matched(): void
    {
        $req = $this->makeRequisition(['amount_kobo' => 50_000_000, 'status' => 'matched']);
        $this->assertTrue($req->canPay());
    }

    /** < ₦500K approved → canPay() returns true (match is optional) */
    public function test_small_req_can_pay_from_approved(): void
    {
        $req = $this->makeRequisition(['amount_kobo' => 10_000_000, 'status' => 'approved']);
        $this->assertTrue($req->canPay());
    }

    // ── Payment endpoint ──────────────────────────────────────────────────────

    /** Finance user can pay a matched ₦600K req via POST /finance/payments/{id}/pay */
    public function test_finance_can_record_payment_for_matched_requisition(): void
    {
        Storage::fake('public');

        $finance = User::factory()->create(['role' => 'finance', 'status' => 'active']);
        $req = $this->makeRequisition(['amount_kobo' => 60_000_000, 'status' => 'matched']);

        $response = $this->actingAs($finance)
            ->post("/finance/payments/{$req->id}/pay", [
                'method' => 'bank_transfer',
                'reference' => 'TRN-2024-001',
                'paid_at' => today()->toDateString(),
                'proof' => UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
            ]);

        $response->assertRedirect('/finance/payments');
        $this->assertSame('posted', $req->fresh()->status);
        $this->assertSame(1, Payment::count());

        $payment = Payment::first();
        $this->assertSame($req->id, $payment->requisition_id);
        $this->assertSame('bank_transfer', $payment->method);
    }

    /** Finance cannot pay ≥ ₦500K req that isn't matched */
    public function test_finance_cannot_pay_unmatched_large_requisition(): void
    {
        Storage::fake('public');

        $finance = User::factory()->create(['role' => 'finance', 'status' => 'active']);
        $req = $this->makeRequisition(['amount_kobo' => 60_000_000, 'status' => 'approved']); // not matched

        $response = $this->actingAs($finance)
            ->post("/finance/payments/{$req->id}/pay", [
                'method' => 'bank_transfer',
                'reference' => 'TRN-2024-002',
                'paid_at' => today()->toDateString(),
                'proof' => UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
            ]);

        $response->assertSessionHasErrors(['payment']);
        $this->assertSame(0, Payment::count());
        $this->assertSame('approved', $req->fresh()->status);
    }

    // ── CEO budget override ───────────────────────────────────────────────────

    /** CEO can approve a budget-override step with a reason ≥ 30 chars */
    public function test_ceo_can_approve_budget_override_step(): void
    {
        $ceo = User::factory()->create(['role' => 'ceo', 'status' => 'active']);
        $req = $this->makeRequisition(['status' => 'approving', 'budget_override_required' => true]);

        $step = ApprovalStep::create([
            'requisition_id' => $req->id,
            'approver_id' => $ceo->id,
            'level' => 99,
            'role_label' => 'CEO Budget Override',
            'status' => 'pending',
            'is_budget_override' => true,
        ]);

        $response = $this->actingAs($ceo)
            ->post("/finance/approvals/steps/{$step->id}/decide", [
                'action' => 'approve',
                'override_reason' => 'Approved for strategic project aligned with Q2 objectives and board directive.',
            ]);

        $response->assertRedirect('/finance/approvals');

        $req->refresh();
        $this->assertSame('approved', $req->status);
        $this->assertFalse((bool) $req->budget_override_required);
        $this->assertNotEmpty($req->budget_override_reason);
        $this->assertSame($ceo->id, $req->budget_override_by);
    }

    /** CEO budget override requires reason ≥ 30 chars */
    public function test_ceo_budget_override_requires_long_reason(): void
    {
        $ceo = User::factory()->create(['role' => 'ceo', 'status' => 'active']);
        $req = $this->makeRequisition(['status' => 'approving', 'budget_override_required' => true]);

        $step = ApprovalStep::create([
            'requisition_id' => $req->id,
            'approver_id' => $ceo->id,
            'level' => 99,
            'role_label' => 'CEO Budget Override',
            'status' => 'pending',
            'is_budget_override' => true,
        ]);

        $response = $this->actingAs($ceo)
            ->post("/finance/approvals/steps/{$step->id}/decide", [
                'action' => 'approve',
                'override_reason' => 'Too short.', // < 30 chars
            ]);

        $response->assertSessionHasErrors(['override_reason']);
        $this->assertSame('approving', $req->fresh()->status);
    }
}
