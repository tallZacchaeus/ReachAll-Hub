<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Jobs\Finance\PostLedgerEntry;
use App\Models\Finance\Payment;
use App\Models\Finance\Requisition;
use App\Models\Finance\WhtLiability;
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
                'id' => $p->id,
                'request_id' => $p->requisition?->request_id,
                'description' => $p->requisition?->description,
                'amount_fmt' => MoneyHelper::format($p->amount_kobo),
                'method' => $p->method,
                'reference' => $p->reference,
                'paid_at' => $p->paid_at->toDateString(),
                'paid_by' => $p->paidBy?->name,
            ]);

        return Inertia::render('Finance/PaymentsPage', [
            'ready' => $ready,
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
            'method' => ['required', 'in:bank_transfer,cheque,cash'],
            'reference' => ['required', 'string', 'max:100'],
            'paid_at' => ['required', 'date'],
            'proof' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        // Recompute tax in case account code changed since submission
        $tax = $req->accountCode
            ? TaxCalculator::calculate($req->amount_kobo, $req->accountCode)
            : ['vat_kobo' => 0, 'wht_kobo' => 0, 'total_kobo' => $req->amount_kobo];

        // Sync tax fields on the requisition
        $req->update([
            'tax_vat_kobo' => $tax['vat_kobo'],
            'tax_wht_kobo' => $tax['wht_kobo'],
            'total_kobo' => $tax['total_kobo'],
        ]);

        // F2-03: Store the proof file INSIDE the transaction so that if the DB
        // write fails the uploaded file is cleaned up and no orphaned file remains.
        // On Throwable: delete the newly uploaded file before re-throwing.
        $proofFile = $request->file('proof');

        DB::transaction(function () use ($req, $request, $tax, $proofFile) {
            // Lock the row to prevent concurrent double-payments on the same requisition
            $locked = Requisition::where('id', $req->id)->lockForUpdate()->first();
            if (! $locked || ! in_array($locked->status, ['matched', 'approved'], true)) {
                throw new \RuntimeException('Requisition is no longer in a payable state.');
            }

            // F2-03: Upload inside the transaction — if the DB write below throws,
            // the catch block cleans up the file before the exception propagates.
            $proofPath = $proofFile->store("payments/{$req->id}", 'finance');

            try {
                $payment = Payment::create([
                    'requisition_id' => $req->id,
                    'amount_kobo' => $tax['total_kobo'], // net payable
                    'method' => $request->input('method'),
                    'reference' => $request->input('reference'),
                    'paid_at' => $request->input('paid_at'),
                    'paid_by' => $request->user()->id,
                    'proof_path' => $proofPath,
                ]);

                $req->update([
                    'status' => 'paid',
                    'paid_at' => $request->input('paid_at'),
                ]);

                // Dispatch background posting job
                PostLedgerEntry::dispatch($payment->id);
            } catch (\Throwable $e) {
                // F2-03: Clean up the uploaded file so the finance disk stays consistent.
                \Illuminate\Support\Facades\Storage::disk('finance')->delete($proofPath);
                throw $e;
            }
        });

        return redirect('/finance/payments')
            ->with('success', 'Payment recorded. Ledger posting queued.');
    }

    // ── Void a payment ────────────────────────────────────────────────────────

    /**
     * T10-01: Void a payment, reverse any WHT liability, and return the
     * requisition to 'approved' status so it can be re-paid or cancelled.
     *
     * Restricted to Finance admins.
     * via PaymentPolicy::voidPayment.
     */
    public function voidPayment(Request $request, int $paymentId): RedirectResponse
    {
        $payment = Payment::with(['requisition', 'whtLiability'])->findOrFail($paymentId);
        $this->authorize('voidPayment', $payment);

        $request->validate([
            'void_reason' => ['required', 'string', 'min:20'],
        ]);

        DB::transaction(function () use ($payment, $request) {
            $req = $payment->requisition;

            // Record void on the payment
            $payment->update([
                'voided_at' => now(),
                'voided_by' => $request->user()->id,
                'void_reason' => $request->input('void_reason'),
            ]);

            // T10-01: WHT reversal — create a matching negative entry so the
            // FIRS WHT-01 export nets to zero for this liability.
            $wht = $payment->whtLiability;
            if ($wht && $wht->amount_kobo > 0) {
                WhtLiability::create([
                    'requisition_id' => $wht->requisition_id,
                    'payment_id' => $payment->id,
                    'vendor_id' => $wht->vendor_id,
                    'amount_kobo' => -$wht->amount_kobo,
                    'rate_percent' => $wht->rate_percent,
                    'status' => 'voided',
                    'financial_period_id' => $wht->financial_period_id,
                    'created_by' => $request->user()->id,
                ]);
            }

            // Return requisition to 'approved' so Finance can re-pay or cancel
            if ($req) {
                $prevStatus = \in_array($req->status, ['paid', 'posted'], true)
                    ? 'approved'
                    : $req->status;
                $req->update([
                    'status' => $prevStatus,
                    'paid_at' => null,
                ]);
            }
        });

        return redirect('/finance/payments')
            ->with('success', "Payment #{$payment->id} voided. Requisition returned to approved state.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function formatReadyItem(Requisition $r): array
    {
        $tax = $r->accountCode
            ? TaxCalculator::preview($r->amount_kobo, $r->accountCode)
            : ['vat' => '₦0', 'wht' => '₦0', 'total' => MoneyHelper::format($r->amount_kobo), 'total_kobo' => $r->amount_kobo];

        return [
            'id' => $r->id,
            'request_id' => $r->request_id,
            'type' => $r->type,
            'status' => $r->status,
            'amount_kobo' => $r->amount_kobo,
            'amount_fmt' => MoneyHelper::format($r->amount_kobo),
            'description' => $r->description,
            'requester' => $r->requester?->name,
            'department' => $r->requester?->department,
            'vendor' => $r->vendor ? [
                'name' => $r->vendor->name,
                'bank_name' => $r->vendor->bank_name,
                'bank_account' => $r->vendor->bank_account,
            ] : null,
            'tax_vat_fmt' => $tax['vat'] ?? MoneyHelper::format($r->tax_vat_kobo),
            'tax_wht_fmt' => $tax['wht'] ?? MoneyHelper::format($r->tax_wht_kobo),
            'total_fmt' => $tax['total'] ?? MoneyHelper::format($r->total_kobo),
            'total_kobo' => $tax['total_kobo'] ?? $r->total_kobo,
            'requires_match' => $r->requiresThreeWayMatch(),
            'approved_at' => $r->approved_at?->toDateString(),
        ];
    }

    private function authorizeFinance(Request $request): void
    {
        abort_unless(
            $request->user()?->hasPermission('finance.admin'),
            403
        );
    }
}
