<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\FinancialPeriod;
use App\Services\Finance\PeriodCloser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PeriodCloseController extends Controller
{
    /** Period-close overview page. */
    public function index(Request $request): Response
    {
        $this->authorizeAccess($request);

        $periods = FinancialPeriod::orderByDesc('year')
            ->orderByDesc('month')
            ->with(['closedBy:id,name', 'closeInitiatedBy:id,name', 'coAuthorizedBy:id,name'])
            ->limit(24)
            ->get()
            ->map(fn ($p) => [
                'id'                  => $p->id,
                'label'               => $p->getLabel(),
                'year'                => $p->year,
                'month'               => $p->month,
                'status'              => $p->status,
                'close_initiated_by'  => $p->closeInitiatedBy?->name,
                'close_initiated_at'  => $p->close_initiated_at?->toDateString(),
                'co_authorized_by'    => $p->coAuthorizedBy?->name,
                'closed_by'           => $p->closedBy?->name,
                'closed_at'           => $p->closed_at?->toDateString(),
                'close_report_path'   => $p->close_report_path,
            ]);

        // Current or most-recent closing period for the checklist
        $closing = FinancialPeriod::where('status', 'closing')->orderByDesc('year')->orderByDesc('month')->first();
        $checklist = $closing ? PeriodCloser::checklist($closing) : [];

        return Inertia::render('Finance/PeriodClosePage', [
            'periods'  => $periods,
            'closing'  => $closing ? [
                'id'               => $closing->id,
                'label'            => $closing->getLabel(),
                'checklist_clear'  => PeriodCloser::checklistClear($closing),
                'has_co_auth'      => (bool) $closing->co_authorized_by,
                'initiated_by'     => $closing->closeInitiatedBy?->name,
            ] : null,
            'checklist'  => $checklist,
            'user_role'  => $request->user()->role,
            'flash'      => session()->only(['success', 'error']),
        ]);
    }

    /** Step 1: Finance/CEO initiates a close. */
    public function initiate(Request $request): RedirectResponse
    {
        $this->authorizeAccess($request);

        $request->validate(['period_id' => ['required', 'integer', 'exists:financial_periods,id']]);
        $period = FinancialPeriod::findOrFail($request->integer('period_id'));

        try {
            PeriodCloser::initiate($period, $request->user());
        } catch (\Throwable $e) {
            Log::error('PeriodCloseController@initiate failed', [
                'period_id' => $period->id,
                'user_id'   => $request->user()->id,
                'error'     => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
            return back()->with('error', $e->getMessage());
        }

        return redirect('/finance/period-close')->with('success', "Period close initiated for {$period->getLabel()}.");
    }

    /** Step 2: Waive a checklist item. */
    public function waive(Request $request): RedirectResponse
    {
        $this->authorizeAccess($request);

        $request->validate([
            'period_id' => ['required', 'integer', 'exists:financial_periods,id'],
            'item_type' => ['required', 'string', 'in:unreconciled_float,unpaid_requisition,unposted_payment,variance_item'],
            'item_id'   => ['nullable', 'integer'],
            'reason'    => ['required', 'string', 'min:20'],
        ]);

        $period = FinancialPeriod::findOrFail($request->integer('period_id'));

        try {
            PeriodCloser::waive(
                $period,
                $request->input('item_type'),
                $request->input('item_id'),
                $request->input('reason'),
                $request->user()
            );
        } catch (\Throwable $e) {
            Log::error('PeriodCloseController@waive failed', [
                'period_id' => $period->id,
                'item_type' => $request->input('item_type'),
                'item_id'   => $request->input('item_id'),
                'user_id'   => $request->user()->id,
                'error'     => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Item waived successfully.');
    }

    /** Step 3: CEO/Superadmin co-authorises the close. */
    public function coAuthorize(Request $request): RedirectResponse
    {
        $this->authorizeCeo($request);

        $request->validate(['period_id' => ['required', 'integer', 'exists:financial_periods,id']]);
        $period = FinancialPeriod::findOrFail($request->integer('period_id'));

        try {
            PeriodCloser::coAuthorize($period, $request->user());
        } catch (\Throwable $e) {
            Log::error('PeriodCloseController@coAuthorize failed', [
                'period_id' => $period->id,
                'user_id'   => $request->user()->id,
                'error'     => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
            return back()->with('error', $e->getMessage());
        }

        return redirect('/finance/period-close')->with('success', "Co-authorisation recorded. Finance can now finalise the close.");
    }

    /** Step 4: Finalise the close. */
    public function close(Request $request): RedirectResponse
    {
        $this->authorizeAccess($request);

        $request->validate(['period_id' => ['required', 'integer', 'exists:financial_periods,id']]);
        $period = FinancialPeriod::findOrFail($request->integer('period_id'));

        try {
            PeriodCloser::close($period, $request->user());
        } catch (\Throwable $e) {
            Log::error('PeriodCloseController@close failed', [
                'period_id' => $period->id,
                'user_id'   => $request->user()->id,
                'error'     => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
            return back()->with('error', $e->getMessage());
        }

        return redirect('/finance/period-close')->with('success', "{$period->getLabel()} closed successfully.");
    }

    /** Dual-auth reopen (CEO + Superadmin). */
    public function reopen(Request $request): RedirectResponse
    {
        $this->authorizeCeo($request);

        $request->validate(['period_id' => ['required', 'integer', 'exists:financial_periods,id']]);
        $period = FinancialPeriod::findOrFail($request->integer('period_id'));

        try {
            $result = PeriodCloser::reopen($period, $request->user());
        } catch (\Throwable $e) {
            Log::error('PeriodCloseController@reopen failed', [
                'period_id' => $period->id,
                'user_id'   => $request->user()->id,
                'error'     => $e->getMessage(),
                'trace'     => $e->getTraceAsString(),
            ]);
            return back()->with('error', $e->getMessage());
        }

        $msg = $result === 'reopened'
            ? "{$period->getLabel()} has been reopened."
            : "Reopen request recorded. A second authoriser (CEO or Superadmin) must confirm within 30 minutes.";

        return redirect('/finance/period-close')->with('success', $msg);
    }

    // ── Guards ────────────────────────────────────────────────────────────────

    private function authorizeAccess(Request $request): void
    {
        abort_unless(
            $request->user()?->hasPermission('finance.period-close'),
            403
        );
    }

    private function authorizeCeo(Request $request): void
    {
        abort_unless(
            $request->user()?->hasPermission('finance.exec'),
            403
        );
    }
}
