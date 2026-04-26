<?php

namespace App\Jobs\Finance;

use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use App\Models\Finance\Requisition;
use App\Models\Finance\WhtLiability;
use App\Notifications\Finance\PaymentProcessed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Runs after a payment is recorded.
 *
 * Steps:
 *  1. Create double-entry LedgerEntry (debit = account code, credit = bank/cash/cheque).
 *  2. Create WhtLiability if WHT was withheld.
 *  3. Set Requisition.status = 'posted', Requisition.posted_at = now().
 *  4. Notify requester + approvers via PaymentProcessed.
 */
class PostLedgerEntry implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $paymentId) {}

    public function handle(): void
    {
        $payment = Payment::with([
            'requisition.accountCode',
            'requisition.vendor',
            'requisition.requester',
            'requisition.approvalSteps.approver',
            'requisition.financialPeriod',
        ])->findOrFail($this->paymentId);

        $req = $payment->requisition;

        // Closed-period guard: refuse to post ledger entries into a closed period.
        // This is a permanent failure — do not retry.
        $period = $req->financialPeriod;
        if ($period && $period->status === 'closed') {
            Log::warning('PostLedgerEntry skipped: period is closed', [
                'payment_id' => $this->paymentId,
                'requisition_id' => $req->id,
                'period_id' => $period->id,
            ]);
            $this->fail(new \Exception('Cannot post to closed period.'));

            return;
        }

        DB::transaction(function () use ($payment, $req) {
            // ── 1. Create ledger entry ──────────────────────────────────────
            LedgerEntry::create([
                'requisition_id' => $req->id,
                'payment_id' => $payment->id,
                'debit_account' => $req->accountCode?->code ?? 'MISC',
                'credit_account' => $payment->creditAccount(),
                'amount_kobo' => $req->amount_kobo,
                'wht_kobo' => $req->tax_wht_kobo,
                'description' => "Payment for {$req->request_id}: {$req->description}",
                'posted_at' => now(),
                'created_by' => $payment->paid_by,
            ]);

            // ── 2. Create WHT liability if applicable ───────────────────────
            if ($req->tax_wht_kobo > 0 && $req->accountCode?->tax_wht_applicable) {
                WhtLiability::create([
                    'requisition_id' => $req->id,
                    'payment_id' => $payment->id,
                    'vendor_id' => $req->vendor_id,
                    'amount_kobo' => $req->tax_wht_kobo,
                    'rate_percent' => $req->accountCode->wht_rate,
                    'status' => 'pending',
                    'financial_period_id' => $req->financial_period_id,
                    'created_by' => $payment->paid_by,
                ]);
            }

            // ── 3. Mark requisition as posted ───────────────────────────────
            $req->update([
                'status' => 'posted',
                'posted_at' => now(),
            ]);
        });

        // ── 4. Notify requester + approvers ────────────────────────────────
        if ($req->requester) {
            $req->requester->notify(new PaymentProcessed($req, $payment));
        }

        foreach ($req->approvalSteps as $step) {
            if ($step->approver && $step->approver->id !== $req->requester_id) {
                $step->approver->notify(new PaymentProcessed($req, $payment));
            }
        }
    }
}
