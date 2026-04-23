<?php

namespace App\Http\Controllers\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\JobApplication;
use App\Models\JobPosting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationPipelineController extends Controller
{
    private const VALID_STAGES = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];

    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('recruitment.manage') ||
                     $request->user()->hasPermission('recruitment.view'), 403);

        $query = JobApplication::with([
                'jobPosting',
                'applicant:id,name,email',
                'candidate:id,name,email',
                'interviews.scorecards',
                'offer',
            ])
            ->latest();

        if ($request->filled('posting_id')) {
            $query->where('job_posting_id', $request->posting_id);
        }
        if ($request->filled('stage')) {
            $query->where('stage', $request->stage);
        }

        return Inertia::render('Recruitment/ApplicationPipelinePage', [
            'applications' => $query->paginate(30)->withQueryString(),
            'postings'     => JobPosting::select('id', 'title')->where('status', 'open')->get(),
            'filters'      => $request->only('posting_id', 'stage'),
        ]);
    }

    public function show(Request $request, JobApplication $jobApplication): Response
    {
        abort_unless($request->user()->hasPermission('recruitment.manage') ||
                     $request->user()->hasPermission('recruitment.view') ||
                     $request->user()->hasPermission('recruitment.interview'), 403);

        $jobApplication->load([
            'jobPosting',
            'applicant:id,name,email,employee_id',
            'candidate',
            'interviews.interviewer:id,name',
            'interviews.scorecards.evaluator:id,name',
            'offer.createdBy:id,name',
        ]);

        return Inertia::render('Recruitment/ApplicationDetailPage', [
            'application' => $jobApplication,
        ]);
    }

    public function advanceStage(Request $request, JobApplication $jobApplication): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);

        $data = $request->validate([
            'stage'     => 'required|in:' . implode(',', self::VALID_STAGES),
            'ats_notes' => 'nullable|string|max:2000',
        ]);

        $updates = [
            'stage'     => $data['stage'],
            'ats_notes' => $data['ats_notes'] ?? $jobApplication->ats_notes,
        ];

        if ($data['stage'] === 'hired') {
            $updates['hired_at'] = now();
            $updates['status']   = 'shortlisted'; // keep existing status field aligned
        } elseif ($data['stage'] === 'rejected') {
            $updates['rejected_at'] = now();
            $updates['status']      = 'rejected';
        }

        $jobApplication->update($updates);

        return back()->with('success', 'Application stage updated.');
    }

    public function addExternalApplication(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);

        $data = $request->validate([
            'job_posting_id' => 'required|exists:job_postings,id',
            'candidate_id'   => 'required|exists:candidates,id',
            'cover_letter'   => 'nullable|string|max:5000',
        ]);

        // Prevent duplicate application for same candidate + posting
        $exists = JobApplication::where('job_posting_id', $data['job_posting_id'])
            ->where('candidate_id', $data['candidate_id'])
            ->exists();

        abort_if($exists, 422, 'Candidate already has an application for this posting.');

        JobApplication::create([
            'job_posting_id' => $data['job_posting_id'],
            'candidate_id'   => $data['candidate_id'],
            'cover_letter'   => $data['cover_letter'] ?? null,
            'status'         => 'applied',
            'stage'          => 'new',
            'applied_at'     => now(),
        ]);

        return back()->with('success', 'External application added to pipeline.');
    }
}
