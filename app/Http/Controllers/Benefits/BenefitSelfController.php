<?php

namespace App\Http\Controllers\Benefits;

use App\Http\Controllers\Controller;
use App\Models\BenefitEnrollmentElection;
use App\Models\BenefitEnrollmentWindow;
use App\Models\BenefitPlan;
use App\Models\EmployeeBenefitEnrollment;
use App\Models\EmployeeDependent;
use App\Services\Finance\MoneyHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BenefitSelfController extends Controller
{
    private function authorise(): void
    {
        abort_unless(Auth::user()?->hasPermission('benefits.self-enroll'), 403);
    }

    public function index(): Response
    {
        $this->authorise();

        $user = Auth::user();

        $enrollments = EmployeeBenefitEnrollment::with('plan')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->orderBy('effective_date')
            ->get()
            ->map(fn ($e) => [
                'id'                         => $e->id,
                'plan_name'                  => $e->plan->name,
                'plan_type'                  => $e->plan->type,
                'provider'                   => $e->plan->provider,
                'effective_date'             => $e->effective_date->toDateString(),
                'employee_contribution'      => MoneyHelper::format($e->employee_contribution_kobo),
                'employer_contribution'      => MoneyHelper::format($e->employer_contribution_kobo),
                'member_id'                  => $e->member_id,
            ]);

        $dependents = EmployeeDependent::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'relationship', 'date_of_birth', 'gender']);

        // Find the currently open enrollment window (if any)
        $openWindow = BenefitEnrollmentWindow::where('status', 'open')
            ->where('open_date', '<=', now()->toDateString())
            ->where('close_date', '>=', now()->toDateString())
            ->with('elections', fn ($q) => $q->where('user_id', $user->id)->with('plan'))
            ->first();

        $availablePlans = BenefitPlan::active()->ordered()->get(['id', 'name', 'type', 'provider', 'description',
            'employee_contribution_type', 'employee_contribution_value',
            'employer_contribution_type', 'employer_contribution_value', 'is_waivable']);

        return Inertia::render('Benefits/MyBenefitsPage', [
            'enrollments'    => $enrollments,
            'dependents'     => $dependents,
            'open_window'    => $openWindow ? [
                'id'             => $openWindow->id,
                'name'           => $openWindow->name,
                'description'    => $openWindow->description,
                'close_date'     => $openWindow->close_date->toDateString(),
                'effective_date' => $openWindow->effective_date->toDateString(),
                'my_elections'   => $openWindow->elections->map(fn ($el) => [
                    'id'          => $el->id,
                    'plan_id'     => $el->benefit_plan_id,
                    'plan_name'   => $el->plan->name,
                    'election'    => $el->election,
                    'status'      => $el->status,
                ]),
            ] : null,
            'available_plans' => $availablePlans,
        ]);
    }

    /** Save or update a draft election for an open window. */
    public function saveElection(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'enrollment_window_id' => ['required', 'exists:benefit_enrollment_windows,id'],
            'benefit_plan_id'      => ['required', 'exists:benefit_plans,id'],
            'election'             => ['required', 'in:enroll,waive'],
        ]);

        $window = BenefitEnrollmentWindow::findOrFail($validated['enrollment_window_id']);

        abort_unless($window->isCurrentlyOpen(), 422, 'The enrollment window is not currently open.');

        // Validate waivable
        if ($validated['election'] === 'waive') {
            $plan = BenefitPlan::findOrFail($validated['benefit_plan_id']);
            abort_unless($plan->is_waivable, 422, 'This plan cannot be waived.');
        }

        BenefitEnrollmentElection::updateOrCreate(
            [
                'enrollment_window_id' => $validated['enrollment_window_id'],
                'user_id'              => Auth::id(),
                'benefit_plan_id'      => $validated['benefit_plan_id'],
            ],
            [
                'election' => $validated['election'],
                'status'   => 'draft',
            ]
        );

        return back()->with('success', 'Election saved.');
    }

    /** Submit all draft elections for the given window. */
    public function submitElections(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'enrollment_window_id' => ['required', 'exists:benefit_enrollment_windows,id'],
        ]);

        $window = BenefitEnrollmentWindow::findOrFail($validated['enrollment_window_id']);

        abort_unless($window->isCurrentlyOpen(), 422, 'The enrollment window is not currently open.');

        $count = BenefitEnrollmentElection::where('enrollment_window_id', $window->id)
            ->where('user_id', Auth::id())
            ->where('status', 'draft')
            ->update([
                'status'       => 'submitted',
                'submitted_at' => now(),
            ]);

        return back()->with('success', "{$count} election(s) submitted for processing.");
    }

    // ── Dependents ──────────────────────────────────────────────────────────

    public function storeDependent(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:200'],
            'relationship'  => ['required', 'in:spouse,child,parent,sibling,other'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender'        => ['nullable', 'in:male,female,other'],
            'notes'         => ['nullable', 'string', 'max:500'],
        ]);

        EmployeeDependent::create(array_merge($validated, [
            'user_id'   => Auth::id(),
            'is_active' => true,
        ]));

        return back()->with('success', 'Dependent added.');
    }

    public function updateDependent(Request $request, EmployeeDependent $employeeDependent): RedirectResponse
    {
        $this->authorise();

        abort_unless($employeeDependent->user_id === Auth::id(), 403);

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:200'],
            'relationship'  => ['required', 'in:spouse,child,parent,sibling,other'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender'        => ['nullable', 'in:male,female,other'],
            'notes'         => ['nullable', 'string', 'max:500'],
        ]);

        $employeeDependent->update($validated);

        return back()->with('success', 'Dependent updated.');
    }

    public function removeDependent(EmployeeDependent $employeeDependent): RedirectResponse
    {
        $this->authorise();

        abort_unless($employeeDependent->user_id === Auth::id(), 403);

        $employeeDependent->update(['is_active' => false]);

        return back()->with('success', 'Dependent removed.');
    }
}
