<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\AccountCode;
use App\Models\Finance\PettyCashFloat;
use App\Models\Finance\PettyCashReconciliation;
use App\Models\Finance\PettyCashTransaction;
use App\Services\Finance\MoneyHelper;
use App\Services\Finance\PettyCashEnforcer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PettyCashController extends Controller
{
    /** GET /finance/petty-cash — custodian dashboard */
    public function show(Request $request): Response|RedirectResponse
    {
        $float = PettyCashFloat::with('custodian')
            ->where('custodian_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        if (! $float) {
            return redirect()->route('dashboard')
                ->with('error', 'You do not have an active petty cash float.');
        }

        $this->authorize('expense', $float);

        $transactions = PettyCashTransaction::with('accountCode')
            ->where('float_id', $float->id)
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->take(50)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'amount_kobo' => $t->amount_kobo,
                'amount_fmt' => $t->amountFmt(),
                'type' => $t->type,
                'description' => $t->description,
                'date' => $t->date->toDateString(),
                'status' => $t->status,
                'receipt_path' => $t->receipt_path,
                'account_code' => $t->accountCode
                    ? ['code' => $t->accountCode->code, 'description' => $t->accountCode->description]
                    : null,
            ]);

        $accountCodes = AccountCode::where('status', 'active')
            ->orderBy('code')
            ->get(['id', 'code', 'description']);

        $daysSinceRecon = $float->daysSinceReconciliation();
        $pendingCount = PettyCashTransaction::where('float_id', $float->id)
            ->where('status', 'pending_recon')
            ->count();
        $canSubmitRecon = $pendingCount > 0 && $daysSinceRecon >= 7;

        return Inertia::render('Finance/PettyCashPage', [
            'float' => [
                'id' => $float->id,
                'float_limit_kobo' => $float->float_limit_kobo,
                'current_balance_kobo' => $float->current_balance_kobo,
                'low_alert_threshold' => $float->low_alert_threshold,
                'last_reconciled_at' => $float->last_reconciled_at?->toIso8601String(),
                'limit_fmt' => $float->limitFmt(),
                'balance_fmt' => $float->balanceFmt(),
                'balance_pct' => $float->balancePercentage(),
                'status' => $float->status,
            ],
            'transactions' => $transactions,
            'accountCodes' => $accountCodes,
            'canSubmitRecon' => $canSubmitRecon,
            'daysWithoutRecon' => $daysSinceRecon,
            'pendingCount' => $pendingCount,
        ]);
    }

    /** POST /finance/petty-cash/expense — log a new expense */
    public function expense(Request $request): RedirectResponse
    {
        $float = PettyCashFloat::where('custodian_id', $request->user()->id)
            ->where('status', 'active')
            ->firstOrFail();

        $this->authorize('expense', $float);

        $validated = $request->validate([
            'amount_naira' => ['required', 'numeric', 'min:1', 'max:99999.99'],
            'description' => ['required', 'string', 'max:255'],
            // Date must be today or yesterday (1 business day back for morning catch-up).
            // Future dates are rejected entirely. Cap checks use created_at (server time),
            // not this field, so this validation is purely for record-keeping accuracy.
            'date' => [
                'required',
                'date',
                'before_or_equal:today',
                'after_or_equal:'.now()->subWeekdays(1)->toDateString(),
            ],
            'account_code_id' => ['nullable', 'exists:account_codes,id'],
            'receipt' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $amountKobo = MoneyHelper::toKobo((float) $validated['amount_naira']);

        // Pre-flight cap check (non-locked, fast path for UX feedback)
        $check = PettyCashEnforcer::validate($float, $amountKobo);
        if (! $check['allowed']) {
            return back()->withErrors(['amount_naira' => $check['reason']])->withInput();
        }

        $receiptPath = $request->file('receipt')->store('petty-cash/receipts', 'finance');

        DB::transaction(function () use ($float, $amountKobo, $validated, $receiptPath, $request) {
            // CAT2-06: Lock the float row to prevent concurrent double-spend.
            // Re-check caps against the authoritative locked state.
            $lockedFloat = PettyCashFloat::where('id', $float->id)->lockForUpdate()->firstOrFail();

            $recheck = PettyCashEnforcer::validate($lockedFloat, $amountKobo);
            if (! $recheck['allowed']) {
                throw new \RuntimeException($recheck['reason']);
            }

            PettyCashTransaction::create([
                'float_id' => $lockedFloat->id,
                'amount_kobo' => $amountKobo,
                'type' => 'expense',
                'description' => $validated['description'],
                'receipt_path' => $receiptPath,
                'account_code_id' => $validated['account_code_id'] ?? null,
                'date' => $validated['date'],
                'status' => 'pending_recon',
                'created_by' => $request->user()->id,
            ]);

            $lockedFloat->decrement('current_balance_kobo', $amountKobo);
        });

        return back()->with('success', 'Expense of '.MoneyHelper::format($amountKobo).' logged successfully.');
    }

    /** POST /finance/petty-cash/reconciliation — submit reconciliation */
    public function submitReconciliation(Request $request): RedirectResponse
    {
        $float = PettyCashFloat::where('custodian_id', $request->user()->id)
            ->firstOrFail();

        $this->authorize('submitReconciliation', $float);

        $pending = PettyCashTransaction::where('float_id', $float->id)
            ->where('status', 'pending_recon')
            ->get();

        if ($pending->isEmpty()) {
            return back()->withErrors(['submit' => 'No pending transactions to reconcile.']);
        }

        DB::transaction(function () use ($float, $pending, $request) {
            $totalKobo = $pending->sum('amount_kobo');

            $periodStart = $pending->min('date');
            $periodEnd = $pending->max('date');

            $recon = PettyCashReconciliation::create([
                'float_id' => $float->id,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'submitted_by' => $request->user()->id,
                'status' => 'submitted',
                'total_expenses_kobo' => $totalKobo,
                'variance_kobo' => 0,
            ]);

            // Link all pending transactions to this reconciliation
            PettyCashTransaction::where('float_id', $float->id)
                ->where('status', 'pending_recon')
                ->update(['reconciliation_id' => $recon->id]);
        });

        return back()->with('success', 'Reconciliation submitted for Finance review.');
    }
}
