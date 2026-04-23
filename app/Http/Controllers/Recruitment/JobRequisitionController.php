<?php

namespace App\Http\Controllers\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use App\Models\JobRequisition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobRequisitionController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('recruitment.manage') ||
                     $request->user()->hasPermission('recruitment.view'), 403);

        $query = JobRequisition::with(['requestedBy', 'approvedBy', 'posting'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return Inertia::render('Recruitment/JobRequisitionsPage', [
            'requisitions' => $query->paginate(25)->withQueryString(),
            'filters'      => $request->only('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);

        $data = $request->validate([
            'title'           => 'required|string|max:200',
            'department'      => 'required|string|max:100',
            'headcount'       => 'required|integer|min:1|max:100',
            'employment_type' => 'required|string|in:full_time,part_time,contract,intern',
            'justification'   => 'required|string|max:2000',
            'priority'        => 'required|string|in:low,normal,high,urgent',
        ]);

        JobRequisition::create([
            ...$data,
            'status'           => 'pending',
            'requested_by_id'  => $request->user()->id,
        ]);

        return back()->with('success', 'Job requisition submitted for approval.');
    }

    public function approve(Request $request, JobRequisition $jobRequisition): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);
        abort_unless($jobRequisition->status === 'pending', 422);

        $jobRequisition->update([
            'status'       => 'approved',
            'approved_by_id' => $request->user()->id,
            'approved_at'  => now(),
        ]);

        return back()->with('success', 'Requisition approved.');
    }

    public function reject(Request $request, JobRequisition $jobRequisition): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);
        abort_unless($jobRequisition->status === 'pending', 422);

        $data = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $jobRequisition->update([
            'status'           => 'rejected',
            'rejection_reason' => $data['rejection_reason'],
            'approved_by_id'   => $request->user()->id,
            'approved_at'      => now(),
        ]);

        return back()->with('success', 'Requisition rejected.');
    }

    public function linkPosting(Request $request, JobRequisition $jobRequisition): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);
        abort_unless($jobRequisition->status === 'approved', 422);

        $data = $request->validate([
            'job_posting_id' => 'required|exists:job_postings,id',
        ]);

        $jobRequisition->update(['job_posting_id' => $data['job_posting_id']]);

        return back()->with('success', 'Job posting linked to requisition.');
    }
}
