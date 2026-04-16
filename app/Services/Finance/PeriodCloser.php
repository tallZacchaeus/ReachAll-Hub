<?php

namespace App\Services\Finance;

use App\Models\Finance\FinancialPeriod;
use App\Models\Finance\PeriodCloseWaiver;
use App\Models\Finance\PettyCashReconciliation;
use App\Models\Finance\Requisition;
use App\Models\Finance\Payment;
use App\Models\Finance\Invoice;
use App\Models\User;
use App\Notifications\Finance\PeriodCloseInitiated;
use App\Notifications\Finance\PeriodClosed;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * PeriodCloser — manages the full period-close workflow.
 *
 * Close flow:
 *   1. initiate()   — Finance/CEO marks period 'closing'; sends notifications.
 *   2. waive()      — Finance waives individual checklist items with a reason.
 *   3. coAuthorize()— CEO or Superadmin provides second authorisation.
 *   4. close()      — Atomically sets status='closed', stores close report, notifies.
 *
 * Reopen flow (dual authorisation — CEO + Superadmin must both call reopen()):
 *   - Stores first reopen request; completes when second distinct role confirms.
 */
class PeriodCloser
{
    // ── Checklist resolution ─────────────────────────────────────────────────

    /**
     * Return the pre-close checklist for a period.
     * Each item: ['type', 'id', 'label', 'status' => resolved|waived|pending]
     *
     * @return array<int, array{type:string, id:int|null, label:string, status:string}>
     */
    public static function checklist(FinancialPeriod $period): array
    {
        $items   = [];
        $waivers = $period->waivers()
            ->get()
            ->keyBy(fn ($w) => $w->item_type . ':' . ($w->item_id ?? 0));

        // 1. Unreconciled petty cash floats
        $floats = \App\Models\Finance\PettyCashFloat::where('status', 'active')
            ->whereDoesntHave('reconciliations', fn ($q) =>
                $q->where('status', 'approved')
                  ->whereYear('created_at', $period->year)
                  ->whereMonth('created_at', $period->month)
            )
            ->get();

        foreach ($floats as $float) {
            $key    = "unreconciled_float:{$float->id}";
            $waiver = $waivers->get($key);
            $items[] = [
                'type'   => 'unreconciled_float',
                'id'     => $float->id,
                'label'  => "Petty cash float #{$float->id} has no approved reconciliation for this period",
                'status' => $waiver ? 'waived' : 'pending',
                'waiver_reason' => $waiver?->reason,
            ];
        }

        // 2. Unpaid approved requisitions in this period
        $unpaid = Requisition::where('financial_period_id', $period->id)
            ->whereIn('status', ['approved', 'matched'])
            ->get();

        foreach ($unpaid as $req) {
            $key    = "unpaid_requisition:{$req->id}";
            $waiver = $waivers->get($key);
            $items[] = [
                'type'   => 'unpaid_requisition',
                'id'     => $req->id,
                'label'  => "Requisition {$req->request_id} ({$req->description}) is approved but unpaid",
                'status' => $waiver ? 'waived' : 'pending',
                'waiver_reason' => $waiver?->reason,
            ];
        }

        // 3. Unposted payments (paid but ledger not yet posted)
        $unposted = Requisition::where('financial_period_id', $period->id)
            ->where('status', 'paid')
            ->get();

        foreach ($unposted as $req) {
            $key    = "unposted_payment:{$req->id}";
            $waiver = $waivers->get($key);
            $items[] = [
                'type'   => 'unposted_payment',
                'id'     => $req->id,
                'label'  => "Payment for {$req->request_id} has not been posted to the ledger",
                'status' => $waiver ? 'waived' : 'pending',
                'waiver_reason' => $waiver?->reason,
            ];
        }

        // 4. Open variance items (invoices with match_status = 'variance')
        $variances = Invoice::whereHas('requisition', fn ($q) =>
                $q->where('financial_period_id', $period->id)
            )
            ->where('match_status', 'variance')
            ->get();

        foreach ($variances as $inv) {
            $key    = "variance_item:{$inv->id}";
            $waiver = $waivers->get($key);
            $items[] = [
                'type'   => 'variance_item',
                'id'     => $inv->id,
                'label'  => "Invoice {$inv->invoice_number} has an unresolved variance",
                'status' => $waiver ? 'waived' : 'pending',
                'waiver_reason' => $waiver?->reason,
            ];
        }

        return $items;
    }

    /**
     * True when all checklist items are resolved (status='resolved') or waived.
     */
    public static function checklistClear(FinancialPeriod $period): bool
    {
        $items = self::checklist($period);
        return collect($items)->every(fn ($i) => $i['status'] !== 'pending');
    }

    // ── Workflow steps ────────────────────────────────────────────────────────

    /**
     * Step 1 — Finance or CEO initiates the close (period → 'closing').
     */
    public static function initiate(FinancialPeriod $period, User $initiator): void
    {
        abort_unless($period->isOpen(), 422, 'Period is not open.');
        abort_unless(
            \in_array($initiator->role, ['finance', 'ceo', 'superadmin'], true),
            403
        );

        $period->update([
            'status'             => 'closing',
            'close_initiated_by' => $initiator->id,
            'close_initiated_at' => now(),
        ]);

        // Notify Finance + Exec users
        $recipients = User::whereIn('role', ['finance', 'ceo', 'superadmin'])->get();
        Notification::send($recipients, new PeriodCloseInitiated($period, $initiator));
    }

    /**
     * Step 2 — Waive a checklist item.
     */
    public static function waive(
        FinancialPeriod $period,
        string          $itemType,
        ?int            $itemId,
        string          $reason,
        User            $waivedBy
    ): PeriodCloseWaiver {
        abort_unless($period->isClosing(), 422, 'Period is not in closing state.');

        return PeriodCloseWaiver::create([
            'financial_period_id' => $period->id,
            'item_type'           => $itemType,
            'item_id'             => $itemId,
            'reason'              => $reason,
            'waived_by'           => $waivedBy->id,
            'waived_at'           => now(),
        ]);
    }

    /**
     * Step 3 — CEO or Superadmin provides second authorisation.
     * Checklist must be clear (all items resolved or waived).
     */
    public static function coAuthorize(FinancialPeriod $period, User $authorizer): void
    {
        abort_unless($period->isClosing(), 422, 'Period is not in closing state.');
        abort_unless(
            \in_array($authorizer->role, ['ceo', 'superadmin'], true),
            403,
            'Only CEO or Superadmin can co-authorise a period close.'
        );
        abort_unless($authorizer->id !== $period->close_initiated_by, 422,
            'The co-authoriser must be a different person from the initiator.'
        );
        abort_unless(self::checklistClear($period), 422,
            'All checklist items must be resolved or waived before authorising close.'
        );

        $period->update([
            'co_authorized_by' => $authorizer->id,
            'co_authorized_at' => now(),
        ]);
    }

    /**
     * Step 4 — Finalise close (must have both initiator + co-authoriser set).
     * Atomically closes the period and generates the close report.
     */
    public static function close(FinancialPeriod $period, User $closer): string
    {
        abort_unless($period->isClosing(), 422, 'Period is not in closing state.');
        abort_unless($period->co_authorized_by, 422, 'Co-authorisation is required before close.');

        $reportPath = DB::transaction(function () use ($period, $closer) {
            // Generate a close summary PDF via dompdf
            $path = self::generateCloseReport($period);

            $period->update([
                'status'            => 'closed',
                'closed_at'         => now(),
                'closed_by'         => $closer->id,
                'close_report_path' => $path,
            ]);

            return $path;
        });

        // Notify all Finance + Exec users
        $recipients = User::whereIn('role', ['finance', 'ceo', 'superadmin', 'management'])->get();
        Notification::send($recipients, new PeriodClosed($period, $closer));

        return $reportPath;
    }

    /**
     * Reopen a closed period (dual authorisation: CEO + Superadmin).
     * First caller stores intent; second distinct-role caller completes the reopen.
     *
     * Returns 'pending_second_auth' or 'reopened'.
     */
    public static function reopen(FinancialPeriod $period, User $user): string
    {
        abort_unless($period->isClosed(), 422, 'Period is not closed.');
        abort_unless(
            \in_array($user->role, ['ceo', 'superadmin'], true),
            403
        );

        $cacheKey = "period_reopen_{$period->id}";
        $first    = \Illuminate\Support\Facades\Cache::get($cacheKey);

        if (! $first) {
            // Store first authorization for 30 minutes
            \Illuminate\Support\Facades\Cache::put($cacheKey, [
                'user_id' => $user->id,
                'role'    => $user->role,
            ], now()->addMinutes(30));
            return 'pending_second_auth';
        }

        // Require a different role (CEO+Superadmin, not same role twice)
        abort_unless($first['role'] !== $user->role, 422,
            'The second authoriser must have a different role (CEO + Superadmin required).'
        );

        \Illuminate\Support\Facades\Cache::forget($cacheKey);

        $period->update([
            'status'             => 'open',
            'closed_at'          => null,
            'closed_by'          => null,
            'close_initiated_by' => null,
            'close_initiated_at' => null,
            'co_authorized_by'   => null,
            'co_authorized_at'   => null,
        ]);

        return 'reopened';
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private static function generateCloseReport(FinancialPeriod $period): string
    {
        // Aggregate period summary for the PDF
        $totalPosted  = Requisition::where('financial_period_id', $period->id)
            ->where('status', 'posted')
            ->sum('total_kobo');
        $totalApproved = Requisition::where('financial_period_id', $period->id)
            ->whereIn('status', ['approved', 'matched', 'paid', 'posted'])
            ->count();
        $vatTotal = Requisition::where('financial_period_id', $period->id)
            ->sum('tax_vat_kobo');
        $whtTotal = Requisition::where('financial_period_id', $period->id)
            ->sum('tax_wht_kobo');

        $html = view('finance.close-report', compact(
            'period', 'totalPosted', 'totalApproved', 'vatTotal', 'whtTotal'
        ))->render();

        $pdf  = app('dompdf.wrapper');
        $pdf->loadHTML($html);
        // D8-01: Close reports contain aggregate financial data and must be private.
        // Stored on the 'finance' disk (not 'public') and served through
        // DocumentDownloadController::closeReport() with finance-admin gating.
        $filename = "close-reports/period-{$period->year}-{$period->month}.pdf";

        \Illuminate\Support\Facades\Storage::disk('finance')
            ->put($filename, $pdf->output());

        return $filename;
    }
}
