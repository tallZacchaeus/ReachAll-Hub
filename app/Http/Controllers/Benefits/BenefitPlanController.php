<?php

namespace App\Http\Controllers\Benefits;

use App\Http\Controllers\Controller;
use App\Models\BenefitEnrollmentWindow;
use App\Models\BenefitPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BenefitPlanController extends Controller
{
    private function authorise(): void
    {
        abort_unless(Auth::user()?->hasPermission('benefits.manage'), 403);
    }

    public function index(): Response
    {
        $this->authorise();

        $plans = BenefitPlan::withCount(['enrollments' => fn ($q) => $q->where('status', 'active')])
            ->ordered()
            ->get();

        $windows = BenefitEnrollmentWindow::orderByDesc('open_date')->limit(5)->get();

        return Inertia::render('Benefits/BenefitPlansPage', [
            'plans' => $plans,
            'windows' => $windows,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'type' => ['required', 'in:hmo,pension,life_insurance,disability,other'],
            'name' => ['required', 'string', 'max:150'],
            'provider' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'employee_contribution_type' => ['required', 'in:none,fixed,percentage_of_basic,percentage_of_gross'],
            'employee_contribution_value' => ['required', 'integer', 'min:0'],
            'employer_contribution_type' => ['required', 'in:none,fixed,percentage_of_basic,percentage_of_gross'],
            'employer_contribution_value' => ['required', 'integer', 'min:0'],
            'is_waivable' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        BenefitPlan::create($validated);

        return back()->with('success', 'Benefit plan created.');
    }

    public function update(Request $request, BenefitPlan $benefitPlan): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'provider' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'employee_contribution_type' => ['required', 'in:none,fixed,percentage_of_basic,percentage_of_gross'],
            'employee_contribution_value' => ['required', 'integer', 'min:0'],
            'employer_contribution_type' => ['required', 'in:none,fixed,percentage_of_basic,percentage_of_gross'],
            'employer_contribution_value' => ['required', 'integer', 'min:0'],
            'is_waivable' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $benefitPlan->update($validated);

        return back()->with('success', 'Benefit plan updated.');
    }

    public function destroy(BenefitPlan $benefitPlan): RedirectResponse
    {
        $this->authorise();

        $activeCount = $benefitPlan->enrollments()->where('status', 'active')->count();

        if ($activeCount > 0) {
            return back()->withErrors([
                'plan' => "Cannot delete — {$activeCount} active enrollment(s) exist.",
            ]);
        }

        $benefitPlan->delete();

        return back()->with('success', 'Benefit plan deleted.');
    }
}
