<?php

namespace App\Http\Controllers\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\InterviewSchedule;
use App\Models\InterviewScorecard;
use App\Models\JobApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    public function schedule(Request $request, JobApplication $jobApplication): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);

        $data = $request->validate([
            'interviewer_id' => 'required|exists:users,id',
            'scheduled_at' => 'required|date|after:now',
            'duration_minutes' => 'required|integer|min:15|max:480',
            'format' => 'required|in:video,phone,in_person',
            'location_or_link' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        InterviewSchedule::create([
            ...$data,
            'job_application_id' => $jobApplication->id,
            'status' => 'scheduled',
        ]);

        // Advance to interview stage if still at screening or new
        if (in_array($jobApplication->stage, ['new', 'screening'], true)) {
            $jobApplication->update(['stage' => 'interview']);
        }

        return back()->with('success', 'Interview scheduled.');
    }

    public function updateStatus(Request $request, InterviewSchedule $interviewSchedule): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);

        $data = $request->validate([
            'status' => 'required|in:scheduled,completed,cancelled,rescheduled',
            'notes' => 'nullable|string|max:1000',
        ]);

        $interviewSchedule->update($data);

        return back()->with('success', 'Interview status updated.');
    }

    public function submitScorecard(Request $request, InterviewSchedule $interviewSchedule): RedirectResponse
    {
        $user = $request->user();

        $canSubmit = $user->hasPermission('recruitment.manage') ||
                     $user->hasPermission('recruitment.interview') ||
                     $interviewSchedule->interviewer_id === $user->id;

        abort_unless($canSubmit, 403);

        $data = $request->validate([
            'overall_rating' => 'required|integer|min:1|max:5',
            'technical_rating' => 'nullable|integer|min:1|max:5',
            'communication_rating' => 'nullable|integer|min:1|max:5',
            'culture_fit_rating' => 'nullable|integer|min:1|max:5',
            'strengths' => 'nullable|string|max:2000',
            'concerns' => 'nullable|string|max:2000',
            'recommendation' => 'required|in:strong_yes,yes,no,strong_no',
            'notes' => 'nullable|string|max:2000',
        ]);

        InterviewScorecard::updateOrCreate(
            [
                'interview_schedule_id' => $interviewSchedule->id,
                'evaluator_id' => $user->id,
            ],
            $data
        );

        // Mark interview completed when scorecard submitted
        if ($interviewSchedule->status === 'scheduled') {
            $interviewSchedule->update(['status' => 'completed']);
        }

        return back()->with('success', 'Scorecard submitted.');
    }

    public function destroyScorecard(Request $request, InterviewScorecard $interviewScorecard): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage') ||
                     $interviewScorecard->evaluator_id === $request->user()->id, 403);

        $interviewScorecard->delete();

        return back()->with('success', 'Scorecard deleted.');
    }
}
