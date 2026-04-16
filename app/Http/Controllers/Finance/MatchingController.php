<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\FinanceAuditLog;
use App\Models\Finance\GoodsReceipt;
use App\Models\Finance\Invoice;
use App\Models\Finance\Requisition;
use App\Models\User;
use App\Notifications\Finance\VarianceFlagged;
use App\Services\Finance\FinanceRoleHelper;
use App\Services\Finance\MoneyHelper;
use App\Services\Finance\ThreeWayMatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MatchingController extends Controller
{
    // ── Queue of approved requisitions awaiting match ────────────────────────

    public function index(Request $request): Response
    {
        $this->authorizeFinance($request);

        // Approved reqs that don't yet have a matched invoice
        $pending = Requisition::with([
                'requester:id,name,department',
                'vendor:id,name',
                'costCentre:id,code,name',
                'accountCode:id,code,description',
                'invoices',
                'goodsReceipts',
            ])
            ->whereIn('status', ['approved', 'approving'])
            ->orderByDesc('approved_at')
            ->get()
            ->map(fn (Requisition $r) => $this->formatRequisition($r));

        // Already matched (last 30 days) — for history panel
        $matched = Requisition::with(['requester:id,name', 'vendor:id,name', 'invoices'])
            ->where('status', 'matched')
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get()
            ->map(fn (Requisition $r) => $this->formatRequisition($r));

        return Inertia::render('Finance/ThreeWayMatchPage', [
            'pending' => $pending,
            'matched' => $matched,
        ]);
    }

    // ── Upload invoice + goods receipt ───────────────────────────────────────

    public function upload(Request $request, int $requisitionId): RedirectResponse
    {
        $this->authorizeFinance($request);

        $req = Requisition::whereIn('status', ['approved', 'approving'])->findOrFail($requisitionId);

        $request->validate([
            'invoice_number' => ['required', 'string', 'max:100', 'unique:invoices,invoice_number'],
            'invoice_amount' => ['required', 'numeric', 'min:1'],
            'invoice_date'   => ['required', 'date'],
            'invoice_file'   => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'receipt_date'   => ['required', 'date'],
            'receipt_notes'  => ['nullable', 'string', 'max:500'],
            'receipt_file'   => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        DB::transaction(function () use ($request, $req) {
            $invoicePath = $request->file('invoice_file')
                ->store("matching/invoices/{$req->id}", 'finance');

            $receiptPath = $request->file('receipt_file')
                ->store("matching/receipts/{$req->id}", 'finance');

            Invoice::create([
                'requisition_id' => $req->id,
                'vendor_id'      => $req->vendor_id,
                'invoice_number' => $request->input('invoice_number'),
                'amount_kobo'    => MoneyHelper::toKobo((float) $request->input('invoice_amount')),
                'received_at'    => $request->input('invoice_date'),
                'file_path'      => $invoicePath,
                'match_status'   => 'pending',
                'created_by'     => $request->user()->id,
            ]);

            GoodsReceipt::create([
                'requisition_id' => $req->id,
                'received_by'    => $request->user()->id,
                'received_at'    => $request->input('receipt_date'),
                'notes'          => $request->input('receipt_notes'),
                'file_path'      => $receiptPath,
                'created_by'     => $request->user()->id,
            ]);
        });

        return back()->with('success', 'Documents uploaded. Run match to proceed.');
    }

    // ── Run three-way match ──────────────────────────────────────────────────

    public function match(Request $request, int $requisitionId): RedirectResponse
    {
        $this->authorizeFinance($request);

        $req = Requisition::with([
            'invoices', 'goodsReceipts', 'vendor', 'accountCode',
        ])->whereIn('status', ['approved', 'approving'])->findOrFail($requisitionId);

        $invoice = $req->invoices()->latest()->first();
        $receipt = $req->goodsReceipts()->latest()->first();

        if (! $invoice || ! $receipt) {
            return back()->withErrors(['match' => 'Both an invoice and goods receipt must be uploaded before matching.']);
        }

        $result = ThreeWayMatcher::match($req, $invoice, $receipt);

        DB::transaction(function () use ($req, $invoice, $result, $request) {
            $invoice->update([
                'match_status'  => $result['match_status'],
                'variance_kobo' => $result['variance_kobo'],
            ]);

            if ($result['match_status'] === 'matched') {
                $req->update(['status' => 'matched']);
            }
        });

        if ($result['match_status'] === 'variance') {
            // Notify CEO to review variance
            $ceo = User::where('role', 'ceo')->first()
                ?? User::where('role', 'superadmin')->first();

            if ($ceo) {
                $ceo->notify(new VarianceFlagged($req, $invoice, $result['variance_kobo'], $result['flags']));
            }

            return back()->with('warning', 'Match variance detected. CEO review required before payment.');
        }

        if ($result['match_status'] === 'blocked') {
            return back()->withErrors(['match' => 'Match blocked: ' . collect($result['flags'])->pluck('description')->implode(' ')]);
        }

        return back()->with('success', 'Three-way match confirmed. Requisition is ready for payment.');
    }

    // ── CEO accepts a variance (allows payment despite discrepancy) ──────────

    public function acceptVariance(Request $request, int $requisitionId): RedirectResponse
    {
        $user = $request->user();

        if (! \in_array($user->role, FinanceRoleHelper::FINANCE_EXEC_ROLES, true)) {
            abort(403, 'Only executive roles may accept a match variance.');
        }

        $req = Requisition::with(['invoices'])->findOrFail($requisitionId);

        $request->validate([
            'override_reason' => ['required', 'string', 'min:30'],
        ]);

        $invoice = $req->invoices()->latest()->first();

        if (! $invoice || $invoice->match_status !== 'variance') {
            return back()->withErrors(['match' => 'No variance to accept on this requisition.']);
        }

        DB::transaction(function () use ($req, $invoice, $request, $user) {
            $invoice->update(['match_status' => 'matched']);
            $req->update(['status' => 'matched']);

            // F2-04: Explicit audit entry so override reasons are searchable in the
            // finance audit log independently of the model observer.
            FinanceAuditLog::insert([
                'user_id'     => $user->id,
                'model_type'  => Requisition::class,
                'model_id'    => $req->id,
                'action'      => 'variance_accepted',
                'before_json' => json_encode(['match_status' => 'variance']),
                'after_json'  => json_encode([
                    'match_status'    => 'matched',
                    'override_reason' => $request->input('override_reason'),
                    'override_by'     => $user->id,
                ]),
                'logged_at'   => now()->toDateTimeString(),
            ]);
        });

        return redirect('/finance/matching')->with('success', 'Variance accepted. Requisition cleared for payment.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function formatRequisition(Requisition $r): array
    {
        $latestInvoice = $r->invoices->first();
        $hasReceipt    = $r->goodsReceipts->isNotEmpty();

        return [
            'id'               => $r->id,
            'request_id'       => $r->request_id,
            'status'           => $r->status,
            'type'             => $r->type,
            'amount_kobo'      => $r->amount_kobo,
            'amount_fmt'       => MoneyHelper::format($r->amount_kobo),
            'description'      => $r->description,
            'requester'        => $r->requester?->name,
            'department'       => $r->requester?->department,
            'vendor'           => $r->vendor?->name,
            'cost_centre'      => $r->costCentre ? $r->costCentre->code . ' ' . $r->costCentre->name : null,
            'requires_match'   => ThreeWayMatcher::isMatchRequired($r),
            'has_invoice'      => $latestInvoice !== null,
            'has_receipt'      => $hasReceipt,
            'invoice' => $latestInvoice ? [
                'id'             => $latestInvoice->id,
                'invoice_number' => $latestInvoice->invoice_number,
                'amount_fmt'     => MoneyHelper::format($latestInvoice->amount_kobo),
                'match_status'   => $latestInvoice->match_status,
                'variance_fmt'   => MoneyHelper::format(\abs($latestInvoice->variance_kobo)),
                'variance_kobo'  => $latestInvoice->variance_kobo,
                'file_url'       => route('finance.document.invoice', $latestInvoice->id),
            ] : null,
            'approved_at'      => $r->approved_at?->toDateString(),
        ];
    }

    private function authorizeFinance(Request $request): void
    {
        abort_unless(
            \in_array($request->user()?->role, FinanceRoleHelper::FINANCE_ADMIN_ROLES, true),
            403
        );
    }
}
