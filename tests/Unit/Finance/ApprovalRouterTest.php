<?php

namespace Tests\Unit\Finance;

use App\Models\Finance\ApprovalRouter;
use App\Models\Finance\Requisition;
use App\Services\Finance\ApprovalRouter as ApprovalRouterService;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for ApprovalRouter::resolveTiers()
 *
 * These tests mock a Requisition object and verify the correct tier chain
 * is returned for each amount / type combination specified in FINANCE_CLAUDE.md.
 *
 * They do NOT hit the database — pure logic tests.
 */
class ApprovalRouterTest extends TestCase
{
    private ApprovalRouterService $router;

    protected function setUp(): void
    {
        parent::setUp();
        $this->router = new ApprovalRouterService;
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /**
     * Create a lightweight stub that returns just enough data for resolveTiers().
     */
    private function makeRequisition(int $amountKobo, string $type = 'OPEX'): Requisition
    {
        /** @var Requisition $req */
        $req = new Requisition;
        $req->amount_kobo = $amountKobo;
        $req->type = $type;

        return $req;
    }

    private function roles(array $tiers): array
    {
        return array_column($tiers, 'role');
    }

    // ── OPEX tiers ────────────────────────────────────────────────────────────

    /** ₦50K OPEX → Line Manager only */
    public function test_opex_50k_routes_to_line_manager_only(): void
    {
        $req = $this->makeRequisition(50_000_00); // ₦50K
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(1, $tiers);
        $this->assertSame(['management'], $this->roles($tiers));
        $this->assertSame('Line Manager', $tiers[0]['label']);
    }

    /** ₦300K OPEX → Line Manager + Dept Head */
    public function test_opex_300k_routes_to_line_manager_and_dept_head(): void
    {
        $req = $this->makeRequisition(300_000_00); // ₦300K
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(2, $tiers);
        $this->assertSame(['management', 'dept_head'], $this->roles($tiers));
    }

    /** ₦1M OPEX → Line Manager + Dept Head + Finance */
    public function test_opex_1m_routes_to_three_tiers(): void
    {
        $req = $this->makeRequisition(1_000_000_00); // ₦1M
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(3, $tiers);
        $this->assertSame(['management', 'dept_head', 'finance'], $this->roles($tiers));
    }

    /** ₦3M OPEX → Line Manager + Dept Head + Finance + Gen Mgmt */
    public function test_opex_3m_routes_to_four_tiers(): void
    {
        $req = $this->makeRequisition(3_000_000_00); // ₦3M
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(4, $tiers);
        $this->assertSame(
            ['management', 'dept_head', 'finance', 'general_management'],
            $this->roles($tiers)
        );
    }

    /** ₦15M OPEX → all 5 tiers + CEO */
    public function test_opex_15m_routes_to_five_tiers_including_ceo(): void
    {
        $req = $this->makeRequisition(15_000_000_00); // ₦15M
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(5, $tiers);
        $this->assertSame(
            ['management', 'dept_head', 'finance', 'general_management', 'ceo'],
            $this->roles($tiers)
        );
    }

    // ── CAPEX extra tier ──────────────────────────────────────────────────────

    /** ₦5M CAPEX → Line Manager + Dept Head + Finance + Gen Mgmt + CEO */
    public function test_capex_5m_routes_to_five_tiers_including_ceo(): void
    {
        $req = $this->makeRequisition(5_000_000_00, 'CAPEX'); // ₦5M
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(5, $tiers);
        $this->assertSame(
            ['management', 'dept_head', 'finance', 'general_management', 'ceo'],
            $this->roles($tiers)
        );
    }

    /** ₦50K CAPEX → Line Manager + Dept Head (CAPEX adds one extra tier) */
    public function test_capex_50k_adds_extra_tier_over_opex(): void
    {
        $req = $this->makeRequisition(50_000_00, 'CAPEX'); // ₦50K
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(2, $tiers);
        $this->assertSame(['management', 'dept_head'], $this->roles($tiers));
    }

    /** ₦300K CAPEX → Line Manager + Dept Head + Finance */
    public function test_capex_300k_routes_to_three_tiers(): void
    {
        $req = $this->makeRequisition(300_000_00, 'CAPEX'); // ₦300K
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(3, $tiers);
        $this->assertSame(['management', 'dept_head', 'finance'], $this->roles($tiers));
    }

    /** ₦1M CAPEX → Line Manager + Dept Head + Finance + Gen Mgmt */
    public function test_capex_1m_routes_to_four_tiers(): void
    {
        $req = $this->makeRequisition(1_000_000_00, 'CAPEX'); // ₦1M
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(4, $tiers);
        $this->assertSame(
            ['management', 'dept_head', 'finance', 'general_management'],
            $this->roles($tiers)
        );
    }

    // ── EMERG and PETTY ───────────────────────────────────────────────────────

    /** EMERG uses same OPEX tiers */
    public function test_emerg_uses_standard_opex_tiers(): void
    {
        $req_emerg = $this->makeRequisition(50_000_00, 'EMERG');
        $req_opex = $this->makeRequisition(50_000_00, 'OPEX');

        $this->assertSame(
            $this->roles($this->router->resolveTiers($req_opex)),
            $this->roles($this->router->resolveTiers($req_emerg))
        );
    }

    /** PETTY < ₦10K routes to finance (petty cash custodian path) */
    public function test_petty_under_10k_routes_to_custodian(): void
    {
        $req = $this->makeRequisition(5_000_00, 'PETTY'); // ₦5K
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(1, $tiers);
        $this->assertSame('finance', $tiers[0]['role']);
    }

    // ── Boundary tests ────────────────────────────────────────────────────────

    /** Exactly ₦100K → Dept Head added (boundary) */
    public function test_exactly_100k_includes_dept_head(): void
    {
        $req = $this->makeRequisition(100_000_00); // exactly ₦100K
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(2, $tiers);
        $this->assertSame('dept_head', $tiers[1]['role']);
    }

    /** Just below ₦100K → Line Manager only */
    public function test_just_below_100k_no_dept_head(): void
    {
        $req = $this->makeRequisition(99_999_00); // ₦99,999
        $tiers = $this->router->resolveTiers($req);

        $this->assertCount(1, $tiers);
        $this->assertSame('management', $tiers[0]['role']);
    }
}
