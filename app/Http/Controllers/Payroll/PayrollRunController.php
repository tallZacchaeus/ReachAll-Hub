<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\EmployeeSalary;
use App\Models\PayrollDeduction;
use App\Models\PayrollEntry;
use App\Models\PayrollRun;
use App\Models\User;
use App\Services\Finance\MoneyHelper;
use App\Services\Payroll\PayrollRunService;
use App\Services\Payroll\PayslipGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PayrollRunController extends Controller
{
    public function __construct(private PayrollRunService $runService) {}

    private function authoriseManage(): void
    {
        abort_unless(Auth::user()?->hasPermission('payroll.manage'), 403);
    }

    private function authoriseView(): void
    {
        abort_unless(
            Auth::user()?->hasPermission('payroll.manage') ||
            Auth::user()?->hasPermission('payroll.view'),
            403
        );
    }

    public function index(): Response
    {
        $this->authoriseView();

        $runs = PayrollRun::withCount('entries')
            ->orderByDesc('period_start')
            ->paginate(20);

        return Inertia::render('Payroll/PayrollRunsPage', [
            'runs' => $runs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authoriseManage();

        $validated = $request->validate([
            'period_start' => ['required', 'date'],
            'period_end'   => ['required', 'date', 'after:period_start'],
            'is_off_cycle' => ['boolean'],
            'notes'        => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $run = $this->runService->createRun(
                Carbon::parse($validated['period_start']),
                Carbon::parse($validated['period_end']),
                Auth::id(),
                $validated['is_off_cycle'] ?? false,
                $validated['notes'] ?? null,
            );
        } catch (\RuntimeException $e) {
            return back()->withErrors(['period_start' => $e->getMessage()]);
        }

        return redirect()->route('payroll.runs.show', $run->id)
            ->with('success', "Payroll run {$run->period_label} created with {$run->employee_count} employees.");
    }

    public function show(PayrollRun $payrollRun): Response
    {
        $this->authoriseView();

        $entries = PayrollEntry::with(['employee:id,name,employee_id,department'])
            ->where('payroll_run_id', $payrollRun->id)
            ->orderBy('id')
            ->get()
            ->map(fn (PayrollEntry $e) => [
                'id'                     => $e->id,
                'employee_id'            => $e->employee?->employee_id,
                'employee_name'          => $e->employee?->name,
                'department'             => $e->employee?->department,
                'gross'                  => MoneyHelper::format($e->gross_kobo),
                'paye'                   => MoneyHelper::format($e->paye_kobo),
                'pension_employee'       => MoneyHelper::format($e->pension_employee_kobo),
                'nhf'                    => MoneyHelper::format($e->nhf_kobo),
                'other_deductions'       => MoneyHelper::format($e->other_deductions_kobo),
                'net'                    => MoneyHelper::format($e->net_kobo),
                'gross_kobo'             => $e->gross_kobo,
                'net_kobo'               => $e->net_kobo,
                'payslip_generated'      => $e->payslip_generated,
            ]);

        return Inertia::render('Payroll/PayrollRunDetailPage', [
            'run'     => array_merge($payrollRun->toArray(), [
                'total_gross' => MoneyHelper::format($payrollRun->total_gross_kobo),
                'total_paye'  => MoneyHelper::format($payrollRun->total_paye_kobo),
                'total_pension_employee' => MoneyHelper::format($payrollRun->total_pension_employee_kobo),
                'total_pension_employer' => MoneyHelper::format($payrollRun->total_pension_employer_kobo),
                'total_nhf'   => MoneyHelper::format($payrollRun->total_nhf_kobo),
                'total_nsitf' => MoneyHelper::format($payrollRun->total_nsitf_kobo),
                'total_net'   => MoneyHelper::format($payrollRun->total_net_kobo),
            ]),
            'entries' => $entries,
            'can_manage' => Auth::user()?->hasPermission('payroll.manage'),
        ]);
    }

    public function approve(PayrollRun $payrollRun): RedirectResponse
    {
        $this->authoriseManage();

        try {
            $this->runService->approveRun($payrollRun, Auth::id());
        } catch (\RuntimeException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return back()->with('success', 'Payroll run approved.');
    }

    public function markPaid(PayrollRun $payrollRun): RedirectResponse
    {
        $this->authoriseManage();

        try {
            $this->runService->markPaid($payrollRun);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return back()->with('success', 'Payroll run marked as paid. Deduction recoveries applied.');
    }

    public function generatePayslips(PayrollRun $payrollRun): RedirectResponse
    {
        $this->authoriseManage();

        $count = PayslipGenerator::generateAll($payrollRun->id);

        return back()->with('success', "{$count} payslip(s) generated.");
    }

    /** Export the bank payment file (CSV) for this run. */
    public function exportBankFile(PayrollRun $payrollRun)
    {
        $this->authoriseManage();

        $entries = PayrollEntry::with('employee:id,name,employee_id')
            ->where('payroll_run_id', $payrollRun->id)
            ->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"payroll-{$payrollRun->period_label}.csv\"",
        ];

        $callback = function () use ($entries, $payrollRun) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Period', 'Employee ID', 'Employee Name', 'Net Pay (NGN)']);

            foreach ($entries as $entry) {
                fputcsv($handle, [
                    $payrollRun->period_label,
                    $entry->employee?->employee_id ?? '',
                    $entry->employee?->name ?? '',
                    number_format(MoneyHelper::fromKobo($entry->net_kobo), 2, '.', ''),
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
