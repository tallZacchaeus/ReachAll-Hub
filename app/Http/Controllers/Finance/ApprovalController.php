<?php

namespace App\Http\Controllers\Finance;

use App\Events\Finance\RequisitionStateChanged;
use App\Http\Controllers\Controller;
use App\Models\Finance\ApprovalStep;
use App\Models\Finance\FinanceAuditLog;
use App\Models\Finance\Requisition;
use App\Models\User;
use App\Notifications\Finance\BudgetAlert;
use App\Notifications\Finance\RequisitionDecision;
use App\Notifications\Finance\RequisitionSubmitted;
use App\Services\Finance\ApprovalRouter;
use App\Services\Finance\BudgetEnforcer;
use App\Services\Finance\MoneyHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalController extends Controller
{
    // ── Approver queue ───────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = ApprovalStep::with([
                'requisition.requester:id,name,department',
                'requisition.costCentre:id,code,name',
                'requisition.vendor:id,name',
            ])
            ->where('approver_id', $user->id)
            ->where('status', 'pending')
            ->orderBy('sla_deadline');

        // Filters
        if ($request->filled('urgency')) {
            $query->whereHas('requisition', fn ($q) => $q->where('urgency', $request->get('urgency')));
        }

        if ($request->filled('type')) {
            $query->whereHas('requisition', fn ($q) => $q->where('type', $request->get('type')));
        }

        if ($request->filled('min_amount')) {
            $minKobo = MoneyHelper::toKobo((float) $request->get('min_amount'));
            $query->whereHas('requisition', fn ($q) => $q->where('amount_kobo', '>=', $minKobo));
        }

        if ($request->filled('max_amount')) {
            $maxKobo = MoneyHelper::toKobo((float) $request->get('max_amount'));
            $query->whereHas('requisition', fn ($q) => $q->where('amount_kobo', '<=', $maxKobo));
        }

        $steps = $query->get()->map(fn (ApprovalStep $step) => $this->formatQueueItem($step));

        $overdueCount = ApprovalStep::where('approver_id', $user->id)
            ->where('status', 'pending')
            ->whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', now())
            ->count();

        return Inertia::render('Finance/ApprovalsPage', [
            'steps'        => $steps,
            'overdueCount' => $overdueCount,
            'filters'      => $request->only(['urgency', 'type', 'min_amount', 'max_amount']),
        ]);
    }

    // ── Approval detail + decision ───────────────────────────────────────────

    public function show(Request $request, int $requisitionId): Response
    {
        $requisition = Requisition::with([
            'requester:id,name,department,email',
            'costCentre:id,code,name,budget_kobo',
            'accountCode:id,code,description,tax_vat_applicable,tax_wht_applicable,wht_rate',
            'vendor:id,name,bank_name,contact_email',
            'approvalSteps.approver:id,name,role',
        ])->findOrFail($requisitionId);

        // Find the pending step for the current user
        $myStep = $requisition->approvalSteps()
            ->where('approver_id', $request->user()->id)
            ->where('status', 'pending')
            ->first();

        if ($myStep) {
            $this->authorize('decide', $myStep);
        } else {
            // Allow viewing if the user is a finance admin or is in the chain
            abort_unless(
                $request->user()->isFinanceAdmin()
                    || $requisition->approvalSteps()->where('approver_id', $request->user()->id)->exists(),
                403
            );
        }

        $steps = $requisition->approvalSteps->map(fn (ApprovalStep $s) => [
            'id'           => $s->id,
            'level'        => $s->level,
            'role_label'   => $s->role_label,
            'approver'     => ['id' => $s->approver->id, 'name' => $s->approver->name, 'role' => $s->approver->role],
            'status'       => $s->status,
            'comment'      => $s->comment,
            'acted_at'     => $s->acted_at?->toISOString(),
            'sla_deadline' => $s->sla_deadline?->toISOString(),
            'is_overdue'   => $s->isOverdue(),
        ]);

        return Inertia::render('Finance/ApprovalDetailPage', [
            'requisition' => [
                'id'           => $requisition->id,
                'request_id'   => $requisition->request_id,
                'type'         => $requisition->type,
                'amount_kobo'  => $requisition->amount_kobo,
                'amount_fmt'   => MoneyHelper::format($requisition->amount_kobo),
                'tax_vat_fmt'  => MoneyHelper::format($requisition->tax_vat_kobo),
                'tax_wht_fmt'  => MoneyHelper::format($requisition->tax_wht_kobo),
                'total_fmt'    => MoneyHelper::format($requisition->total_kobo),
                'currency'     => $requisition->currency,
                'urgency'      => $requisition->urgency,
                'description'  => $requisition->description,
                'status'       => $requisition->status,
                'requester'    => $requisition->requester ? ['id' => $requisition->requester->id, 'name' => $requisition->requester->name, 'department' => $requisition->requester->department] : null,
                'cost_centre'  => $requisition->costCentre ? ['code' => $requisition->costCentre->code, 'name' => $requisition->costCentre->name, 'budget_kobo' => $requisition->costCentre->budget_kobo, 'budget_fmt' => MoneyHelper::format($requisition->costCentre->budget_kobo)] : null,
                'account_code' => $requisition->accountCode ? ['code' => $requisition->accountCode->code, 'description' => $requisition->accountCode->description] : null,
                'vendor'       => $requisition->vendor ? ['name' => $requisition->vendor->name, 'bank_name' => $requisition->vendor->bank_name, 'contact_email' => $requisition->vendor->contact_email] : null,
                'supporting_docs' => $requisition->supporting_docs ?? [],
                'submitted_at' => $requisition->submitted_at?->toISOString(),
            ],
            'steps'        => $steps,
            'myStep'       => $myStep ? [
                'id'                 => $myStep->id,
                'level'              => $myStep->level,
                'status'             => $myStep->status,
                'is_budget_override' => $myStep->is_budget_override,
            ] : null,
            'budgetOverrideRequired' => $requisition->budget_override_required,
            'canDecide'    => $myStep !== null,
        ]);
    }

    // ── Decision: Approve / Reject / Query ───────────────────────────────────

    public function decide(Request $request, int $stepId): RedirectResponse
    {
        $step = ApprovalStep::with(['requisition.approvalSteps', 'approver'])->findOrFail($stepId);

        $this->authorize('decide', $step);

        $rules = [
            'action'  => ['required', 'in:approve,reject,query'],
            'comment' => [
                'nullable', 'string', 'max:1000',
                $request->get('action') !== 'approve' ? 'required' : 'nullable',
            ],
        ];

        // CEO budget override step requires a documented reason (min 20 chars, max 1000)
        if ($step->is_budget_override && $request->get('action') === 'approve') {
            $rules['override_reason'] = ['required', 'string', 'min:20', 'max:1000'];
        }

        $validated = $request->validate($rules);

        DB::transaction(function () use ($step, $validated, $request) {
            $req = $step->requisition;

            $step->update([
                'status'   => match ($validated['action']) {
                    'approve' => 'approved',
                    'reject'  => 'rejected',
                    'query'   => 'rejected',
                },
                'comment'  => $validated['comment'] ?? null,
                'acted_at' => now(),
            ]);

            $prev = $req->status;

            if ($validated['action'] === 'approve') {
                // ── CEO budget override step: store reason and complete approval
                if ($step->is_budget_override) {
                    $reason = $validated['override_reason'];

                    $req->update([
                        'budget_override_required' => false,
                        'budget_override_reason'   => $reason,
                        'budget_override_by'       => $request->user()->id,
                        'budget_override_at'       => now(),
                        'status'                   => 'approved',
                        'approved_at'              => now(),
                    ]);

                    // Permanent audit entry for the override
                    FinanceAuditLog::insert([
                        'user_id'     => $request->user()->id,
                        'model_type'  => Requisition::class,
                        'model_id'    => $req->id,
                        'action'      => 'budget_override',
                        'before_json' => null,
                        'after_json'  => json_encode([
                            'override_reason' => $reason,
                            'amount_kobo'     => $req->amount_kobo,
                            'cost_centre_id'  => $req->cost_centre_id,
                        ]),
                        'logged_at'   => now()->toDateTimeString(),
                    ]);

                    event(new RequisitionStateChanged($req, $prev));
                    $req->requester->notify(new RequisitionDecision($req, 'approved'));
                } else {
                    $this->handleApprove($req, $step);
                }
            } else {
                $req->update(['status' => 'rejected']);
                event(new RequisitionStateChanged($req, $prev));
                $req->requester->notify(new RequisitionDecision(
                    $req,
                    $validated['action'] === 'query' ? 'queried' : 'rejected',
                    $validated['comment']
                ));
            }
        });

        return redirect("/finance/approvals")
            ->with('success', 'Decision recorded.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function handleApprove(Requisition $req, ApprovalStep $approvedStep): void
    {
        // Find the next pending step
        $nextStep = $req->approvalSteps()
            ->where('level', '>', $approvedStep->level)
            ->where('status', 'pending')
            ->orderBy('level')
            ->first();

        if ($nextStep) {
            // Activate next step — set SLA deadline
            $nextStep->update([
                'sla_deadline' => now()->addHours(ApprovalRouter::SLA_HOURS),
            ]);

            // Notify next approver
            $nextStep->approver->notify(new RequisitionSubmitted($req));

            $req->update(['status' => 'approving']);
        } else {
            // All normal steps done — run budget check before final approval
            $this->finalisApproval($req, $approvedStep);
        }
    }

    private function finalisApproval(Requisition $req, ApprovalStep $lastStep): void
    {
        $costCentre = $req->costCentre;
        $budget     = $costCentre
            ? BudgetEnforcer::check($costCentre, $req->amount_kobo, $req->financial_period_id)
            : ['status' => 'allow', 'percentage' => 0.0];

        if ($budget['status'] === 'block_100') {
            // ── Budget exceeded: create a CEO override step ─────────────────
            $req->update(['budget_override_required' => true]);

            $ceo = User::where('role', 'ceo')->first()
                ?? User::where('role', 'superadmin')->first();

            if ($ceo) {
                ApprovalStep::create([
                    'requisition_id'     => $req->id,
                    'approver_id'        => $ceo->id,
                    'level'              => 99,
                    'role_label'         => 'CEO Budget Override',
                    'status'             => 'pending',
                    'sla_deadline'       => now()->addHours(ApprovalRouter::SLA_HOURS),
                    'is_budget_override' => true,
                ]);

                $ceo->notify(new BudgetAlert('block_100', $costCentre, $req, $budget['percentage']));
            }

            // Finance role users also notified
            User::where('role', 'finance')->each(
                fn (User $u) => $u->notify(new BudgetAlert('block_100', $costCentre, $req, $budget['percentage']))
            );

            // Log the block as a special audit entry
            FinanceAuditLog::insert([
                'user_id'     => auth()->id(),
                'model_type'  => Requisition::class,
                'model_id'    => $req->id,
                'action'      => 'budget_blocked',
                'before_json' => null,
                'after_json'  => json_encode([
                    'budget_status' => $budget,
                    'amount_kobo'   => $req->amount_kobo,
                ]),
                'logged_at'   => now()->toDateTimeString(),
            ]);

            $req->update(['status' => 'approving']); // stays in approving until CEO acts

            return;
        }

        // ── Send budget warning notifications (warn_80 / warn_90) ──────────
        if (\in_array($budget['status'], ['warn_80', 'warn_90'], true) && $costCentre) {
            User::where('role', 'finance')->each(
                fn (User $u) => $u->notify(new BudgetAlert($budget['status'], $costCentre, $req, $budget['percentage']))
            );
            if ($costCentre->head_user_id) {
                $costCentre->head->notify(new BudgetAlert($budget['status'], $costCentre, $req, $budget['percentage']));
            }
        }

        // ── All clear: fully approve ────────────────────────────────────────
        $prev = $req->status;
        $req->update([
            'status'      => 'approved',
            'approved_at' => now(),
        ]);
        event(new RequisitionStateChanged($req, $prev));
        $req->requester->notify(new RequisitionDecision($req, 'approved'));
    }

    private function formatQueueItem(ApprovalStep $step): array
    {
        $req = $step->requisition;

        return [
            'step_id'        => $step->id,
            'requisition_id' => $req->id,
            'request_id'     => $req->request_id,
            'type'           => $req->type,
            'amount_kobo'    => $req->amount_kobo,
            'amount_fmt'     => MoneyHelper::format($req->amount_kobo),
            'urgency'        => $req->urgency,
            'description'    => $req->description,
            'requester_name' => $req->requester?->name,
            'department'     => $req->requester?->department,
            'cost_centre'    => $req->costCentre ? $req->costCentre->code . ' ' . $req->costCentre->name : null,
            'vendor'         => $req->vendor?->name,
            'role_label'     => $step->role_label,
            'sla_deadline'   => $step->sla_deadline?->toISOString(),
            'is_overdue'     => $step->isOverdue(),
            'submitted_at'   => $req->submitted_at?->toDateString(),
        ];
    }
}
