<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\AccountCode;
use App\Models\Finance\CostCentre;
use App\Models\Finance\PettyCashFloat;
use App\Models\Finance\PettyCashReconciliation;
use App\Models\Finance\PettyCashTransaction;
use App\Models\Finance\Requisition;
use App\Services\Finance\MoneyHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReconciliationController extends Controller
{
    /** GET /finance/reconciliation — Finance queue of submitted reconciliations */
    public function index(): Response
    {
        $recons = PettyCashReconciliation::with(['float.custodian', 'submitter'])
            ->where('status', 'submitted')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($r) => [
                'id'               => $r->id,
                'period_start'     => $r->period_start->toDateString(),
                'period_end'       => $r->period_end->toDateString(),
                'total_fmt'        => $r->totalFmt(),
                'total_kobo'       => $r->total_expenses_kobo,
                'status'           => $r->status,
                'submitted_at'     => $r->created_at->toIso8601String(),
                'transaction_count'=> $r->transactions()->count(),
                'custodian'        => [
                    'name'       => $r->float?->custodian?->name ?? '—',
                    'department' => $r->float?->custodian?->department ?? '—',
                ],
                'float' => [
                    'limit_fmt'   => $r->float?->limitFmt() ?? '—',
                    'balance_fmt' => $r->float?->balanceFmt() ?? '—',
                ],
            ]);

        return Inertia::render('Finance/ReconciliationListPage', [
            'reconciliations' => $recons,
        ]);
    }

    /** GET /finance/reconciliation/{id} — detail + receipt review */
    public function show(int $id): Response
    {
        $recon = PettyCashReconciliation::with(['float.custodian', 'submitter', 'reviewer'])
            ->findOrFail($id);

        $transactions = PettyCashTransaction::with('accountCode')
            ->where('reconciliation_id', $recon->id)
            ->orderBy('date')
            ->get()
            ->map(fn ($t) => [
                'id'           => $t->id,
                'amount_kobo'  => $t->amount_kobo,
                'amount_fmt'   => $t->amountFmt(),
                'description'  => $t->description,
                'date'         => $t->date->toDateString(),
                'receipt_path' => $t->receipt_path,
                'status'       => $t->status,
                'account_code' => $t->accountCode
                    ? ['code' => $t->accountCode->code, 'description' => $t->accountCode->description]
                    : null,
            ]);

        return Inertia::render('Finance/ReconciliationDetailPage', [
            'reconciliation' => [
                'id'           => $recon->id,
                'period_start' => $recon->period_start->toDateString(),
                'period_end'   => $recon->period_end->toDateString(),
                'total_fmt'    => $recon->totalFmt(),
                'total_kobo'   => $recon->total_expenses_kobo,
                'status'       => $recon->status,
                'notes'        => $recon->notes,
                'reviewed_at'  => $recon->reviewed_at?->toIso8601String(),
                'custodian'    => [
                    'name'       => $recon->float?->custodian?->name ?? '—',
                    'department' => $recon->float?->custodian?->department ?? '—',
                ],
                'float' => [
                    'limit_fmt'   => $recon->float?->limitFmt() ?? '—',
                    'balance_fmt' => $recon->float?->balanceFmt() ?? '—',
                ],
                'replenishment_req_id' => $recon->replenishment_requisition_id,
            ],
            'transactions' => $transactions,
            'canReview'    => request()->user()?->hasPermission('finance.admin')
                && $recon->status === 'submitted',
        ]);
    }

    /** POST /finance/reconciliation/{id}/approve */
    public function approve(Request $request, int $id): RedirectResponse
    {
        $recon = PettyCashReconciliation::with('float')->findOrFail($id);
        $this->authorize('reviewReconciliation', $recon);

        $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($recon, $request) {
            // Mark all linked transactions reconciled
            PettyCashTransaction::where('reconciliation_id', $recon->id)
                ->update(['status' => 'reconciled']);

            // Update float: reset last_reconciled_at, replenish balance to limit
            $float = $recon->float;
            $float->update([
                'last_reconciled_at'  => now(),
                'current_balance_kobo'=> $float->float_limit_kobo,
            ]);

            // Create replenishment Requisition routed to Finance tier
            $financeCC = CostCentre::where('code', '3200')->where('status', 'active')->first();
            $miscAC    = AccountCode::where('code', '6012')->where('status', 'active')->first()
                      ?? AccountCode::where('status', 'active')->first();

            if ($financeCC && $miscAC && $recon->total_expenses_kobo > 0) {
                $reqId = Requisition::generateRequestId();
                $repReq = Requisition::create([
                    'request_id'      => $reqId,
                    'requester_id'    => $request->user()->id,
                    'type'            => 'PETTY',
                    'amount_kobo'     => $recon->total_expenses_kobo,
                    'currency'        => 'NGN',
                    'exchange_rate'   => '1.0000',
                    'cost_centre_id'  => $financeCC->id,
                    'account_code_id' => $miscAC->id,
                    'vendor_id'       => null,
                    'urgency'         => 'standard',
                    'description'     => "Petty Cash Replenishment — {$recon->period_start->format('d M')}–{$recon->period_end->format('d M Y')} (Recon #{$recon->id})",
                    'supporting_docs' => [],
                    'status'          => 'approved', // Finance-initiated replenishment auto-approved
                    'tax_vat_kobo'    => 0,
                    'tax_wht_kobo'    => 0,
                    'total_kobo'      => $recon->total_expenses_kobo,
                    'submitted_at'    => now(),
                    'approved_at'     => now(),
                    'created_by'      => $request->user()->id,
                    'updated_by'      => $request->user()->id,
                ]);

                $recon->replenishment_requisition_id = $repReq->id;
            }

            $recon->update([
                'status'        => 'approved',
                'reviewed_by'   => $request->user()->id,
                'reviewed_at'   => now(),
                'notes'         => $request->input('notes'),
                'replenishment_requisition_id' => $recon->replenishment_requisition_id,
            ]);
        });

        return redirect()->route('finance.reconciliation.index')
            ->with('success', 'Reconciliation approved and float replenished.');
    }

    /** POST /finance/reconciliation/{id}/reject */
    public function reject(Request $request, int $id): RedirectResponse
    {
        $recon = PettyCashReconciliation::findOrFail($id);
        $this->authorize('reviewReconciliation', $recon);

        $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $recon->update([
            'status'      => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'notes'       => $request->input('notes'),
        ]);

        // Return transactions to pending_recon so custodian can fix and resubmit
        PettyCashTransaction::where('reconciliation_id', $recon->id)
            ->update(['status' => 'pending_recon', 'reconciliation_id' => null]);

        return redirect()->route('finance.reconciliation.index')
            ->with('success', 'Reconciliation rejected. Transactions returned to the custodian.');
    }
}
