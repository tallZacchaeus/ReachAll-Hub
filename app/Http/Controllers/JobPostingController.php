<?php

namespace App\Http\Controllers;

use App\Models\JobApplication;
use App\Models\JobPosting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobPostingController extends Controller
{
    // ─── Staff ───────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $postings = JobPosting::where('status', 'open')
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('JobPostingsPage', [
            'postings' => $postings->through(fn ($p) => $this->transformCard($p)),
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $user = $request->user();
        $posting = JobPosting::with('poster:id,name')->findOrFail($id);

        if ($posting->status !== 'open') {
            abort(404);
        }

        $application = JobApplication::where('job_posting_id', $posting->id)
            ->where('user_id', $user->id)
            ->first();

        return Inertia::render('JobPostingDetailPage', [
            'posting' => $this->transformFull($posting),
            'hasApplied' => $application !== null,
            'applicationStatus' => $application?->status,
        ]);
    }

    public function apply(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $posting = JobPosting::where('id', $id)->where('status', 'open')->firstOrFail();

        if (JobApplication::where('job_posting_id', $posting->id)->where('user_id', $user->id)->exists()) {
            return back()->withErrors(['apply' => 'You have already applied for this position.']);
        }

        $validated = $request->validate([
            'cover_letter' => ['required', 'string', 'max:3000'],
        ]);

        JobApplication::create([
            'job_posting_id' => $posting->id,
            'user_id' => $user->id,
            'cover_letter' => $validated['cover_letter'],
            'status' => 'applied',
            'applied_at' => now(),
        ]);

        return back()->with('success', 'Application submitted successfully. Good luck!');
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    public function adminIndex(Request $request): Response
    {
        $this->requireAdmin($request);

        $postings = JobPosting::withCount('applications')
            ->with([
                'applications.applicant:id,name,department,position',
                'poster:id,name',
            ])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/JobPostingsManagePage', [
            'postings' => $postings->through(fn ($p) => $this->transformAdmin($p)),
            'posting' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $this->validatePosting($request);
        $validated['posted_by_user_id'] = $request->user()->id;

        JobPosting::create($validated);

        return redirect()->route('admin.jobs.index')->with('success', 'Job posting created.');
    }

    public function edit(Request $request, int $id): Response
    {
        $this->requireAdmin($request);

        $posting = JobPosting::with([
            'applications.applicant:id,name,department,position',
            'poster:id,name',
        ])->findOrFail($id);

        $postings = JobPosting::withCount('applications')
            ->with(['applications.applicant:id,name,department,position', 'poster:id,name'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/JobPostingsManagePage', [
            'postings' => $postings->through(fn ($p) => $this->transformAdmin($p)),
            'posting' => $this->transformFull($posting),
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $posting = JobPosting::findOrFail($id);
        $validated = $this->validatePosting($request);
        $posting->update($validated);

        return back()->with('success', 'Job posting updated.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        JobPosting::findOrFail($id)->delete();

        return back()->with('success', 'Job posting deleted.');
    }

    public function updateApplicationStatus(Request $request, int $applicationId): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'status' => ['required', 'in:applied,reviewing,shortlisted,rejected'],
        ]);

        JobApplication::findOrFail($applicationId)->update($validated);

        return back()->with('success', 'Application status updated.');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function validatePosting(Request $request): array
    {
        return $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'department'   => ['required', 'string', 'max:100'],
            'description'  => ['required', 'string'],
            'requirements' => ['required', 'string'],
            'status'       => ['required', 'in:open,closed'],
            'closes_at'    => ['nullable', 'date'],
        ]);
    }

    private function requireAdmin(Request $request): void
    {
        if (! $request->user()?->hasPermission('jobs.manage')) {
            abort(403, 'Unauthorized.');
        }
    }

    private function excerpt(string $text, int $length = 160): string
    {
        $text = strip_tags($text);
        return mb_strlen($text) > $length ? mb_substr($text, 0, $length).'…' : $text;
    }

    private function initials(string $name): string
    {
        $parts = explode(' ', trim($name));
        if (count($parts) >= 2) {
            return strtoupper(substr($parts[0], 0, 1).substr(end($parts), 0, 1));
        }

        return strtoupper(substr($name, 0, 2));
    }

    /** @return array<string, mixed> */
    private function transformCard(JobPosting $p): array
    {
        return [
            'id'          => $p->id,
            'title'       => $p->title,
            'department'  => $p->department,
            'excerpt'     => $this->excerpt($p->description),
            'closes_at'   => $p->closes_at?->toDateString(),
            'status'      => $p->status,
        ];
    }

    /** @return array<string, mixed> */
    private function transformFull(JobPosting $p): array
    {
        return [
            'id'           => $p->id,
            'title'        => $p->title,
            'department'   => $p->department,
            'description'  => $p->description,
            'requirements' => $p->requirements,
            'closes_at'    => $p->closes_at?->toDateString(),
            'status'       => $p->status,
            'posted_by'    => $p->poster?->name ?? 'HR',
            'created_at'   => $p->created_at?->toDateString(),
        ];
    }

    /** @return array<string, mixed> */
    private function transformAdmin(JobPosting $p): array
    {
        return [
            'id'                => $p->id,
            'title'             => $p->title,
            'department'        => $p->department,
            'status'            => $p->status,
            'closes_at'         => $p->closes_at?->toDateString(),
            'application_count' => $p->applications_count ?? 0,
            'description'       => $p->description,
            'requirements'      => $p->requirements,
            'applications'      => $p->applications
                ? $p->applications->map(fn ($a) => [
                    'id'         => $a->id,
                    'status'     => $a->status,
                    'applied_at' => $a->applied_at?->toDateString(),
                    'applicant'  => [
                        'name'       => $a->applicant?->name ?? 'Unknown',
                        'department' => $a->applicant?->department,
                        'position'   => $a->applicant?->position,
                        'initials'   => $this->initials($a->applicant?->name ?? '?'),
                    ],
                ])->values()->all()
                : [],
        ];
    }
}
