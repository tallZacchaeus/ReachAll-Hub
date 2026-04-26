<?php

namespace App\Http\Controllers\EmployeeRelations;

use App\Http\Controllers\Controller;
use App\Models\HrCase;
use App\Models\HrCaseParty;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HrCaseController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(
            $request->user()->hasPermission('er.manage') ||
            $request->user()->hasPermission('er.investigate'),
            403
        );

        $user = $request->user();
        $query = HrCase::with(['reportedBy:id,name', 'assignedTo:id,name'])
            ->latest();

        // Investigators see only their assigned cases; managers see all
        if (! $user->hasPermission('er.manage')) {
            $query->where('assigned_to_id', $user->id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Hide confidential case subjects/descriptions from investigators unless they're HR
        $cases = $query->paginate(25)->withQueryString();

        if (! $user->hasPermission('er.manage')) {
            $cases->getCollection()->transform(function (HrCase $case) {
                if ($case->confidential) {
                    $case->description = '[Confidential]';
                }

                return $case;
            });
        }

        return Inertia::render('EmployeeRelations/CaseManagementPage', [
            'cases' => $cases,
            'filters' => $request->only('type', 'status'),
        ]);
    }

    public function show(Request $request, HrCase $hrCase): Response
    {
        $user = $request->user();

        $canManage = $user->hasPermission('er.manage');
        $isInvestigator = $hrCase->assigned_to_id === $user->id &&
                          $user->hasPermission('er.investigate');

        abort_unless($canManage || $isInvestigator, 403);

        $hrCase->load([
            'reportedBy:id,name,email',
            'assignedTo:id,name',
            'parties.user:id,name,email',
            'notes.author:id,name',
        ]);

        // Filter notes for investigators — no internal notes
        if (! $canManage) {
            $hrCase->setRelation(
                'notes',
                $hrCase->notes->where('is_internal', false)->values()
            );
        }

        return Inertia::render('EmployeeRelations/CaseDetailPage', [
            'case' => $hrCase,
            'can_manage' => $canManage,
            'staff_list' => $canManage
                ? User::select('id', 'name')->where('status', 'active')->orderBy('name')->get()
                : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('er.manage'), 403);

        $data = $request->validate([
            'type' => 'required|in:helpdesk,grievance,whistleblower,disciplinary,investigation',
            'subject' => 'required|string|max:200',
            'description' => 'required|string|max:10000',
            'priority' => 'required|in:low,normal,high,urgent',
            'confidential' => 'boolean',
            'reported_by_id' => 'nullable|exists:users,id',
        ]);

        $data['confidential'] = $data['confidential'] ?? ($data['type'] === 'whistleblower');
        $data['status'] = 'open';

        $case = HrCase::create($data);

        // Auto-add reporter as complainant party if known
        if (! empty($data['reported_by_id'])) {
            HrCaseParty::create([
                'hr_case_id' => $case->id,
                'user_id' => $data['reported_by_id'],
                'role' => 'complainant',
            ]);
        }

        return redirect()->route('er.cases.show', $case)
            ->with('success', "Case {$case->case_number} opened.");
    }

    public function update(Request $request, HrCase $hrCase): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('er.manage'), 403);

        $data = $request->validate([
            'subject' => 'sometimes|string|max:200',
            'description' => 'sometimes|string|max:10000',
            'priority' => 'sometimes|in:low,normal,high,urgent',
            'status' => 'sometimes|in:open,under_review,investigating,pending_action,resolved,closed,dismissed',
            'assigned_to_id' => 'nullable|exists:users,id',
            'outcome' => 'nullable|string|max:5000',
        ]);

        if (isset($data['status'])) {
            if (in_array($data['status'], ['resolved'], true) && ! $hrCase->resolved_at) {
                $data['resolved_at'] = now();
            }
            if (in_array($data['status'], ['closed', 'dismissed'], true) && ! $hrCase->closed_at) {
                $data['closed_at'] = now();
            }
        }

        $hrCase->update($data);

        return back()->with('success', 'Case updated.');
    }

    public function addParty(Request $request, HrCase $hrCase): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('er.manage'), 403);

        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:complainant,respondent,witness,investigator',
        ]);

        HrCaseParty::firstOrCreate(
            ['hr_case_id' => $hrCase->id, 'user_id' => $data['user_id'], 'role' => $data['role']],
        );

        return back()->with('success', 'Party added.');
    }

    public function removeParty(Request $request, HrCase $hrCase, HrCaseParty $party): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('er.manage'), 403);
        abort_unless($party->hr_case_id === $hrCase->id, 404);

        $party->delete();

        return back()->with('success', 'Party removed.');
    }
}
