<?php

namespace Database\Seeders\Finance;

use App\Models\Finance\AccountCode;
use App\Models\Finance\ApprovalStep;
use App\Models\Finance\CostCentre;
use App\Models\Finance\FinancialPeriod;
use App\Models\Finance\GoodsReceipt;
use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Models\Finance\PettyCashFloat;
use App\Models\Finance\PettyCashTransaction;
use App\Models\Finance\Requisition;
use App\Models\Finance\Vendor;
use App\Models\User;
use App\Services\Finance\ApprovalRouter;
use App\Services\Finance\TaxCalculator;
use Illuminate\Database\Seeder;

/**
 * Generates realistic demo data for training:
 *   - 50 requisitions spread across types, amounts, cost centres, states
 *   - Some fully posted (end-to-end), some mid-flow, some rejected
 *   - Petty cash activity with reconciliations
 *   - Various approval states for demonstrating the approval queue
 */
class FinanceTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'superadmin')->first();
        $finance = User::where('role', 'finance')->first();
        $ceo = User::where('role', 'ceo')->first();
        $staff = User::where('role', 'staff')->where('status', 'active')->first();

        if (! $admin) {
            $this->command->warn('No superadmin user found — skipping FinanceTransactionSeeder.');

            return;
        }

        $vendors = Vendor::where('status', 'active')->pluck('id')->toArray();
        $costCentres = CostCentre::where('status', 'active')->pluck('id')->toArray();
        $accountCodes = AccountCode::where('status', 'active')->pluck('id')->toArray();

        if (empty($vendors) || empty($costCentres) || empty($accountCodes)) {
            $this->command->warn('Reference data missing — run VendorSeeder/CostCentreSeeder/AccountCodeSeeder first.');

            return;
        }

        $period = FinancialPeriod::where('status', 'open')
            ->orderByDesc('year')->orderByDesc('month')
            ->first();

        $router = app(ApprovalRouter::class);

        $scenarios = $this->buildScenarios($admin, $staff, $vendors, $costCentres, $accountCodes, $period);

        $counter = Requisition::max('id') ?? 0;

        foreach ($scenarios as $s) {
            $counter++;
            $this->createRequisition($s, $counter, $router, $admin, $finance, $ceo);
        }

        // Petty cash demo activity
        $this->seedPettyCashActivity($admin);

        $this->command->info('FinanceTransactionSeeder: '.count($scenarios).' requisitions seeded.');
    }

    // ── Scenario definitions ──────────────────────────────────────────────────

    private function buildScenarios($admin, $staff, $vendors, $costCentres, $accountCodes, $period): array
    {
        $requester = $staff ?? $admin;
        $v = $vendors[0];
        $v2 = $vendors[1] ?? $vendors[0];
        $cc1 = $costCentres[0];
        $cc2 = $costCentres[1] ?? $costCentres[0];
        $ac = $accountCodes[0];
        $ac2 = $accountCodes[1] ?? $accountCodes[0];

        // spread submissions over last 3 months
        $base = now()->subMonths(2)->startOfMonth();

        return [
            // === POSTED (fully through the system) ===
            ['type' => 'OPEX', 'amount' => 150_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'posted', 'days_ago' => 60, 'desc' => 'Office stationery and supplies procurement', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 380_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'posted', 'days_ago' => 55, 'desc' => 'Generator maintenance and servicing contract', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 220_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'posted', 'days_ago' => 50, 'desc' => 'Quarterly internet subscription renewal', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 75_000,  'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'posted', 'days_ago' => 45, 'desc' => 'Cleaning supplies and janitorial materials', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 960_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'posted', 'days_ago' => 40, 'desc' => 'Annual software licence for accounting platform', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'CAPEX', 'amount' => 2_500_000, 'cc' => $cc1, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'posted', 'days_ago' => 38, 'desc' => 'Purchase of high-performance server rack and UPS', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 180_000, 'cc' => $cc2, 'ac' => $ac,  'vendor' => $v,  'status' => 'posted', 'days_ago' => 35, 'desc' => 'Staff training materials and workshop kits', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 450_000, 'cc' => $cc1, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'posted', 'days_ago' => 32, 'desc' => 'Travel and accommodation for external conference', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 310_000, 'cc' => $cc2, 'ac' => $ac,  'vendor' => $v,  'status' => 'posted', 'days_ago' => 28, 'desc' => 'Security guard contract monthly retainer', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 125_000, 'cc' => $cc1, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'posted', 'days_ago' => 25, 'desc' => 'Printing and branding materials for event', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],

            // === PAID (payment recorded, posting queued) ===
            ['type' => 'OPEX', 'amount' => 200_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'paid', 'days_ago' => 20, 'desc' => 'Monthly subscription for HR software suite', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 540_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'paid', 'days_ago' => 18, 'desc' => 'Venue hire for annual staff conference', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],

            // === MATCHED (awaiting payment) ===
            ['type' => 'OPEX', 'amount' => 720_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'matched', 'days_ago' => 15, 'desc' => 'Catering services for leadership retreat weekend', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'CAPEX', 'amount' => 4_800_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'matched', 'days_ago' => 14, 'desc' => 'Video production equipment upgrade (cameras, tripods)', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],

            // === APPROVED (ready for matching or direct payment) ===
            ['type' => 'OPEX', 'amount' => 88_000,  'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'approved', 'days_ago' => 12, 'desc' => 'Staff welfare and birthday gift procurement', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 630_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'approved', 'days_ago' => 10, 'desc' => 'Professional photography for corporate materials', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 155_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'approved', 'days_ago' => 9, 'desc' => 'Vehicle servicing and spare parts replacement', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'CAPEX', 'amount' => 1_200_000, 'cc' => $cc1, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'approved', 'days_ago' => 8, 'desc' => 'Office furniture replacement (chairs, desks, shelving)', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 420_000, 'cc' => $cc2, 'ac' => $ac,  'vendor' => $v,  'status' => 'approved', 'days_ago' => 7, 'desc' => 'Outsourced cleaning contract (3-month advance)', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'EMERG', 'amount' => 95_000,  'cc' => $cc1, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'approved', 'days_ago' => 6, 'desc' => 'Emergency plumbing repair for main office block', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],

            // === APPROVING (mid-flow, some steps pending) ===
            ['type' => 'OPEX', 'amount' => 270_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'approving', 'days_ago' => 5, 'desc' => 'Annual audit firm engagement retainer fee', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 860_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'approving', 'days_ago' => 4, 'desc' => 'Digital advertising campaign for Q3 outreach', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'CAPEX', 'amount' => 7_500_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'approving', 'days_ago' => 3, 'desc' => 'Solar power installation for main office complex', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 330_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'approving', 'days_ago' => 3, 'desc' => 'Outsourced payroll processing services Q3', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 115_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'approving', 'days_ago' => 2, 'desc' => 'Office painting and minor renovation works', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 490_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'approving', 'days_ago' => 2, 'desc' => 'Legal retainer for employment contract reviews', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'EMERG', 'amount' => 60_000,  'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'approving', 'days_ago' => 1, 'desc' => 'Emergency generator fuel top-up for critical event', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],

            // === SUBMITTED (awaiting first approval) ===
            ['type' => 'OPEX', 'amount' => 185_000, 'cc' => $cc1, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'submitted', 'days_ago' => 1, 'desc' => 'Guest speaker honorarium for staff training day', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 250_000, 'cc' => $cc2, 'ac' => $ac,  'vendor' => $v,  'status' => 'submitted', 'days_ago' => 0, 'desc' => 'Outsourced IT support contract renewal (monthly)', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'CAPEX', 'amount' => 3_200_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'submitted', 'days_ago' => 0, 'desc' => 'Purchase of two new vehicles for field operations', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 140_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'submitted', 'days_ago' => 0, 'desc' => 'Courier and logistics services for dispatch team', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],

            // === REJECTED ===
            ['type' => 'OPEX', 'amount' => 1_800_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'rejected', 'days_ago' => 30, 'desc' => 'Luxury team retreat and team building (rejected — out of policy)', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 950_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'rejected', 'days_ago' => 22, 'desc' => 'Branding and merchandise for external partner event', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'CAPEX', 'amount' => 12_000_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'rejected', 'days_ago' => 15, 'desc' => 'New headquarters fit-out (deferred to next fiscal year)', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],

            // === DRAFT ===
            ['type' => 'OPEX', 'amount' => 200_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'draft', 'days_ago' => 0, 'desc' => 'Pending documentation for software procurement request', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'CAPEX', 'amount' => 5_000_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'draft', 'days_ago' => 0, 'desc' => 'Generator replacement proposal (gathering quotes)', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],

            // Fill to 50
            ['type' => 'OPEX', 'amount' => 65_000,  'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'posted', 'days_ago' => 70, 'desc' => 'Tea, coffee and refreshments for board meetings', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 195_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'posted', 'days_ago' => 68, 'desc' => 'Employee health insurance top-up for Q2', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 310_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'posted', 'days_ago' => 65, 'desc' => 'Book purchases for staff library and resource centre', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 420_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'paid',   'days_ago' => 22, 'desc' => 'Graphic design services for annual report layout', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 95_000,  'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'approved', 'days_ago' => 5, 'desc' => 'First aid kit and medical supplies restocking', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 770_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'approving', 'days_ago' => 2, 'desc' => 'Annual external audit fees and disbursements', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 280_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'submitted', 'days_ago' => 1, 'desc' => 'Conference registration fees for team leads', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'CAPEX', 'amount' => 6_200_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'approving', 'days_ago' => 4, 'desc' => 'Broadcast studio acoustic panels and lighting rig', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 110_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'approved', 'days_ago' => 6, 'desc' => 'Water dispenser purchase and installation fee', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 345_000, 'cc' => $cc2, 'ac' => $ac2, 'vendor' => $v2, 'status' => 'posted', 'days_ago' => 44, 'desc' => 'Hosting and domain renewal for all digital assets', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
            ['type' => 'OPEX', 'amount' => 570_000, 'cc' => $cc1, 'ac' => $ac,  'vendor' => $v,  'status' => 'posted', 'days_ago' => 33, 'desc' => 'Field mission transport and logistics expenses', 'requester' => $requester->id, 'period' => $period?->id, 'creator' => $admin->id],
        ];
    }

    // ── Requisition creation ──────────────────────────────────────────────────

    private function createRequisition(array $s, int $counter, $router, $admin, $finance, $ceo): void
    {
        $amountKobo = $s['amount'] * 100; // naira → kobo
        $submittedAt = now()->subDays($s['days_ago']);

        // Idempotent: skip if request_id already exists
        $requestId = 'DEMO-'.str_pad((string) $counter, 4, '0', STR_PAD_LEFT);
        if (Requisition::where('request_id', $requestId)->exists()) {
            return;
        }

        $ac = AccountCode::find($s['ac']);
        $taxes = $ac ? TaxCalculator::calculate($amountKobo, $ac) : [
            'vat_kobo' => 0, 'wht_kobo' => 0, 'total_kobo' => $amountKobo,
        ];

        $req = Requisition::create([
            'request_id' => $requestId,
            'requester_id' => $s['requester'],
            'type' => $s['type'],
            'amount_kobo' => $amountKobo,
            'currency' => 'NGN',
            'exchange_rate' => 1.0,
            'cost_centre_id' => $s['cc'],
            'account_code_id' => $s['ac'],
            'vendor_id' => $s['vendor'],
            'urgency' => 'standard',
            'description' => $s['desc'],
            'supporting_docs' => [],
            'status' => $s['status'],
            'tax_vat_kobo' => $taxes['vat_kobo'],
            'tax_wht_kobo' => $taxes['wht_kobo'],
            'total_kobo' => $taxes['total_kobo'],
            'financial_period_id' => $s['period'],
            'created_by' => $s['creator'],
            'submitted_at' => \in_array($s['status'], ['draft']) ? null : $submittedAt,
            'approved_at' => \in_array($s['status'], ['approved', 'matched', 'paid', 'posted']) ? $submittedAt->addDays(2) : null,
            'paid_at' => \in_array($s['status'], ['paid', 'posted']) ? $submittedAt->addDays(5) : null,
            'posted_at' => $s['status'] === 'posted' ? $submittedAt->addDays(6) : null,
        ]);

        // Create approval steps for terminal states
        if (\in_array($s['status'], ['approved', 'matched', 'paid', 'posted', 'rejected'])) {
            $approver = $finance ?? $admin;
            ApprovalStep::create([
                'requisition_id' => $req->id,
                'approver_id' => $approver->id,
                'level' => 1,
                'role_label' => 'Finance',
                'status' => $s['status'] === 'rejected' ? 'rejected' : 'approved',
                'decided_at' => $submittedAt->addDays(1),
                'comment' => $s['status'] === 'rejected' ? 'Does not meet policy requirements for approval.' : null,
            ]);
        }

        // Create pending approval step for approving/submitted
        if ($s['status'] === 'approving') {
            $approver = $finance ?? $admin;
            ApprovalStep::create([
                'requisition_id' => $req->id,
                'approver_id' => $approver->id,
                'level' => 1,
                'role_label' => 'Finance',
                'status' => 'pending',
            ]);
        }

        // Create payment + ledger for paid/posted
        if (\in_array($s['status'], ['paid', 'posted'])) {
            $payment = Payment::create([
                'requisition_id' => $req->id,
                'amount_kobo' => $taxes['total_kobo'],
                'method' => 'bank_transfer',
                'reference' => 'TRN-DEMO-'.$req->id,
                'paid_at' => $submittedAt->addDays(5),
                'paid_by' => ($finance ?? $admin)->id,
                'proof_path' => null,
            ]);
        }

        // Create invoice + goods receipt for matched/paid/posted (if ≥₦500K)
        if ($amountKobo >= 50_000_000 && \in_array($s['status'], ['matched', 'paid', 'posted'])) {
            Invoice::create([
                'requisition_id' => $req->id,
                'vendor_id' => $s['vendor'],
                'invoice_number' => 'INV-DEMO-'.$req->id,
                'amount_kobo' => $amountKobo,
                'received_at' => $submittedAt->addDays(3)->toDateString(),
                'file_path' => null,
                'match_status' => 'matched',
                'variance_kobo' => 0,
            ]);
            GoodsReceipt::create([
                'requisition_id' => $req->id,
                'received_by' => ($finance ?? $admin)->id,
                'received_at' => $submittedAt->addDays(3)->toDateString(),
                'notes' => 'Goods received in good condition per delivery note.',
                'file_path' => null,
                'created_by' => ($finance ?? $admin)->id,
            ]);
        }
    }

    // ── Petty cash activity ───────────────────────────────────────────────────

    private function seedPettyCashActivity($admin): void
    {
        $float = PettyCashFloat::where('status', 'active')->first();
        if (! $float) {
            return;
        }

        $descriptions = [
            'Taxi fare for staff to client meeting',
            'Printing of documents for external presentation',
            'Refreshments for visiting delegation',
            'Postage and courier for legal documents',
            'Stationery for reception desk',
        ];

        foreach ($descriptions as $i => $desc) {
            if ($float->balance_kobo < 200_00) { // < ₦200
                break;
            }
            $amount = [5_000_00, 3_500_00, 8_000_00, 2_200_00, 4_500_00][$i] ?? 5_000_00; // kobo
            PettyCashTransaction::create([
                'float_id' => $float->id,
                'amount_kobo' => $amount,
                'description' => $desc,
                'spent_by' => $admin->id,
                'spent_at' => now()->subDays(rand(1, 20)),
                'created_by' => $admin->id,
            ]);
            $float->decrement('balance_kobo', $amount);
        }
    }
}
