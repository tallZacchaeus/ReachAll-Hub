<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\PayrollEntry;
use App\Models\PayrollRun;
use App\Services\Finance\MoneyHelper;
use App\Services\Payroll\PayslipGenerator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PayslipController extends Controller
{
    /** Employee self-service: list own payslips. */
    public function index(): Response
    {
        abort_unless(Auth::user()?->hasPermission('payroll.my-payslips'), 403);

        $user = Auth::user();

        $entries = PayrollEntry::with('run:id,period_label,period_start,status')
            ->where('user_id', $user->id)
            ->whereHas('run', fn ($q) => $q->whereIn('status', ['approved', 'paid']))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PayrollEntry $e) => [
                'id'               => $e->id,
                'period_label'     => $e->run?->period_label,
                'period_start'     => $e->run?->period_start?->toDateString(),
                'status'           => $e->run?->status,
                'gross'            => MoneyHelper::format($e->gross_kobo),
                'net'              => MoneyHelper::format($e->net_kobo),
                'paye'             => MoneyHelper::format($e->paye_kobo),
                'pension'          => MoneyHelper::format($e->pension_employee_kobo),
                'payslip_generated'=> $e->payslip_generated,
                'download_url'     => route('payroll.payslip.download', $e->id),
            ]);

        return Inertia::render('Payroll/MyPayslipsPage', [
            'payslips' => $entries,
        ]);
    }

    /** Stream a payslip PDF — generates on demand if not yet generated. */
    public function download(PayrollEntry $payrollEntry): StreamedResponse
    {
        $user = Auth::user();

        // HR/payroll managers can download any payslip; employees only their own.
        $canManage = $user?->hasPermission('payroll.manage') || $user?->hasPermission('payroll.view');
        $isOwner   = $payrollEntry->user_id === $user?->id;

        abort_unless($canManage || $isOwner, 403);

        // Generate on demand if not yet done
        if (! $payrollEntry->payslip_generated) {
            abort_unless($canManage, 403, 'Payslip not yet generated. Contact HR.');
            PayslipGenerator::generate($payrollEntry);
            $payrollEntry->refresh();
        }

        abort_unless(
            Storage::disk($payrollEntry->payslip_disk)->exists($payrollEntry->payslip_path),
            404,
            'Payslip file not found.'
        );

        $filename = "payslip-{$payrollEntry->run->period_label}-{$payrollEntry->employee->employee_id}.pdf";

        return Storage::disk($payrollEntry->payslip_disk)->download(
            $payrollEntry->payslip_path,
            $filename,
            ['Content-Type' => 'application/pdf']
        );
    }
}
