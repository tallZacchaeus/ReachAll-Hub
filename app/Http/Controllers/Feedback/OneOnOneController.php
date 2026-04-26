<?php

namespace App\Http\Controllers\Feedback;

use App\Http\Controllers\Controller;
use App\Models\OneOnOne;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OneOnOneController extends Controller
{
    /**
     * List 1:1 meetings.
     * Manager sees their own; employee sees meetings with their manager; HR sees all.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isHr = $user->hasPermission('feedback.manage');

        $query = OneOnOne::with([
            'manager:id,name,employee_id',
            'employee:id,name,employee_id',
        ]);

        if (! $isHr) {
            $query->where(function ($q) use ($user) {
                $q->where('manager_id', $user->id)
                    ->orWhere('employee_id', $user->id);
            });
        }

        $oneOnOnes = $query->orderByDesc('scheduled_at')->get()->map(fn ($o) => [
            'id' => $o->id,
            'manager' => $o->manager ? ['id' => $o->manager->id, 'name' => $o->manager->name, 'employee_id' => $o->manager->employee_id] : null,
            'employee' => $o->employee ? ['id' => $o->employee->id, 'name' => $o->employee->name, 'employee_id' => $o->employee->employee_id] : null,
            'scheduled_at' => $o->scheduled_at->toIso8601String(),
            'status' => $o->status,
            'agenda' => $o->agenda,
            'notes' => $o->notes,
            'action_items' => $o->action_items,
        ]);

        // For scheduling: managers see their direct reports; HR sees all active employees
        $employees = User::where('status', 'active')
            ->when(! $isHr, fn ($q) => $q->where('reports_to_id', $user->id))
            ->select('id', 'name', 'employee_id', 'department', 'position')
            ->orderBy('name')
            ->get();

        return Inertia::render('Feedback/OneOnOnesPage', [
            'oneOnOnes' => $oneOnOnes,
            'employees' => $employees,
            'canManage' => $isHr,
            'authUserId' => $user->id,
        ]);
    }

    /**
     * Schedule a new 1:1.
     * Permission: feedback.manage (HR) OR manager scheduling with a direct report.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isHr = $user->hasPermission('feedback.manage');

        $validated = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'agenda' => ['nullable', 'string', 'max:3000'],
        ]);

        $employeeId = (int) $validated['employee_id'];

        // Non-HR users must be the employee's manager
        if (! $isHr) {
            $employee = User::find($employeeId);
            if (! $employee || $employee->reports_to_id !== $user->id) {
                abort(403, 'You can only schedule 1:1s with your direct reports.');
            }
        }

        $oneOnOne = OneOnOne::create([
            'manager_id' => $isHr ? $user->id : $user->id,
            'employee_id' => $employeeId,
            'scheduled_at' => $validated['scheduled_at'],
            'agenda' => $validated['agenda'] ?? null,
            'status' => 'scheduled',
        ]);

        AuditLogger::record(
            'feedback',
            '1on1.created',
            OneOnOne::class,
            $oneOnOne->id,
            null,
            ['employee_id' => $oneOnOne->employee_id, 'scheduled_at' => $oneOnOne->scheduled_at],
            $request,
        );

        return back()->with('success', '1:1 meeting scheduled successfully.');
    }

    /**
     * Show a 1:1 meeting in detail.
     */
    public function show(Request $request, OneOnOne $oneOnOne): Response
    {
        $user = $request->user();
        $isHr = $user->hasPermission('feedback.manage');

        $canView = $isHr
            || $oneOnOne->manager_id === $user->id
            || $oneOnOne->employee_id === $user->id;

        if (! $canView) {
            abort(403);
        }

        $oneOnOne->load(['manager:id,name,employee_id', 'employee:id,name,employee_id']);

        return Inertia::render('Feedback/OneOnOnePage', [
            'oneOnOne' => [
                'id' => $oneOnOne->id,
                'manager' => $oneOnOne->manager ? [
                    'id' => $oneOnOne->manager->id,
                    'name' => $oneOnOne->manager->name,
                    'employee_id' => $oneOnOne->manager->employee_id,
                ] : null,
                'employee' => $oneOnOne->employee ? [
                    'id' => $oneOnOne->employee->id,
                    'name' => $oneOnOne->employee->name,
                    'employee_id' => $oneOnOne->employee->employee_id,
                ] : null,
                'scheduled_at' => $oneOnOne->scheduled_at->toIso8601String(),
                'status' => $oneOnOne->status,
                'agenda' => $oneOnOne->agenda,
                'notes' => $oneOnOne->notes,
                'action_items' => $oneOnOne->action_items ?? [],
            ],
            'canEdit' => $isHr || $oneOnOne->manager_id === $user->id,
            'authUserId' => $user->id,
        ]);
    }

    /**
     * Update a 1:1 (notes, action items, status).
     * Permission: feedback.manage or the manager.
     */
    public function update(Request $request, OneOnOne $oneOnOne): RedirectResponse
    {
        $user = $request->user();
        $canEdit = $user->hasPermission('feedback.manage') || $oneOnOne->manager_id === $user->id;

        if (! $canEdit) {
            abort(403);
        }

        // action_items may arrive as a JSON string (from frontend router.put) or as an array
        $rawActionItems = $request->input('action_items');
        if (is_string($rawActionItems)) {
            $decoded = json_decode($rawActionItems, true);
            $request->merge(['action_items' => is_array($decoded) ? $decoded : null]);
        }

        $validated = $request->validate([
            'agenda' => ['nullable', 'string', 'max:3000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'action_items' => ['nullable', 'array'],
            'action_items.*.text' => ['required', 'string', 'max:500'],
            'action_items.*.done' => ['boolean'],
            'action_items.*.due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:scheduled,completed,cancelled'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $old = $oneOnOne->only(['agenda', 'notes', 'action_items', 'status']);

        $updateData = array_filter($validated, fn ($v) => $v !== null);
        $oneOnOne->update($updateData);

        AuditLogger::record(
            'feedback',
            '1on1.updated',
            OneOnOne::class,
            $oneOnOne->id,
            $old,
            $oneOnOne->fresh()->only(['agenda', 'notes', 'action_items', 'status']),
            $request,
        );

        return back()->with('success', '1:1 meeting updated.');
    }
}
