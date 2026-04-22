<?php

namespace Tests\Feature\Finance;

use App\Models\Finance\AccountCode;
use App\Models\Finance\ApprovalStep;
use App\Models\Finance\CostCentre;
use App\Models\Finance\Requisition;
use App\Models\Finance\Vendor;
use App\Models\User;
use App\Notifications\Finance\RequisitionDecision;
use App\Notifications\Finance\RequisitionSubmitted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Feature tests for the requisition state machine.
 *
 * Covers:
 *  1. Staff can create and submit a requisition
 *  2. ApprovalRouter creates the correct steps
 *  3. Approver approves → activates next step
 *  4. Final approval → status = 'approved', requester notified
 *  5. Rejection at any step → status = 'rejected', requester notified
 *  6. Requester cannot be their own approver
 *  7. Unauthorised user cannot act on a step
 */
class RequisitionTest extends TestCase
{
    use RefreshDatabase;

    // ── Fixtures ─────────────────────────────────────────────────────────────

    private function makeUsers(): array
    {
        $requester = User::factory()->create([
            'role'       => 'staff',
            'department' => 'IT & Digital',
            'status'     => 'active',
        ]);

        $lineManager = User::factory()->create([
            'role'       => 'management',
            'department' => 'IT & Digital',
            'status'     => 'active',
        ]);

        $finance = User::factory()->create([
            'role'   => 'finance',
            'status' => 'active',
        ]);

        $genMgmt = User::factory()->create([
            'role'   => 'general_management',
            'status' => 'active',
        ]);

        $ceo = User::factory()->create([
            'role'   => 'ceo',
            'status' => 'active',
        ]);

        return compact('requester', 'lineManager', 'finance', 'genMgmt', 'ceo');
    }

    private function makeFinanceFixtures(User $admin, ?User $deptHead = null): array
    {
        $costCentre = CostCentre::create([
            'code'         => '1200',
            'name'         => 'IT & Digital',
            'budget_kobo'  => 15_000_000_00,
            'status'       => 'active',
            'head_user_id' => $deptHead?->id,
            'created_by'   => $admin->id,
        ]);

        $accountCode = AccountCode::create([
            'code'               => '9001',
            'category'           => '9000',
            'description'        => 'Software Licences',
            'tax_vat_applicable' => true,
            'tax_wht_applicable' => true,
            'wht_rate'           => 10,
            'status'             => 'active',
            'created_by'         => $admin->id,
        ]);

        $vendor = Vendor::create([
            'name'        => 'Test Vendor Ltd',
            'status'      => 'active',
            'created_by'  => $admin->id,
        ]);

        return compact('costCentre', 'accountCode', 'vendor');
    }

    private function submitPayload(array $fixtures, float $amountNaira = 50_000, string $type = 'OPEX'): array
    {
        return [
            'type'            => $type,
            'amount_naira'    => $amountNaira,
            'currency'        => 'NGN',
            'exchange_rate'   => '1',
            'cost_centre_id'  => $fixtures['costCentre']->id,
            'account_code_id' => $fixtures['accountCode']->id,
            'vendor_id'       => $fixtures['vendor']->id,
            'urgency'         => 'standard',
            'description'     => 'This is a test requisition for software licences.',
            'supporting_docs' => [
                UploadedFile::fake()->create('quote.pdf', 100, 'application/pdf'),
            ],
        ];
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    /** Staff can submit a requisition; it creates ApprovalSteps and notifies first approver. */
    public function test_staff_can_submit_requisition_and_approval_steps_are_created(): void
    {
        Notification::fake();
        Storage::fake('public');

        ['requester' => $requester, 'lineManager' => $lineManager] = $this->makeUsers();
        $fixtures = $this->makeFinanceFixtures($requester);

        $response = $this->actingAs($requester)
            ->post('/finance/requisitions', $this->submitPayload($fixtures));

        $response->assertRedirect();

        $req = Requisition::first();
        $this->assertNotNull($req, 'Requisition should have been created.');
        $this->assertSame('approving', $req->status);
        $this->assertStringStartsWith('REQ-', $req->request_id);

        // ₦50K OPEX → 1 approval step (Line Manager)
        $this->assertCount(1, $req->approvalSteps);
        $this->assertSame(1, $req->approvalSteps->first()->level);
        $this->assertSame('pending', $req->approvalSteps->first()->status);

        // First approver notified
        Notification::assertSentTo($lineManager, RequisitionSubmitted::class);
    }

    /** Approving the only step → status becomes 'approved', requester notified. */
    public function test_single_step_approval_marks_requisition_approved(): void
    {
        Notification::fake();
        Storage::fake('public');

        ['requester' => $requester, 'lineManager' => $lineManager] = $this->makeUsers();
        $fixtures = $this->makeFinanceFixtures($requester);

        $this->actingAs($requester)
            ->post('/finance/requisitions', $this->submitPayload($fixtures));

        $step = ApprovalStep::first();

        $this->actingAs($lineManager)
            ->post("/finance/approvals/steps/{$step->id}/decide", [
                'action'  => 'approve',
                'comment' => null,
            ]);

        $req = Requisition::first();
        $this->assertSame('approved', $req->status);
        $this->assertNotNull($req->approved_at);

        Notification::assertSentTo($requester, RequisitionDecision::class);
    }

    /** Rejection at any step → requisition rejected, requester notified with comment. */
    public function test_rejection_marks_requisition_rejected_and_notifies_requester(): void
    {
        Notification::fake();
        Storage::fake('public');

        ['requester' => $requester, 'lineManager' => $lineManager] = $this->makeUsers();
        $fixtures = $this->makeFinanceFixtures($requester);

        $this->actingAs($requester)
            ->post('/finance/requisitions', $this->submitPayload($fixtures));

        $step = ApprovalStep::first();

        $this->actingAs($lineManager)
            ->post("/finance/approvals/steps/{$step->id}/decide", [
                'action'  => 'reject',
                'comment' => 'Budget exceeded for this quarter.',
            ]);

        $req = Requisition::first();
        $this->assertSame('rejected', $req->status);

        Notification::assertSentTo($requester, RequisitionDecision::class,
            fn (RequisitionDecision $n) => str_contains($n->toDatabase($requester)['body'], 'Budget exceeded')
        );
    }

    /** Multi-step: approve level 1 → level 2 becomes active. */
    public function test_multi_step_approval_activates_next_step(): void
    {
        Notification::fake();
        Storage::fake('public');

        ['requester' => $requester, 'lineManager' => $lineManager] = $this->makeUsers();

        // Create a dedicated dept head user so the Dept Head tier resolves
        $deptHead = User::factory()->create([
            'role'   => 'management',
            'status' => 'active',
        ]);

        // Wire cost centre head to the dept head
        $fixtures = $this->makeFinanceFixtures($requester, $deptHead);

        // ₦300K OPEX → 2 tiers: Line Manager + Dept Head
        $this->actingAs($requester)
            ->post('/finance/requisitions', $this->submitPayload($fixtures, 300_000));

        $steps = ApprovalStep::orderBy('level')->get();
        $this->assertGreaterThanOrEqual(2, $steps->count(), 'Expected at least 2 approval steps for ₦300K OPEX.');

        $step1 = $steps->first();

        // Approve level 1
        $this->actingAs($lineManager)
            ->post("/finance/approvals/steps/{$step1->id}/decide", ['action' => 'approve']);

        $req = Requisition::first();
        $this->assertSame('approving', $req->status, 'Requisition should still be approving after level 1.');

        // Level 2 step should now have a sla_deadline set (activated)
        $step2 = $steps->skip(1)->first();
        $step2->refresh();
        $this->assertNotNull($step2->sla_deadline, 'Level 2 SLA should be set after level 1 approval.');
    }

    /** The requester cannot be their own approver (even if they have a management role). */
    public function test_requester_cannot_approve_their_own_request(): void
    {
        Notification::fake();
        Storage::fake('public');

        // Create a user who is both a manager AND the requester
        $managerRequester = User::factory()->create([
            'role'   => 'management',
            'status' => 'active',
        ]);

        // Second manager for the step
        $otherManager = User::factory()->create([
            'role'   => 'management',
            'status' => 'active',
        ]);

        $fixtures = $this->makeFinanceFixtures($managerRequester);

        $this->actingAs($managerRequester)
            ->post('/finance/requisitions', $this->submitPayload($fixtures));

        $step = ApprovalStep::first();

        // The step should NOT be assigned to the requester themselves
        $this->assertNotEquals(
            $managerRequester->id,
            $step->approver_id,
            'Requester should not be assigned as their own approver.'
        );
    }

    /** An unauthorised user gets a 403 when trying to decide on a step. */
    public function test_unauthorised_user_cannot_decide_on_step(): void
    {
        Notification::fake();
        Storage::fake('public');

        ['requester' => $requester] = $this->makeUsers();
        $stranger = User::factory()->create(['role' => 'staff', 'status' => 'active']);
        $fixtures = $this->makeFinanceFixtures($requester);

        $this->actingAs($requester)
            ->post('/finance/requisitions', $this->submitPayload($fixtures));

        $step = ApprovalStep::first();

        $response = $this->actingAs($stranger)
            ->post("/finance/approvals/steps/{$step->id}/decide", ['action' => 'approve']);

        $response->assertStatus(403);
    }

    /** Requisition list shows only the current user's own requests. */
    public function test_requisition_list_shows_only_own_requests(): void
    {
        Storage::fake('public');
        Notification::fake();

        ['requester' => $requester, 'lineManager' => $otherUser] = $this->makeUsers();
        $fixtures = $this->makeFinanceFixtures($requester);

        // Submit one as requester
        $this->actingAs($requester)
            ->post('/finance/requisitions', $this->submitPayload($fixtures));

        // List as requester → sees it
        $this->actingAs($requester)
            ->get('/finance/requisitions')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Finance/RequisitionListPage')
                ->has('requisitions.data', 1)
            );

        // List as other user → sees nothing
        $this->actingAs($otherUser)
            ->get('/finance/requisitions')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('requisitions.data', 0)
            );
    }

    /** Tax calculation is correct: VAT 7.5%, WHT 10% for account code 9001. */
    public function test_tax_calculation_is_correct_on_submit(): void
    {
        Storage::fake('public');
        Notification::fake();

        ['requester' => $requester] = $this->makeUsers();
        $fixtures = $this->makeFinanceFixtures($requester);

        // ₦100,000 NGN
        $this->actingAs($requester)
            ->post('/finance/requisitions', $this->submitPayload($fixtures, 100_000));

        $req = Requisition::first();

        // Gross: ₦100,000 = 10_000_000 kobo
        $this->assertSame(10_000_000, $req->amount_kobo);
        // VAT:   7.5% of 10_000_000 = 750_000
        $this->assertSame(750_000, $req->tax_vat_kobo);
        // WHT:   10% of 10_000_000 = 1_000_000
        $this->assertSame(1_000_000, $req->tax_wht_kobo);
        // Total: 10_000_000 + 750_000 - 1_000_000 = 9_750_000
        $this->assertSame(9_750_000, $req->total_kobo);
    }
}
