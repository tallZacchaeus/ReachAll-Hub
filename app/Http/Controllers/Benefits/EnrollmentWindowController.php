<?php

namespace App\Http\Controllers\Benefits;

use App\Http\Controllers\Controller;
use App\Models\BenefitEnrollmentElection;
use App\Models\BenefitEnrollmentWindow;
use App\Models\BenefitPlan;
use App\Models\EmployeeBenefitEnrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EnrollmentWindowController extends Controller
{
    private function authorise(): void
    {
        abort_unless(Auth::user()?->hasPermission('benefits.manage'), 403);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:200'],
            'description'    => ['nullable', 'string', 'max:2000'],
            'open_date'      => ['required', 'date'],
            'close_date'     => ['required', 'date', 'after:open_date'],
            'effective_date' => ['required', 'date', 'after_or_equal:close_date'],
        ]);

        BenefitEnrollmentWindow::create(array_merge($validated, [
            'status'         => 'upcoming',
            'created_by_id'  => Auth::id(),
        ]));

        return back()->with('success', 'Enrollment window created.');
    }

    public function open(BenefitEnrollmentWindow $benefitEnrollmentWindow): RedirectResponse
    {
        $this->authorise();

        abort_unless($benefitEnrollmentWindow->status === 'upcoming', 422, 'Only upcoming windows can be opened.');

        $benefitEnrollmentWindow->update(['status' => 'open']);

        return back()->with('success', 'Enrollment window is now open.');
    }

    /**
     * Process submitted elections: create/update enrollments then close the window.
     */
    public function process(BenefitEnrollmentWindow $benefitEnrollmentWindow): RedirectResponse
    {
        $this->authorise();

        abort_unless($benefitEnrollmentWindow->status === 'open', 422, 'Only open windows can be processed.');

        DB::transaction(function () use ($benefitEnrollmentWindow) {
            $elections = BenefitEnrollmentElection::where('enrollment_window_id', $benefitEnrollmentWindow->id)
                ->where('status', 'submitted')
                ->with('plan')
                ->get();

            foreach ($elections as $election) {
                if ($election->election === 'enroll') {
                    // Terminate existing active enrollment for this plan
                    EmployeeBenefitEnrollment::where('user_id', $election->user_id)
                        ->where('benefit_plan_id', $election->benefit_plan_id)
                        ->where('status', 'active')
                        ->update(['status' => 'terminated', 'end_date' => $benefitEnrollmentWindow->effective_date->toDateString()]);

                    EmployeeBenefitEnrollment::create([
                        'user_id'                    => $election->user_id,
                        'benefit_plan_id'            => $election->benefit_plan_id,
                        'status'                     => 'active',
                        'effective_date'             => $benefitEnrollmentWindow->effective_date->toDateString(),
                        'employee_contribution_kobo' => $election->plan->employee_contribution_value,
                        'employer_contribution_kobo' => $election->plan->employer_contribution_value,
                        'enrolled_by_id'             => Auth::id(),
                    ]);
                } elseif ($election->election === 'waive') {
                    // Waive = terminate active enrollment for this plan
                    EmployeeBenefitEnrollment::where('user_id', $election->user_id)
                        ->where('benefit_plan_id', $election->benefit_plan_id)
                        ->where('status', 'active')
                        ->update(['status' => 'terminated', 'end_date' => $benefitEnrollmentWindow->effective_date->toDateString()]);
                }

                $election->update([
                    'status'          => 'approved',
                    'processed_at'    => now(),
                    'processed_by_id' => Auth::id(),
                ]);
            }

            $benefitEnrollmentWindow->update(['status' => 'closed']);
        });

        return back()->with('success', 'Enrollment window processed and closed.');
    }

    public function destroy(BenefitEnrollmentWindow $benefitEnrollmentWindow): RedirectResponse
    {
        $this->authorise();

        abort_unless($benefitEnrollmentWindow->status === 'upcoming', 422, 'Only upcoming windows can be deleted.');

        $benefitEnrollmentWindow->delete();

        return back()->with('success', 'Enrollment window deleted.');
    }
}
