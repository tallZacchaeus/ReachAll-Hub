<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Jobs\Finance\PostLedgerEntry;
use App\Models\Finance\Payment;
use App\Models\Finance\Requisition;
use App\Services\Finance\ClosedPeriodGuard;
use App\Services\Finance\MoneyHelper;
use App\Services\Finance\TaxCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    // ── List of requisitions ready to pay ───────────────────────────────────

    public function index(Request $request): Response
    {
        $this->authorizeFinance($request);

        // Matched reqs + (optionally) approved reqs < ₦500K that skipped matching
        $ready = Requisition::with([
                'requester:id,name,department',
                'vendor:id,name,bank_account,bank_name',
                'costCentre:id,code,name',
                'accountCode:id,code,description,tax_vat_applicable,tax_wht_applicable,wht_rate',
                'payment',
            ])
            ->where(function ($q) {
                $q->where('status', 'matched')
                  ->orWhere(function ($q2) {
                      // < ₦500K can be paid from 'approved' state
                      $q2->where('status', 'approved')
                         ->where('amount_kobo', '<', 50_000_000);
                  });
            })
            ->whereDoesntHave('payment') // not yet paid
            ->orderByDesc('approved_at')
            ->get()
            ->map(fn (Requisition $r) => $this->formatReadyItem($r));

        // Recent payments (last 30) for the history table
        $recent = Payment::with([
                'requisition:id,request_id,description,amount_kobo',
                'requisition.requester:id,name',
                'paidBy:id,name',
            ])
            ->latest('paid_at')
            ->limit(30)
            ->get()
            ->map(fn (Payment $p) => [
                'id'          => $p->id,
                'request_id'  => $p->requisition?->request_id,
                'description' => $p->requisition?->description,
                'amount_fmt'  => MoneyHelper::format($p->amount_kobo),
                'method'      => $p->method,
                'reference'   => $p->reference,
                'paid_at'     => $p->paid_at->toDateString(),
                'paid_by'     => $p->paidBy?->name,
            ]);

        return Inertia::render('Finance/PaymentsPage', [
            'ready'  => $ready,
            'recent' => $recent,
        ]);
    }

    // ── Record a payment ─────────────────────────────────────────────────────

    public function pay(Request $request, int $requisitionId): RedirectResponse
    {
        $this->authorizeFinance($request);

        $req = Requisition::with(['accountCode', 'vendor'])->findOrFail($requisitionId);

        // Idempotency guard — reject if already paid or posted (double-submit prevention)
        if (in_array($req->status, ['paid', 'posted'], true)) {
            return back()->with('error', 'This requisition has already been paid.');
        }

        // Block writes to closed periods
        ClosedPeriodGuard::assertWriteable(
            $request->input('paid_at', now()->toDateString()),
            $request->user(),
            (bool) $request->input('ceo_override')
        );

        // Enforce match requirement
        if (! $req->canPay()) {
            return back()->withErrors([
                'payment' => $req->requiresThreeWayMatch()
                    ? 'This requisition (≥ ₦500K) requires a confirmed three-way match before payment.'
                    : 'This requisition is not in a payable state.',
            ]);
        }

        $request->validate([
            'method'    => ['required', 'in:bank_transfer,cheque,cash'],
            'reference' => ['required', 'string', 'max:100'],
            'paid_at'   => ['required', 'date'],
            'proof'     => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        // Recompute tax in case account code changed since submission
        $tax = $req->accountCode
            ? TaxCalculator::calculate($req->amount_kobo, $req->accountCode)
            : ['vat_kobo' => 0, 'wht_kobo' => 0, 'total_kobo' => $req->amount_kobo];

        // Sync tax fields on the requisition
        $req->update([
            'tax_vat_kobo' => $tax['vat_kobo'],
            'tax_wht_kobo' => $tax['wht_kobo'],
            'total_kobo'   => $tax['total_kobo'],
        ]);

        $proofPath = $request->file('proof')
            ->store("payments/{$req->id}", 'finance');

        DB::transaction(function () use ($req, $request, $tax, $proofPath) {
            // Lock the row to prevent concurrent double-payments on the same requisition
            $locked = Requisition::where('id', $req->id)->lockForUpdate()->first();
            if (! $locked || ! in_array($locked->status, ['matched', 'approved'], true)) {
                throw new \RuntimeException('Requisition is no longer in a payable state.');
            }

            $payment = Payment::create([
                'requisition_id' => $req->id,
                'amount_kobo'    => $tax['total_kobo'], // net payable
                'method'         => $request->input('method'),
                'reference'      => $request->input('reference'),
                'paid_at'        => $request->input('paid_at'),
                'paid_by'        => $request->user()->id,
                'proof_path'     => $proofPath,
            ]);

            $req->update([
                'status'  => 'paid',
                'paid_at' => $request->input('paid_at'),
            ]);

            // Dispatch background posting job
            PostLedgerEntry::dispatch($payment->id);
        });

        return redirect('/finance/payments')
            ->with('success', 'Payment recorded. Ledger posting queued.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function formatReadyItem(Requisition $r): array
    {
        $tax = $r->accountCode
            ? TaxCalculator::preview($r->amount_kobo, $r->accountCode)
            : ['vat' => '₦0', 'wht' => '₦0', 'total' => MoneyHelper::format($r->amount_kobo), 'total_kobo' => $r->amount_kobo];

        return [
            'id'             => $r->id,
            'request_id'     => $r->request_id,
            'type'           => $r->type,
            'status'         => $r->status,
            'amount_kobo'    => $r->amount_kobo,
            'amount_fmt'     => MoneyHelper::format($r->amount_kobo),
            'description'    => $r->description,
            'requester'      => $r->requester?->name,
            'department'     => $r->requester?->department,
            'vendor'         => $r->vendor ? [
                'name'         => $r->vendor->name,
                'bank_name'    => $r->vendor->bank_name,
                'bank_account' => $r->vendor->bank_account,
            ] : null,
            'tax_vat_fmt'    => $tax['vat'] ?? MoneyHelper::format($r->tax_vat_kobo),
            'tax_wht_fmt'    => $tax['wht'] ?? MoneyHelper::format($r->tax_wht_kobo),
            'total_fmt'      => $tax['total'] ?? MoneyHelper::format($r->total_kobo),
            'total_kobo'     => $tax['total_kobo'] ?? $r->total_kobo,
            'requires_match' => $r->requiresThreeWayMatch(),
            'approved_at'    => $r->approved_at?->toDateString(),
        ];
    }

    private function authorizeFinance(Request $request): void
    {
        abort_unless(
            \in_array($request->user()?->role, ['finance', 'ceo', 'superadmin'], true),
            403
        );
    }
}
