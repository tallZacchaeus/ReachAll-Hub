<?php

namespace App\Http\Controllers\Compensation;

use App\Http\Controllers\Controller;
use App\Models\CompensationReviewCycle;
use App\Models\CompensationReviewEntry;
use App\Models\EmployeeSalary;
use App\Models\User;
use App\Services\Finance\MoneyHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CompensationReviewController extends Controller
{
    private function authorise(string $permission = 'compensation.manage'): void
    {
        abort_unless(Auth::user()?->hasPermission($permission), 403);
    }

    public function index(): Response
    {
        $this->authorise();

        $cycles = CompensationReviewCycle::withCount('entries')
            ->orderByDesc('review_start_date')
            ->get();

        return Inertia::render('Compensation/CompensationReviewPage', [
            'cycles' => $cycles,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'name'               => ['required', 'string', 'max:200'],
            'cycle_type'         => ['required', 'in:annual,mid_year,off_cycle,promotion'],
            'review_start_date'  => ['required', 'date'],
            'review_end_date'    => ['required', 'date', 'after:review_start_date'],
            'effective_date'     => ['required', 'date'],
            'budget_kobo'        => ['required', 'integer', 'min:0'],
            'notes'              => ['nullable', 'string', 'max:2000'],
        ]);

        CompensationReviewCycle::create(array_merge($validated, [
            'status'         => 'draft',
            'created_by_id'  => Auth::id(),
        ]));

        return back()->with('success', 'Review cycle created.');
    }

    public function show(CompensationReviewCycle $compensationReviewCycle): Response
    {
        $this->authorise();

        $entries = $compensationReviewCycle->entries()
            ->with('employee:id,name,employee_id,department,role')
            ->get()
            ->map(fn ($e) => [
                'id'                    => $e->id,
                'user_id'               => $e->user_id,
                'employee_name'         => $e->employee->name,
                'employee_id'           => $e->employee->employee_id,
                'department'            => $e->employee->department,
                'current_salary'        => MoneyHelper::format($e->current_salary_kobo),
                'current_salary_kobo'   => $e->current_salary_kobo,
                'proposed_salary'       => $e->proposed_salary_kobo ? MoneyHelper::format($e->proposed_salary_kobo) : null,
                'proposed_salary_kobo'  => $e->proposed_salary_kobo,
                'merit_basis_points'    => $e->merit_basis_points,
                'merit_percent'         => number_format($e->meritPercent() * 100, 2),
                'increase'              => MoneyHelper::format($e->increaseKobo()),
                'recommendation'        => $e->recommendation,
                'rationale'             => $e->rationale,
                'status'                => $e->status,
                'approved_at'           => $e->approved_at?->toDateTimeString(),
            ]);

        return Inertia::render('Compensation/ReviewCycleDetailPage', [
            'cycle'   => $compensationReviewCycle,
            'entries' => $entries,
        ]);
    }

    /** Activate a draft cycle and auto-populate entries from current active employees. */
    public function activate(CompensationReviewCycle $compensationReviewCycle): RedirectResponse
    {
        $this->authorise();

        abort_unless($compensationReviewCycle->status === 'draft', 422, 'Only draft cycles can be activated.');

        DB::transaction(function () use ($compensationReviewCycle) {
            // Load all active employees with a current salary
            $employees = User::where('status', 'active')
                ->with(['salaries' => fn ($q) => $q->whereNull('end_date')->orderByDesc('effective_date')->limit(1)])
                ->get();

            foreach ($employees as $employee) {
                $salary = $employee->salaries->first();
                if (! $salary) continue;

                CompensationReviewEntry::firstOrCreate(
                    ['cycle_id' => $compensationReviewCycle->id, 'user_id' => $employee->id],
                    [
                        'current_salary_kobo' => $salary->grossKobo(),
                        'status'              => 'pending',
                    ]
                );
            }

            $compensationReviewCycle->update(['status' => 'active']);
        });

        return back()->with('success', 'Review cycle activated. Entries populated for all active employees.');
    }

    /** Update a single entry's proposed salary and recommendation. */
    public function updateEntry(Request $request, CompensationReviewEntry $compensationReviewEntry): RedirectResponse
    {
        $this->authorise();

        abort_unless(
            in_array($compensationReviewEntry->cycle->status, ['active', 'review']),
            422,
            'Entries can only be updated on active cycles.'
        );

        $validated = $request->validate([
            'proposed_salary_kobo' => ['nullable', 'integer', 'min:0'],
            'merit_basis_points'   => ['nullable', 'integer', 'min:0', 'max:50000'],
            'recommendation'       => ['nullable', 'in:increase,no_change,decrease,promotion,offcycle'],
            'rationale'            => ['nullable', 'string', 'max:2000'],
        ]);

        $compensationReviewEntry->update(array_merge($validated, [
            'reviewed_by_id' => Auth::id(),
            'status'         => 'submitted',
        ]));

        return back()->with('success', 'Review entry updated.');
    }

    /** Approve a single review entry — updates employee salary if increase. */
    public function approveEntry(CompensationReviewEntry $compensationReviewEntry): RedirectResponse
    {
        $this->authorise();

        abort_unless($compensationReviewEntry->status === 'submitted', 422, 'Entry must be submitted before approval.');

        DB::transaction(function () use ($compensationReviewEntry) {
            $compensationReviewEntry->update([
                'status'          => 'approved',
                'approved_by_id'  => Auth::id(),
                'approved_at'     => now(),
            ]);

            // Apply the salary change if proposed salary differs from current
            if (
                $compensationReviewEntry->proposed_salary_kobo &&
                $compensationReviewEntry->proposed_salary_kobo !== $compensationReviewEntry->current_salary_kobo
            ) {
                $cycle      = $compensationReviewEntry->cycle;
                $effectiveDate = $cycle->effective_date->toDateString();
                $employee   = $compensationReviewEntry->employee;

                // Close the current salary record
                EmployeeSalary::where('user_id', $employee->id)
                    ->whereNull('end_date')
                    ->update(['end_date' => $effectiveDate]);

                // Derive new components: scale basic proportionally, keep housing/transport
                $current = EmployeeSalary::where('user_id', $employee->id)
                    ->orderByDesc('effective_date')
                    ->first();

                $ratio   = $current && $current->grossKobo() > 0
                    ? $compensationReviewEntry->proposed_salary_kobo / $current->grossKobo()
                    : 1;

                EmployeeSalary::create([
                    'user_id'               => $employee->id,
                    'basic_kobo'            => (int) round(($current?->basic_kobo ?? 0) * $ratio),
                    'housing_kobo'          => $current?->housing_kobo ?? 0,
                    'transport_kobo'        => $current?->transport_kobo ?? 0,
                    'other_allowances_kobo' => $current?->other_allowances_kobo ?? 0,
                    'nhf_enrolled'          => $current?->nhf_enrolled ?? false,
                    'effective_date'        => $effectiveDate,
                ]);
            }
        });

        return back()->with('success', 'Entry approved and salary updated.');
    }

    public function rejectEntry(Request $request, CompensationReviewEntry $compensationReviewEntry): RedirectResponse
    {
        $this->authorise();

        $request->validate(['rationale' => ['nullable', 'string', 'max:1000']]);

        $compensationReviewEntry->update([
            'status'          => 'rejected',
            'approved_by_id'  => Auth::id(),
            'approved_at'     => now(),
            'rationale'       => $request->rationale ?? $compensationReviewEntry->rationale,
        ]);

        return back()->with('success', 'Entry rejected.');
    }

    public function close(CompensationReviewCycle $compensationReviewCycle): RedirectResponse
    {
        $this->authorise();

        abort_unless(in_array($compensationReviewCycle->status, ['active', 'review']), 422, 'Cycle must be active or in review to close.');

        $compensationReviewCycle->update(['status' => 'closed']);

        return back()->with('success', 'Review cycle closed.');
    }
}
