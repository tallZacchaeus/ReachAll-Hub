<?php

namespace Tests\Feature;

use App\Models\Finance\AccountCode;
use App\Models\Finance\CostCentre;
use App\Models\Finance\Requisition;
use App\Models\Finance\Vendor;
use App\Models\User;
use App\Services\Finance\ThreeWayMatcher;
use App\Models\Finance\GoodsReceipt;
use App\Models\Finance\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Sprint 1 regression tests — launch blockers.
 *
 * Fix 1 (CAT11-01): APP_DEBUG=false in .env — manual check only (no test possible at runtime).
 * Fix 2 (CAT1-02):  XSS sanitisation via HtmlSanitizer::clean() on all TipTap-saving controllers.
 * Fix 3 (CAT1-10):  Rate limiting (throttle:30,1) on finance write routes.
 * Fix 4 (CAT2-03):  ThreeWayMatcher TOLERANCE_KOBO = 10_000 (₦100), not 100_000 (₦1,000).
 * Fix 5 (CAT5-02):  Negative/zero amount_naira → 422 validation error.
 */
class Sprint1RegressionTest extends TestCase
{
    use RefreshDatabase;

    // ── Fix 2: XSS sanitisation ──────────────────────────────────────────────

    /**
     * Storing a bulletin with a <script> tag strips the script but preserves safe HTML.
     */
    public function test_bulletin_store_strips_script_tags_and_preserves_safe_html(): void
    {
        $admin = User::factory()->create(['role' => 'management', 'status' => 'active']);

        $dirtyBody = '<script>alert(\'xss\')</script><p>Safe content</p>';

        $response = $this->actingAs($admin)
            ->post(route('admin.bulletins.store'), [
                'title'        => 'Test Bulletin',
                'body'         => $dirtyBody,
                'priority'     => 'info',
                'is_pinned'    => false,
                'is_published' => false,
            ]);

        $response->assertRedirect();

        $bulletin = \App\Models\Bulletin::first();
        $this->assertNotNull($bulletin, 'Bulletin should have been created.');

        $this->assertStringNotContainsString('<script>', $bulletin->body, 'Stored body must not contain <script>.');
        $this->assertStringNotContainsString('alert', $bulletin->body, 'Stored body must not contain alert().');
        $this->assertStringContainsString('<p>Safe content</p>', $bulletin->body, 'Stored body must retain safe <p> tag.');
    }

    /**
     * Updating a bulletin also sanitises the body.
     */
    public function test_bulletin_update_strips_script_tags(): void
    {
        $admin = User::factory()->create(['role' => 'management', 'status' => 'active']);

        $bulletin = \App\Models\Bulletin::create([
            'title'     => 'Original',
            'body'      => '<p>Original content</p>',
            'priority'  => 'info',
            'author_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->put(route('admin.bulletins.update', $bulletin->id), [
                'title'        => 'Updated',
                'body'         => '<img src=x onerror="alert(1)"><p>Updated content</p>',
                'priority'     => 'info',
                'is_pinned'    => false,
                'is_published' => false,
            ]);

        $bulletin->refresh();

        $this->assertStringNotContainsString('onerror', $bulletin->body);
        $this->assertStringContainsString('<p>Updated content</p>', $bulletin->body);
    }

    // ── Fix 3: Finance write-route rate limiting ─────────────────────────────

    /**
     * Finance write routes are throttled at 30 requests per minute per user.
     * After exhausting the limit the endpoint returns 429 Too Many Requests.
     *
     * ThrottleRequests resolves the key as sha1($user->getAuthIdentifier())
     * for authenticated requests (no route/IP component for auth'd users).
     */
    public function test_finance_write_routes_return_429_after_30_requests(): void
    {
        $user = User::factory()->create(['role' => 'staff', 'status' => 'active']);

        // ThrottleRequests::resolveRequestSignature() for authenticated users:
        //   return sha1($user->getAuthIdentifier());
        $throttleKey = sha1((string) $user->getAuthIdentifier());

        // Pre-consume all 30 slots (1-minute decay to match throttle:30,1)
        for ($i = 0; $i < 30; $i++) {
            RateLimiter::hit($throttleKey, 60);
        }

        // 31st request should be blocked — empty payload is fine, throttle runs before validation
        $response = $this->actingAs($user)
            ->post(route('finance.requisitions.store'), []);

        $response->assertStatus(429);
    }

    // ── Fix 4: ThreeWayMatcher tolerance ────────────────────────────────────

    /**
     * ₦600,050 invoice against ₦600,000 requisition → variance = ₦50 < ₦100 tolerance → matched.
     */
    public function test_three_way_matcher_50_naira_variance_is_matched(): void
    {
        $this->assertSame(10_000, ThreeWayMatcher::TOLERANCE_KOBO, 'TOLERANCE_KOBO must be 10,000 (₦100).');

        $admin = User::factory()->create(['role' => 'finance', 'status' => 'active']);

        $vendor = Vendor::create(['name' => 'Vendor A', 'status' => 'active', 'created_by' => $admin->id]);
        $costCentre = CostCentre::create(['code' => '1100', 'name' => 'Ops', 'budget_kobo' => 100_000_000_00, 'status' => 'active', 'created_by' => $admin->id]);
        $accountCode = AccountCode::create(['code' => '8001', 'category' => '8000', 'description' => 'General', 'tax_vat_applicable' => false, 'tax_wht_applicable' => false, 'wht_rate' => 0, 'status' => 'active', 'created_by' => $admin->id]);

        $req = Requisition::create([
            'request_id'      => 'REQ-TEST-001',
            'requester_id'    => $admin->id,
            'type'            => 'OPEX',
            'amount_kobo'     => 60_000_000,   // ₦600,000
            'currency'        => 'NGN',
            'exchange_rate'   => 1.0,
            'cost_centre_id'  => $costCentre->id,
            'account_code_id' => $accountCode->id,
            'vendor_id'       => $vendor->id,
            'urgency'         => 'standard',
            'description'     => 'Software subscription renewal for the finance team.',
            'supporting_docs' => [],
            'status'          => 'approved',
            'tax_vat_kobo'    => 0,
            'tax_wht_kobo'    => 0,
            'total_kobo'      => 60_000_000,
            'created_by'      => $admin->id,
            'submitted_at'    => now(),
        ]);

        $invoice = new Invoice();
        $invoice->amount_kobo = 60_005_000;   // ₦600,050 — variance ₦50
        $invoice->vendor_id   = $vendor->id;

        $receipt = new GoodsReceipt();

        $result = ThreeWayMatcher::match($req, $invoice, $receipt);

        $this->assertSame('matched', $result['match_status'], '₦50 variance should be within ₦100 tolerance → matched.');
        $this->assertEmpty($result['flags'], 'No flags expected for within-tolerance match.');
    }

    /**
     * ₦600,150 invoice against ₦600,000 requisition → variance = ₦150 > ₦100 tolerance → variance.
     */
    public function test_three_way_matcher_150_naira_variance_is_flagged(): void
    {
        $admin = User::factory()->create(['role' => 'finance', 'status' => 'active']);

        $vendor = Vendor::create(['name' => 'Vendor B', 'status' => 'active', 'created_by' => $admin->id]);
        $costCentre = CostCentre::create(['code' => '1101', 'name' => 'Ops2', 'budget_kobo' => 100_000_000_00, 'status' => 'active', 'created_by' => $admin->id]);
        $accountCode = AccountCode::create(['code' => '8002', 'category' => '8000', 'description' => 'General2', 'tax_vat_applicable' => false, 'tax_wht_applicable' => false, 'wht_rate' => 0, 'status' => 'active', 'created_by' => $admin->id]);

        $req = Requisition::create([
            'request_id'      => 'REQ-TEST-002',
            'requester_id'    => $admin->id,
            'type'            => 'OPEX',
            'amount_kobo'     => 60_000_000,   // ₦600,000
            'currency'        => 'NGN',
            'exchange_rate'   => 1.0,
            'cost_centre_id'  => $costCentre->id,
            'account_code_id' => $accountCode->id,
            'vendor_id'       => $vendor->id,
            'urgency'         => 'standard',
            'description'     => 'Software subscription renewal for the procurement team.',
            'supporting_docs' => [],
            'status'          => 'approved',
            'tax_vat_kobo'    => 0,
            'tax_wht_kobo'    => 0,
            'total_kobo'      => 60_000_000,
            'created_by'      => $admin->id,
            'submitted_at'    => now(),
        ]);

        $invoice = new Invoice();
        $invoice->amount_kobo = 60_015_000;   // ₦600,150 — variance ₦150
        $invoice->vendor_id   = $vendor->id;

        $receipt = new GoodsReceipt();

        $result = ThreeWayMatcher::match($req, $invoice, $receipt);

        $this->assertSame('variance', $result['match_status'], '₦150 variance exceeds ₦100 tolerance → variance.');
        $this->assertNotEmpty($result['flags'], 'INVOICE_AMOUNT_VARIANCE flag expected.');
        $this->assertSame('INVOICE_AMOUNT_VARIANCE', $result['flags'][0]['code']);
    }

    // ── Fix 5: Negative / zero amount validation ─────────────────────────────

    /**
     * POST /finance/requisitions with amount_naira = -100 → validation error on amount_naira.
     * JSON requests return 422; web requests redirect with session errors.
     */
    public function test_negative_amount_naira_is_rejected_with_validation_error(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'staff', 'status' => 'active']);
        [$costCentre, $accountCode, $vendor] = $this->makeMinimalFixtures($user);

        $response = $this->actingAs($user)
            ->withHeaders(['Accept' => 'application/json'])
            ->post(route('finance.requisitions.store'), array_merge(
                $this->basePayload($costCentre, $accountCode, $vendor),
                ['amount_naira' => -100]
            ));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount_naira']);
    }

    /**
     * POST /finance/requisitions with amount_naira = 0 → validation error on amount_naira.
     */
    public function test_zero_amount_naira_is_rejected_with_validation_error(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'staff', 'status' => 'active']);
        [$costCentre, $accountCode, $vendor] = $this->makeMinimalFixtures($user);

        $response = $this->actingAs($user)
            ->withHeaders(['Accept' => 'application/json'])
            ->post(route('finance.requisitions.store'), array_merge(
                $this->basePayload($costCentre, $accountCode, $vendor),
                ['amount_naira' => 0]
            ));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount_naira']);
    }

    /**
     * POST /finance/requisitions with amount_naira = 0.01 (= 1 kobo) passes amount_naira validation.
     * The request may fail further in the pipeline (e.g. approval routing) — we only assert
     * that amount_naira itself does NOT produce a validation error.
     */
    public function test_minimum_valid_amount_naira_passes_validation(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'staff', 'status' => 'active']);
        [$costCentre, $accountCode, $vendor] = $this->makeMinimalFixtures($user);

        $response = $this->actingAs($user)
            ->withHeaders(['Accept' => 'application/json'])
            ->post(route('finance.requisitions.store'), array_merge(
                $this->basePayload($costCentre, $accountCode, $vendor),
                ['amount_naira' => 0.01]  // = 1 kobo — minimum valid
            ));

        // Must NOT be a validation error on amount_naira (422 with that key means validation rejected it)
        if ($response->status() === 422) {
            $response->assertJsonMissingValidationErrors(['amount_naira']);
        }
        // Any non-422 status (redirect, 500 from ApprovalRouter, etc.) confirms validation passed
        $this->assertNotSame(422, $response->status(), 'amount_naira = 0.01 should pass validation.');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Create the minimum finance fixtures needed to pass requisition validation. */
    private function makeMinimalFixtures(User $user): array
    {
        $costCentre = CostCentre::create([
            'code'        => '9999',
            'name'        => 'Regression Test CC',
            'budget_kobo' => 100_000_000_00,
            'status'      => 'active',
            'created_by'  => $user->id,
        ]);

        $accountCode = AccountCode::create([
            'code'               => '9999',
            'category'           => '9000',
            'description'        => 'Regression Test AC',
            'tax_vat_applicable' => false,
            'tax_wht_applicable' => false,
            'wht_rate'           => 0,
            'status'             => 'active',
            'created_by'         => $user->id,
        ]);

        $vendor = Vendor::create([
            'name'       => 'Regression Test Vendor',
            'status'     => 'active',
            'created_by' => $user->id,
        ]);

        return [$costCentre, $accountCode, $vendor];
    }

    /** Base valid payload for requisition submission (amount_naira overridden per test). */
    private function basePayload(CostCentre $cc, AccountCode $ac, Vendor $vendor): array
    {
        return [
            'type'            => 'OPEX',
            'amount_naira'    => 50_000,
            'currency'        => 'NGN',
            'exchange_rate'   => '1',
            'cost_centre_id'  => $cc->id,
            'account_code_id' => $ac->id,
            'vendor_id'       => $vendor->id,
            'urgency'         => 'standard',
            'description'     => 'Regression test requisition for Sprint 1 validation checks.',
            'supporting_docs' => [
                UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
            ],
        ];
    }
}
