<?php

namespace App\Services\Payroll;

use App\Models\EmployeeSalary;
use App\Models\PayrollDeduction;
use App\Models\PayrollEntry;
use App\Models\PayrollLoan;
use App\Models\PayrollRun;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollRunService
{
    /**
     * Create a draft payroll run for the given period.
     * Computes gross-to-net for every active employee with a salary record.
     *
     * @throws \RuntimeException if a run for this period already exists
     */
    public function createRun(
        Carbon $periodStart,
        Carbon $periodEnd,
        int    $createdById,
        bool   $isOffCycle = false,
        ?string $notes = null
    ): PayrollRun {
        $label = $isOffCycle
            ? $periodStart->format('Y-m') . '-OC' . now()->format('His')
            : $periodStart->format('Y-m');

        if (PayrollRun::where('period_label', $label)->exists()) {
            throw new \RuntimeException("A payroll run for period '{$label}' already exists.");
        }

        return DB::transaction(function () use ($periodStart, $periodEnd, $createdById, $isOffCycle, $notes, $label) {
            $run = PayrollRun::create([
                'period_label'  => $label,
                'period_start'  => $periodStart->toDateString(),
                'period_end'    => $periodEnd->toDateString(),
                'status'        => 'draft',
                'is_off_cycle'  => $isOffCycle,
                'created_by_id' => $createdById,
                'notes'         => $notes,
            ]);

            $this->processEntries($run, $periodStart);

            return $run->fresh();
        });
    }

    /**
     * Recompute all entries for a draft run (e.g. after correcting salaries).
     */
    public function recomputeRun(PayrollRun $run): void
    {
        if (! $run->isDraft()) {
            throw new \RuntimeException('Only draft runs can be recomputed.');
        }

        DB::transaction(function () use ($run) {
            $run->entries()->delete();
            $this->processEntries($run, $run->period_start);
        });
    }

    /**
     * Approve a draft run — locks the figures.
     */
    public function approveRun(PayrollRun $run, int $approvedById): void
    {
        if (! $run->isDraft()) {
            throw new \RuntimeException('Only draft runs can be approved.');
        }

        $run->update([
            'status'         => 'approved',
            'approved_by_id' => $approvedById,
            'approved_at'    => now(),
        ]);
    }

    /**
     * Mark an approved run as paid and post deduction recoveries.
     */
    public function markPaid(PayrollRun $run): void
    {
        if (! $run->isApproved()) {
            throw new \RuntimeException('Only approved runs can be marked paid.');
        }

        DB::transaction(function () use ($run) {
            // Recover PayrollDeduction and PayrollLoan instalments for each entry
            foreach ($run->entries as $entry) {
                if ($entry->other_deductions_kobo > 0) {
                    $this->applyDeductionRecoveries($entry->user_id, $entry->other_deductions_kobo);
                    $this->applyLoanRecoveries($entry->user_id, $run->period_end);
                }
            }

            $run->update(['status' => 'paid', 'paid_at' => now()]);
        });
    }

    // ── Internal ────────────────────────────────────────────────────────────

    private function processEntries(PayrollRun $run, Carbon $periodStart): void
    {
        $asOf = $periodStart->toDateString();

        // All active non-system users who have a salary effective on the period start.
        // Do not whitelist employee roles; custom roles may be payroll-eligible.
        $employees = User::where('status', 'active')
            ->where('role', '!=', 'superadmin')
            ->get(['id']);

        $employeeIds = $employees->pluck('id');

        $salaries = EmployeeSalary::whereIn('user_id', $employeeIds)
            ->where('effective_date', '<=', $asOf)
            ->where(fn ($q) =>
                $q->whereNull('end_date')->orWhere('end_date', '>=', $asOf)
            )
            ->orderBy('user_id')
            ->orderByDesc('effective_date')
            ->orderByDesc('id')
            ->get()
            ->unique('user_id')
            ->keyBy('user_id');

        $deductions = PayrollDeduction::whereIn('user_id', $employeeIds)
            ->where('status', 'active')
            ->where('remaining_kobo', '>', 0)
            ->where('start_date', '<=', $asOf)
            ->get()
            ->groupBy('user_id');

        // Active loan/advance instalments for this period
        $loans = PayrollLoan::whereIn('user_id', $employeeIds)
            ->where('status', 'active')
            ->where('start_date', '<=', $asOf)
            ->get()
            ->groupBy('user_id');

        $totals = [
            'total_gross_kobo'            => 0,
            'total_paye_kobo'             => 0,
            'total_pension_employee_kobo' => 0,
            'total_pension_employer_kobo' => 0,
            'total_nhf_kobo'              => 0,
            'total_nsitf_kobo'            => 0,
            'total_net_kobo'              => 0,
            'employee_count'              => 0,
        ];

        foreach ($employees as $employee) {
            $salary = $salaries->get($employee->id);

            if (! $salary || $salary->grossKobo() === 0) {
                continue; // Skip employees without a salary record
            }

            // Sum active deduction instalments for this employee
            $deductionTotal = $deductions->get($employee->id, collect())
                ->sum(fn ($d) => $d->instalment());

            // Add active loan/advance instalments
            $loanTotal = $loans->get($employee->id, collect())
                ->sum(fn (PayrollLoan $l) => min($l->monthly_instalment_kobo, $l->remaining_kobo));

            $deductionTotal += $loanTotal;

            $computed = PayrollCalculator::compute($salary, $deductionTotal);

            PayrollEntry::create(array_merge($computed, [
                'payroll_run_id'     => $run->id,
                'user_id'            => $employee->id,
                'employee_salary_id' => $salary->id,
            ]));

            $totals['total_gross_kobo']            += $computed['gross_kobo'];
            $totals['total_paye_kobo']             += $computed['paye_kobo'];
            $totals['total_pension_employee_kobo'] += $computed['pension_employee_kobo'];
            $totals['total_pension_employer_kobo'] += $computed['pension_employer_kobo'];
            $totals['total_nhf_kobo']              += $computed['nhf_kobo'];
            $totals['total_nsitf_kobo']            += $computed['nsitf_kobo'];
            $totals['total_net_kobo']              += $computed['net_kobo'];
            $totals['employee_count']++;
        }

        $run->update($totals);
    }

    private function applyLoanRecoveries(int $userId, \DateTimeInterface $periodEnd): void
    {
        $periodEndDate = $periodEnd instanceof Carbon
            ? $periodEnd->toDateString()
            : Carbon::instance($periodEnd)->toDateString();

        $activeLoans = PayrollLoan::where('user_id', $userId)
            ->where('status', 'active')
            ->where('start_date', '<=', $periodEndDate)
            ->orderBy('id')
            ->get();

        foreach ($activeLoans as $loan) {
            $instalment   = min($loan->monthly_instalment_kobo, $loan->remaining_kobo);
            $newRemaining = $loan->remaining_kobo - $instalment;

            $loan->update([
                'remaining_kobo' => $newRemaining,
                'status'         => $newRemaining <= 0 ? 'completed' : 'active',
            ]);
        }
    }

    private function applyDeductionRecoveries(int $userId, int $totalRecoveredKobo): void
    {
        $remaining = $totalRecoveredKobo;

        $deductions = PayrollDeduction::where('user_id', $userId)
            ->where('status', 'active')
            ->where('remaining_kobo', '>', 0)
            ->orderBy('id')
            ->get();

        foreach ($deductions as $deduction) {
            if ($remaining <= 0) {
                break;
            }

            $applied         = min($deduction->instalment(), $remaining);
            $newBalance      = $deduction->remaining_kobo - $applied;
            $remaining      -= $applied;

            $deduction->update([
                'remaining_kobo' => $newBalance,
                'status'         => $newBalance <= 0 ? 'completed' : 'active',
            ]);
        }
    }
}
