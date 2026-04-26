<?php

namespace App\Http\Controllers\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CandidateController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('recruitment.manage') ||
                     $request->user()->hasPermission('recruitment.view'), 403);

        $query = Candidate::with('addedBy')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('email', 'like', '%'.$request->search.'%')
                    ->orWhere('current_company', 'like', '%'.$request->search.'%');
            });
        }

        return Inertia::render('Recruitment/CandidatesPage', [
            'candidates' => $query->paginate(25)->withQueryString(),
            'filters' => $request->only('status', 'search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);

        $data = $request->validate([
            'name' => 'required|string|max:200',
            'email' => 'required|email|max:200|unique:candidates,email',
            'phone' => 'nullable|string|max:30',
            'source' => 'nullable|string|max:100',
            'current_company' => 'nullable|string|max:200',
            'current_title' => 'nullable|string|max:200',
            'linkedin_url' => 'nullable|url|max:500',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'notes' => 'nullable|string|max:2000',
        ]);

        $resumePath = null;
        if ($request->hasFile('resume')) {
            $resumePath = $request->file('resume')->store('candidates/resumes', 'hr');
        }

        Candidate::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'source' => $data['source'] ?? null,
            'current_company' => $data['current_company'] ?? null,
            'current_title' => $data['current_title'] ?? null,
            'linkedin_url' => $data['linkedin_url'] ?? null,
            'resume_path' => $resumePath,
            'resume_disk' => $resumePath ? 'hr' : null,
            'status' => 'active',
            'notes' => $data['notes'] ?? null,
            'added_by_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Candidate added to talent pool.');
    }

    public function update(Request $request, Candidate $candidate): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);

        $data = $request->validate([
            'name' => 'required|string|max:200',
            'phone' => 'nullable|string|max:30',
            'source' => 'nullable|string|max:100',
            'current_company' => 'nullable|string|max:200',
            'current_title' => 'nullable|string|max:200',
            'linkedin_url' => 'nullable|url|max:500',
            'status' => 'required|in:active,inactive,hired,blacklisted',
            'notes' => 'nullable|string|max:2000',
        ]);

        $candidate->update($data);

        return back()->with('success', 'Candidate updated.');
    }

    public function downloadResume(Request $request, Candidate $candidate): mixed
    {
        abort_unless($request->user()->hasPermission('recruitment.manage') ||
                     $request->user()->hasPermission('recruitment.view'), 403);
        abort_unless($candidate->resume_path, 404);

        $disk = $candidate->resume_disk ?? 'hr';

        abort_unless(Storage::disk($disk)->exists($candidate->resume_path), 404);

        return Storage::disk($disk)->download(
            $candidate->resume_path,
            $candidate->name.'_resume.pdf'
        );
    }
}
