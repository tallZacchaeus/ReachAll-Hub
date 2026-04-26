<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\ComplianceDocument;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ComplianceDocumentController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $docs = ComplianceDocument::with('user', 'verifiedBy')
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->user_id, fn ($q, $uid) => $q->where('user_id', $uid))
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        $staff = User::orderBy('name')->get(['id', 'name', 'employee_id']);

        return Inertia::render('Compliance/ComplianceDocumentsPage', [
            'docs' => $docs,
            'staff_list' => $staff,
            'filters' => $request->only('type', 'status', 'user_id'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'type' => ['required', 'in:visa,work_permit,right_to_work,passport,national_id,residence_permit'],
            'document_number' => ['nullable', 'string', 'max:100'],
            'country_of_issue' => ['nullable', 'string', 'max:100'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'notes' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('compliance-docs', 'hr');
        }

        ComplianceDocument::create([
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'document_number' => $data['document_number'] ?? null,
            'country_of_issue' => $data['country_of_issue'] ?? null,
            'issued_at' => $data['issued_at'] ?? null,
            'expires_at' => $data['expires_at'] ?? null,
            'notes' => $data['notes'] ?? null,
            'file_path' => $filePath,
            'file_disk' => 'hr',
            'status' => 'pending',
        ]);

        return back()->with('success', 'Document added.');
    }

    public function verify(Request $request, ComplianceDocument $doc): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $doc->update([
            'status' => 'active',
            'verified_by_id' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Document verified.');
    }

    public function reject(Request $request, ComplianceDocument $doc): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $data = $request->validate([
            'notes' => ['required', 'string', 'max:500'],
        ]);

        $doc->update([
            'status' => 'rejected',
            'notes' => $data['notes'],
        ]);

        return back()->with('success', 'Document rejected.');
    }

    public function download(Request $request, ComplianceDocument $doc)
    {
        $user = $request->user();
        abort_unless(
            $user->hasPermission('compliance.manage') || $user->id === $doc->user_id,
            403
        );
        abort_if($doc->file_path === null, 404);

        return Storage::disk($doc->file_disk ?? 'hr')->download($doc->file_path);
    }
}
