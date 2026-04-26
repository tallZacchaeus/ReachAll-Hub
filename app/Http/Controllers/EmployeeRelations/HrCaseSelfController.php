<?php

namespace App\Http\Controllers\EmployeeRelations;

use App\Http\Controllers\Controller;
use App\Models\HrCase;
use App\Models\HrCaseNote;
use App\Models\HrCaseParty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HrCaseSelfController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('er.self'), 403);

        $cases = HrCase::where('reported_by_id', $request->user()->id)
            ->with(['assignedTo:id,name'])
            ->latest()
            ->paginate(20);

        // Strip description from confidential cases that HR hasn't yet reviewed
        $cases->getCollection()->transform(function (HrCase $case) {
            return [
                'id' => $case->id,
                'case_number' => $case->case_number,
                'type' => $case->type,
                'subject' => $case->subject,
                'status' => $case->status,
                'priority' => $case->priority,
                'confidential' => $case->confidential,
                'created_at' => $case->created_at,
                'assigned_to' => $case->assignedTo?->only(['id', 'name']),
            ];
        });

        return Inertia::render('EmployeeRelations/MyCasesPage', [
            'cases' => $cases,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('er.self'), 403);

        $data = $request->validate([
            'type' => 'required|in:helpdesk,grievance,whistleblower',
            'subject' => 'required|string|max:200',
            'description' => 'required|string|max:10000',
            'priority' => 'required|in:low,normal',
            'anonymous' => 'boolean',
        ]);

        $anonymous = (bool) ($data['anonymous'] ?? false);
        $reportedBy = $anonymous ? null : $request->user()->id;
        $confidential = $data['type'] === 'whistleblower';

        $case = HrCase::create([
            'type' => $data['type'],
            'subject' => $data['subject'],
            'description' => $data['description'],
            'priority' => $data['priority'],
            'status' => 'open',
            'confidential' => $confidential,
            'reported_by_id' => $reportedBy,
        ]);

        // Add as complainant if not anonymous
        if ($reportedBy) {
            HrCaseParty::create([
                'hr_case_id' => $case->id,
                'user_id' => $reportedBy,
                'role' => 'complainant',
            ]);
        }

        return back()->with('success', "Your case {$case->case_number} has been submitted.");
    }

    public function show(Request $request, HrCase $hrCase): Response
    {
        abort_unless($request->user()->hasPermission('er.self'), 403);
        abort_unless($hrCase->reported_by_id === $request->user()->id, 403);

        $hrCase->load([
            'assignedTo:id,name',
            'notes' => fn ($q) => $q->where('is_internal', false)->with('author:id,name'),
        ]);

        return Inertia::render('EmployeeRelations/MyCaseDetailPage', [
            'case' => $hrCase,
        ]);
    }

    public function addNote(Request $request, HrCase $hrCase): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('er.self'), 403);
        abort_unless($hrCase->reported_by_id === $request->user()->id, 403);
        abort_unless($hrCase->isOpen(), 422);

        $data = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        HrCaseNote::create([
            'hr_case_id' => $hrCase->id,
            'author_id' => $request->user()->id,
            'content' => $data['content'],
            'is_internal' => false,
        ]);

        return back()->with('success', 'Note added.');
    }
}
