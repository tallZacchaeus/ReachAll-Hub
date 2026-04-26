<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\PayrollLoan;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LoanController extends Controller
{
    private function authorise(): void
    {
        abort_unless(Auth::user()?->hasPermission('payroll.loans'), 403);
    }

    /**
     * HR/Finance: list all loans/advances, paginated.
     * Employees see only their own (but this route is gated to payroll.loans).
     */
    public function index(Request $request): Response
    {
        $this->authorise();

        $user = Auth::user();

        $query = PayrollLoan::with([
            'user:id,name,employee_id',
            'approvedBy:id,name',
        ])->orderByDesc('id');

        // HR and Finance see all; any other permissioned user sees own
        if (
            ! $user?->hasPermission('payroll.manage') &&
            ! $user?->hasPermission('payroll.view')
        ) {
            $query->where('user_id', $user?->id);
        }

        $loans = $query->paginate(25)->withQueryString();

        $employees = User::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        return Inertia::render('Payroll/LoansPage', [
            'loans'     => $loans,
            'employees' => $employees,
        ]);
    }

    /**
     * Create a new loan/advance (status = pending).
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'user_id'                  => ['required', 'exists:users,id'],
            'type'                     => ['required', 'in:loan,advance'],
            'description'              => ['nullable', 'string', 'max:300'],
            'principal_kobo'           => ['required', 'integer', 'min:1'],
            'monthly_instalment_kobo'  => ['required', 'integer', 'min:1', 'lte:principal_kobo'],
            'start_date'               => ['required', 'date'],
            'notes'                    => ['nullable', 'string', 'max:2000'],
        ]);

        $loan = PayrollLoan::create([
            'user_id'                  => $validated['user_id'],
            'type'                     => $validated['type'],
            'description'              => $validated['description'] ?? null,
            'principal_kobo'           => $validated['principal_kobo'],
            'remaining_kobo'           => $validated['principal_kobo'],
            'monthly_instalment_kobo'  => $validated['monthly_instalment_kobo'],
            'start_date'               => $validated['start_date'],
            'status'                   => 'pending',
            'notes'                    => $validated['notes'] ?? null,
        ]);

        AuditLogger::record(
            module: 'payroll',
            action: 'loan_created',
            subjectType: PayrollLoan::class,
            subjectId: $loan->id,
            newData: [
                'user_id'         => $loan->user_id,
                'type'            => $loan->type,
                'principal_kobo'  => $loan->principal_kobo,
                'start_date'      => $loan->start_date->toDateString(),
            ],
            request: $request,
        );

        return back()->with('success', 'Loan/advance created and awaiting approval.');
    }

    /**
     * Approve a pending loan (set status = active).
     */
    public function approve(Request $request, PayrollLoan $payrollLoan): RedirectResponse
    {
        $this->authorise();

        if ($payrollLoan->status !== 'pending') {
            return back()->withErrors(['status' => 'Only pending loans can be approved.']);
        }

        $payrollLoan->update([
            'status'         => 'active',
            'approved_by_id' => Auth::id(),
            'approved_at'    => now(),
        ]);

        AuditLogger::record(
            module: 'payroll',
            action: 'loan_approved',
            subjectType: PayrollLoan::class,
            subjectId: $payrollLoan->id,
            oldData: ['status' => 'pending'],
            newData: ['status' => 'active', 'approved_by_id' => Auth::id()],
            request: $request,
        );

        return back()->with('success', 'Loan approved and is now active.');
    }

    /**
     * Cancel a loan (pending or active).
     */
    public function cancel(Request $request, PayrollLoan $payrollLoan): RedirectResponse
    {
        $this->authorise();

        if (! in_array($payrollLoan->status, ['pending', 'active'], true)) {
            return back()->withErrors(['status' => 'Only pending or active loans can be cancelled.']);
        }

        $previousStatus = $payrollLoan->status;

        $payrollLoan->update(['status' => 'cancelled']);

        AuditLogger::record(
            module: 'payroll',
            action: 'loan_cancelled',
            subjectType: PayrollLoan::class,
            subjectId: $payrollLoan->id,
            oldData: ['status' => $previousStatus],
            newData: ['status' => 'cancelled'],
            request: $request,
        );

        return back()->with('success', 'Loan/advance cancelled.');
    }

    /**
     * Employee self-service: view own loans.
     */
    public function myLoans(): Response
    {
        $loans = PayrollLoan::where('user_id', Auth::id())
            ->with('approvedBy:id,name')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Payroll/MyLoansPage', [
            'loans' => $loans,
        ]);
    }
}
