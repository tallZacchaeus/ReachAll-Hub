<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\ComplianceDocument;
use App\Models\CompliancePolicy;
use App\Models\ComplianceTrainingAssignment;
use App\Models\DataSubjectRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyComplianceController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('compliance.self'), 403);

        $user = $request->user();

        $docs = ComplianceDocument::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $assignments = ComplianceTrainingAssignment::with('training')
            ->where('user_id', $user->id)
            ->orderBy('due_at')
            ->get();

        $dsrs = DataSubjectRequest::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $policies = CompliancePolicy::where('is_active', true)
            ->where('requires_acknowledgement', true)
            ->orderBy('title')
            ->get()
            ->map(function (CompliancePolicy $policy) use ($user) {
                $policy->acknowledged = $policy->isAcknowledgedBy($user);
                return $policy;
            });

        return Inertia::render('Compliance/MyCompliancePage', [
            'docs'        => $docs,
            'assignments' => $assignments,
            'dsrs'        => $dsrs,
            'policies'    => $policies,
        ]);
    }

    public function storeDocument(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.self'), 403);

        $data = $request->validate([
            'type'             => ['required', 'in:visa,work_permit,right_to_work,passport,national_id,residence_permit'],
            'document_number'  => ['nullable', 'string', 'max:100'],
            'country_of_issue' => ['nullable', 'string', 'max:100'],
            'issued_at'        => ['nullable', 'date'],
            'expires_at'       => ['nullable', 'date', 'after_or_equal:issued_at'],
            'file'             => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('compliance-docs', 'hr');
        }

        ComplianceDocument::create([
            'user_id'          => $request->user()->id,
            'type'             => $data['type'],
            'document_number'  => $data['document_number'] ?? null,
            'country_of_issue' => $data['country_of_issue'] ?? null,
            'issued_at'        => $data['issued_at'] ?? null,
            'expires_at'       => $data['expires_at'] ?? null,
            'file_path'        => $filePath,
            'file_disk'        => 'hr',
            'status'           => 'pending',
        ]);

        return back()->with('success', 'Document submitted for review.');
    }

    public function storeDsr(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.self'), 403);

        $data = $request->validate([
            'type'        => ['required', 'in:access,rectification,erasure,restriction,portability,objection'],
            'description' => ['required', 'string', 'max:2000'],
        ]);

        DataSubjectRequest::create([
            'user_id'     => $request->user()->id,
            'type'        => $data['type'],
            'description' => $data['description'],
        ]);

        return back()->with('success', 'Data subject request submitted. You will receive a response within 30 days.');
    }

    public function withdrawDsr(Request $request, DataSubjectRequest $dsr): RedirectResponse
    {
        abort_unless($request->user()->id === $dsr->user_id, 403);
        abort_unless(in_array($dsr->status, ['pending', 'acknowledged']), 422);

        $dsr->update(['status' => 'withdrawn']);

        return back()->with('success', 'Request withdrawn.');
    }
}
