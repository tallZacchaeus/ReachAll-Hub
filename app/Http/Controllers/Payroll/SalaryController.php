<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\EmployeeSalary;
use App\Models\PayGrade;
use App\Models\User;
use App\Services\Finance\MoneyHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SalaryController extends Controller
{
    private function authorise(): void
    {
        abort_unless(Auth::user()?->hasPermission('payroll.manage'), 403);
    }

    public function index(Request $request): Response
    {
        $this->authorise();

        $query = User::where('status', 'active')
            ->orderBy('name');

        if ($search = $request->input('search')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('employee_id', 'like', "%{$search}%")
            );
        }

        $employees = $query->get(['id', 'name', 'employee_id', 'department', 'role']);

        // Attach current salary to each employee
        $today = now()->toDateString();
        $salaryMap = EmployeeSalary::whereIn('user_id', $employees->pluck('id'))
            ->where('effective_date', '<=', $today)
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', $today))
            ->orderByDesc('effective_date')
            ->get()
            ->groupBy('user_id')
            ->map(fn ($s) => $s->first());

        $result = $employees->map(function (User $u) use ($salaryMap) {
            $s = $salaryMap->get($u->id);

            return [
                'id' => $u->id,
                'name' => $u->name,
                'employee_id' => $u->employee_id,
                'department' => $u->department,
                'role' => $u->role,
                'salary_id' => $s?->id,
                'gross' => $s ? MoneyHelper::format($s->grossKobo()) : null,
                'basic' => $s ? MoneyHelper::format($s->basic_kobo) : null,
                'effective_date' => $s?->effective_date?->toDateString(),
            ];
        });

        return Inertia::render('Payroll/SalaryManagementPage', [
            'employees' => $result,
            'payGrades' => PayGrade::active()->orderBy('code')->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'pay_grade_id' => ['nullable', 'exists:pay_grades,id'],
            'basic_naira' => ['required', 'numeric', 'min:0'],
            'housing_naira' => ['required', 'numeric', 'min:0'],
            'transport_naira' => ['required', 'numeric', 'min:0'],
            'other_allowances_naira' => ['required', 'numeric', 'min:0'],
            'nhf_enrolled' => ['boolean'],
            'effective_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        // End any current active salary for this employee
        EmployeeSalary::where('user_id', $validated['user_id'])
            ->whereNull('end_date')
            ->where('effective_date', '<', $validated['effective_date'])
            ->update(['end_date' => now()->toDateString()]);

        EmployeeSalary::create([
            'user_id' => $validated['user_id'],
            'pay_grade_id' => $validated['pay_grade_id'] ?? null,
            'basic_kobo' => MoneyHelper::toKobo($validated['basic_naira']),
            'housing_kobo' => MoneyHelper::toKobo($validated['housing_naira']),
            'transport_kobo' => MoneyHelper::toKobo($validated['transport_naira']),
            'other_allowances_kobo' => MoneyHelper::toKobo($validated['other_allowances_naira']),
            'nhf_enrolled' => $validated['nhf_enrolled'] ?? false,
            'effective_date' => $validated['effective_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Salary record saved.');
    }

    public function destroy(EmployeeSalary $employeeSalary): RedirectResponse
    {
        $this->authorise();

        $employeeSalary->delete();

        return back()->with('success', 'Salary record removed.');
    }
}
