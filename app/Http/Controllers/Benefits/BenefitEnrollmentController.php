<?php

namespace App\Http\Controllers\Benefits;

use App\Http\Controllers\Controller;
use App\Models\BenefitPlan;
use App\Models\EmployeeBenefitEnrollment;
use App\Models\User;
use App\Services\Finance\MoneyHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BenefitEnrollmentController extends Controller
{
    private function authorise(): void
    {
        abort_unless(Auth::user()?->hasPermission('benefits.manage'), 403);
    }

    /** HR view — all enrollments across all employees. */
    public function index(Request $request): Response
    {
        $this->authorise();

        $query = EmployeeBenefitEnrollment::with([
            'employee:id,name,employee_id,department',
            'plan:id,name,type',
        ])->orderByDesc('effective_date');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($planId = $request->input('plan_id')) {
            $query->where('benefit_plan_id', $planId);
        }

        if ($search = $request->input('search')) {
            $query->whereHas('employee', fn ($q) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
            );
        }

        $enrollments = $query->paginate(30)->withQueryString();
        $plans       = BenefitPlan::active()->ordered()->get(['id', 'name', 'type']);

        return Inertia::render('Benefits/BenefitEnrollmentsPage', [
            'enrollments' => $enrollments,
            'plans'       => $plans,
            'filters'     => $request->only(['status', 'plan_id', 'search']),
        ]);
    }

    /** Manually enroll an employee in a plan. */
    public function store(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'user_id'                    => ['required', 'exists:users,id'],
            'benefit_plan_id'            => ['required', 'exists:benefit_plans,id'],
            'effective_date'             => ['required', 'date'],
            'employee_contribution_kobo' => ['required', 'integer', 'min:0'],
            'employer_contribution_kobo' => ['required', 'integer', 'min:0'],
            'member_id'                  => ['nullable', 'string', 'max:100'],
            'notes'                      => ['nullable', 'string', 'max:1000'],
        ]);

        // Terminate any existing active enrollment for same plan
        EmployeeBenefitEnrollment::where('user_id', $validated['user_id'])
            ->where('benefit_plan_id', $validated['benefit_plan_id'])
            ->where('status', 'active')
            ->update(['status' => 'terminated', 'end_date' => now()->toDateString()]);

        EmployeeBenefitEnrollment::create(array_merge($validated, [
            'status'         => 'active',
            'enrolled_by_id' => Auth::id(),
        ]));

        return back()->with('success', 'Employee enrolled in benefit plan.');
    }

    /** Terminate an active enrollment. */
    public function terminate(EmployeeBenefitEnrollment $employeeBenefitEnrollment): RedirectResponse
    {
        $this->authorise();

        $employeeBenefitEnrollment->update([
            'status'   => 'terminated',
            'end_date' => now()->toDateString(),
        ]);

        return back()->with('success', 'Enrollment terminated.');
    }
}
