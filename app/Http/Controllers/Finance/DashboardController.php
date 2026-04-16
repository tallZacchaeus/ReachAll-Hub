<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\CostCentre;
use App\Models\Finance\FinancialPeriod;
use App\Models\Finance\PettyCashFloat;
use App\Models\Finance\Requisition;
use App\Models\Finance\Invoice;
use App\Services\Finance\BudgetEnforcer;
use App\Services\Finance\MoneyHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Role-adaptive finance dashboard.
     * Metrics are cached for 5 minutes to guarantee sub-2s load.
     */
    public function index(Request $request): Response
    {
        $user    = $request->user();
        $role    = $user->role;
        $period  = FinancialPeriod::where('year', now()->year)
            ->where('month', now()->month)
            ->first();

        $widgets = match (true) {
            \in_array($role, ['ceo', 'general_management', 'management'], true)
                => $this->execWidgets($user, $period),
            \in_array($role, ['finance', 'superadmin'], true)
                => $this->financeWidgets($user, $period),
            $role === 'hr'
                => $this->financeWidgets($user, $period),    // HR same as Finance
            default
                => $this->staffWidgets($user, $period),      // staff / dept_head treated here
        };

        // Dept heads also get a budget meter
        if ($user->department && \in_array($role, ['staff', 'management', 'hr'], true)) {
            $cc = CostCentre::where('head_user_id', $user->id)->first();
            if ($cc) {
                $widgets['budget_meter'] = $this->buildBudgetMeter($cc, $period);
            }
        }

        return Inertia::render('Finance/DashboardPage', [
            'widgets'    => $widgets,
            'user_role'  => $role,
            'period'     => $period ? [
                'label'  => $period->getLabel(),
                'status' => $period->status,
                'id'     => $period->id,
            ] : null,
        ]);
    }

    // ── Widget builders ───────────────────────────────────────────────────────

    private function staffWidgets($user, ?FinancialPeriod $period): array
    {
        $key = "finance_dash_staff_{$user->id}";
        return Cache::remember($key, 300, function () use ($user, $period) {
            $mine = Requisition::where('requester_id', $user->id);

            $pending = (clone $mine)->whereIn('status', ['draft', 'submitted', 'approving'])->count();
            $approved = (clone $mine)->where('status', 'approved')->count();
            $rejected = (clone $mine)->where('status', 'rejected')->count();
            $totalSpend = (clone $mine)->whereIn('status', ['paid', 'posted'])->sum('total_kobo');

            $recent = Requisition::where('requester_id', $user->id)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'request_id', 'description', 'amount_kobo', 'status', 'created_at'])
                ->map(fn ($r) => [
                    'id'          => $r->id,
                    'request_id'  => $r->request_id,
                    'description' => $r->description,
                    'amount_fmt'  => MoneyHelper::format($r->amount_kobo),
                    'status'      => $r->status,
                    'date'        => $r->created_at->toDateString(),
                ]);

            return [
                'summary' => [
                    ['label' => 'Pending',       'value' => $pending,  'color' => 'amber'],
                    ['label' => 'Approved',       'value' => $approved, 'color' => 'green'],
                    ['label' => 'Rejected',       'value' => $rejected, 'color' => 'red'],
                    ['label' => 'Total Paid Out', 'value' => MoneyHelper::compact($totalSpend), 'color' => 'blue'],
                ],
                'recent' => $recent,
            ];
        });
    }

    private function financeWidgets($user, ?FinancialPeriod $period): array
    {
        $key = "finance_dash_finance_{$period?->id}";
        return Cache::remember($key, 300, function () use ($period) {
            // Pending validations (submitted)
            $pendingSubmitted = Requisition::where('status', 'submitted')->count();

            // Pending matches (approved ≥₦500K not yet matched)
            $pendingMatch = Requisition::where('status', 'approved')
                ->where('amount_kobo', '>=', 50_000_000)
                ->count();

            // SLA breaches: submitted > 3 business days without progress
            $slaBreached = Requisition::where('status', 'submitted')
                ->where('submitted_at', '<', now()->subDays(3))
                ->count();

            // Low petty cash floats (< 20% of initial — approximate with < ₦5K balance)
            $lowFloats = PettyCashFloat::where('status', 'active')
                ->where('balance_kobo', '<', 50_000) // < ₦500
                ->count();

            // VAT + WHT MTD
            $vatMtd = 0;
            $whtMtd = 0;
            if ($period) {
                $vatMtd = Requisition::where('financial_period_id', $period->id)
                    ->whereIn('status', ['paid', 'posted'])->sum('tax_vat_kobo');
                $whtMtd = Requisition::where('financial_period_id', $period->id)
                    ->whereIn('status', ['paid', 'posted'])->sum('tax_wht_kobo');
            }

            // CAT2-07: Committed pipeline — submitted + approving per cost centre
            $committedPipeline = Requisition::whereIn('requisitions.status', ['submitted', 'approving'])
                ->join('cost_centres', 'cost_centres.id', '=', 'requisitions.cost_centre_id')
                ->groupBy('requisitions.cost_centre_id', 'cost_centres.code', 'cost_centres.name')
                ->selectRaw('cost_centres.code, cost_centres.name, COUNT(*) as count, SUM(requisitions.total_kobo) as total_kobo')
                ->orderByDesc('total_kobo')
                ->limit(10)
                ->get()
                ->map(fn ($r) => [
                    'code'      => $r->code,
                    'name'      => $r->name,
                    'count'     => (int) $r->count,
                    'total_fmt' => MoneyHelper::compact((int) $r->total_kobo),
                ]);

            // Spend trend — last 6 months
            $trend = $this->buildSpendTrend(6);

            return [
                'summary' => [
                    ['label' => 'Pending Validation', 'value' => $pendingSubmitted, 'color' => 'amber'],
                    ['label' => 'Pending Match',       'value' => $pendingMatch,     'color' => 'blue'],
                    ['label' => 'SLA Breaches',        'value' => $slaBreached,      'color' => 'red'],
                    ['label' => 'Low Cash Alerts',     'value' => $lowFloats,        'color' => 'orange'],
                ],
                'tax_mtd' => [
                    'vat_fmt' => MoneyHelper::format($vatMtd),
                    'wht_fmt' => MoneyHelper::format($whtMtd),
                ],
                'trend'              => $trend,
                'committed_pipeline' => $committedPipeline,
            ];
        });
    }

    private function execWidgets($user, ?FinancialPeriod $period): array
    {
        $key = "finance_dash_exec_{$period?->id}";
        return Cache::remember($key, 300, function () use ($period) {
            // Org-wide spend MTD
            $mtdSpend = 0;
            if ($period) {
                $mtdSpend = Requisition::where('financial_period_id', $period->id)
                    ->whereIn('status', ['approved', 'matched', 'paid', 'posted'])
                    ->sum('total_kobo');
            }

            // Budget health: cost centres at/over 80%
            $atRisk = CostCentre::where('status', 'active')
                ->where('budget_kobo', '>', 0)
                ->get()
                ->filter(fn ($cc) => BudgetEnforcer::currentPercentage($cc) >= 80)
                ->count();

            // Pending exec approvals (approvals pending for CEO/management)
            $pendingExec = \App\Models\Finance\ApprovalStep::where('status', 'pending')
                ->whereIn('role_label', ['CEO', 'Finance Director', 'MD', 'CEO Budget Override'])
                ->count();

            // CAPEX pipeline
            $capexPending = Requisition::where('type', 'CAPEX')
                ->whereIn('status', ['submitted', 'approving', 'approved', 'matched'])
                ->sum('amount_kobo');

            // Override history (last 30 days)
            $overrides = Requisition::whereNotNull('budget_override_reason')
                ->where('budget_override_at', '>=', now()->subDays(30))
                ->count();

            // Budget health table
            $budgetHealth = CostCentre::where('status', 'active')
                ->where('budget_kobo', '>', 0)
                ->orderByDesc('budget_kobo')
                ->limit(10)
                ->get()
                ->map(fn ($cc) => [
                    'name'       => $cc->name,
                    'code'       => $cc->code,
                    'budget_fmt' => MoneyHelper::compact($cc->budget_kobo),
                    'pct'        => BudgetEnforcer::currentPercentage($cc),
                ]);

            $trend = $this->buildSpendTrend(6);

            return [
                'summary' => [
                    ['label' => 'MTD Spend',       'value' => MoneyHelper::compact($mtdSpend),  'color' => 'blue'],
                    ['label' => 'Cost Centres At Risk', 'value' => $atRisk,                     'color' => 'red'],
                    ['label' => 'Pending Exec Approvals', 'value' => $pendingExec,              'color' => 'amber'],
                    ['label' => 'Override Actions (30d)', 'value' => $overrides,                'color' => 'purple'],
                ],
                'capex_pipeline_fmt' => MoneyHelper::compact($capexPending),
                'budget_health'      => $budgetHealth,
                'trend'              => $trend,
            ];
        });
    }

    private function buildBudgetMeter(CostCentre $cc, ?FinancialPeriod $period): array
    {
        $result = BudgetEnforcer::check($cc, 0, $period?->id);
        return [
            'name'       => $cc->name,
            'pct'        => $result['percentage'],
            'used_fmt'   => MoneyHelper::compact($result['used_kobo']),
            'budget_fmt' => MoneyHelper::compact($result['budget_kobo']),
            'status'     => $result['status'],
        ];
    }

    private function buildSpendTrend(int $months): array
    {
        $rows = [];
        $current = now()->startOfMonth();
        for ($i = $months - 1; $i >= 0; $i--) {
            $m = $current->subMonths($i);
            $spend = Requisition::whereYear('created_at', $m->year)
                ->whereMonth('created_at', $m->month)
                ->whereIn('status', ['paid', 'posted'])
                ->sum('total_kobo');
            $rows[] = [
                'month' => $m->format('M y'),
                'kobo'  => (int) $spend,
                'fmt'   => MoneyHelper::compact((int) $spend),
            ];
        }
        return $rows;
    }
}
