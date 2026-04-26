<?php

namespace App\Services\Payroll;

use App\Models\PayrollEntry;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PayslipGenerator
{
    /**
     * Generate a payslip PDF for a single entry and store it on the hr disk.
     * Updates payroll_entries.payslip_path / payslip_generated on success.
     */
    public static function generate(PayrollEntry $entry): string
    {
        $entry->loadMissing(['employee', 'run']);

        $run = $entry->run;

        $pdf = Pdf::loadView('payroll.payslip', compact('entry', 'run'))
            ->setPaper('a4', 'portrait');

        $filename = sprintf(
            'payroll/%s/%s-%s.pdf',
            $run->period_label,
            $run->period_label,
            $entry->employee->employee_id ?? $entry->user_id
        );

        Storage::disk('hr')->put($filename, $pdf->output());

        $entry->update([
            'payslip_path' => $filename,
            'payslip_disk' => 'hr',
            'payslip_generated' => true,
        ]);

        return $filename;
    }

    /**
     * Generate payslips for every entry in a run that hasn't been generated yet.
     */
    public static function generateAll(int $payrollRunId): int
    {
        $count = 0;

        PayrollEntry::where('payroll_run_id', $payrollRunId)
            ->where('payslip_generated', false)
            ->with(['employee', 'run'])
            ->each(function (PayrollEntry $entry) use (&$count) {
                try {
                    static::generate($entry);
                    $count++;
                } catch (\Throwable) {
                    // Log but don't abort the batch
                }
            });

        return $count;
    }
}
