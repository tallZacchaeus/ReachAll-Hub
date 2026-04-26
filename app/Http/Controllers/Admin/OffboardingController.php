<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OffboardingChecklist;
use App\Models\OffboardingTask;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OffboardingController extends Controller
{
    // ── Authorization helper ────────────────────────────────────────────────

    private function authorise(Request $request): void
    {
        abort_unless(
            $request->user()?->hasPermission('offboarding.manage'),
            403,
            'You do not have permission to manage offboarding.'
        );
    }

    // ── Index ───────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->authorise($request);

        $status = $request->query('status');

        $query = OffboardingChecklist::with(['user'])
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($q) => $q->whereIn('status', ['completed', 'waived']),
            ])
            ->orderByDesc('created_at');

        if ($status && in_array($status, ['initiated', 'in_progress', 'completed'], true)) {
            $query->where('status', $status);
        }

        $checklists = $query->paginate(25)->withQueryString();

        // Stats
        $stats = [
            'initiated'   => OffboardingChecklist::where('status', 'initiated')->count(),
            'in_progress' => OffboardingChecklist::where('status', 'in_progress')->count(),
            'completed'   => OffboardingChecklist::where('status', 'completed')->count(),
        ];

        return Inertia::render('Admin/OffboardingPage', [
            'checklists' => $checklists,
            'stats'      => $stats,
            'filters'    => ['status' => $status ?? ''],
        ]);
    }

    // ── Show ────────────────────────────────────────────────────────────────

    public function show(Request $request, OffboardingChecklist $offboardingChecklist): Response
    {
        $this->authorise($request);

        $offboardingChecklist->load([
            'user',
            'initiatedBy',
            'tasks.completedBy',
            'tasks.assignedTo',
        ]);

        return Inertia::render('Admin/OffboardingDetailPage', [
            'checklist'          => $this->transformChecklist($offboardingChecklist),
            'can_manage_payroll' => $request->user()?->hasPermission('payroll.manage') ?? false,
        ]);
    }

    // ── Complete a task ─────────────────────────────────────────────────────

    public function completeTask(Request $request, OffboardingTask $offboardingTask): RedirectResponse
    {
        $this->authorise($request);

        // Final payroll settlement requires additional payroll.manage permission
        if ($offboardingTask->task_type === 'final_payroll') {
            abort_unless(
                $request->user()?->hasPermission('payroll.manage'),
                403,
                'Completing the final payroll task requires the payroll.manage permission.'
            );
        }

        abort_if(
            $offboardingTask->status === 'completed',
            422,
            'Task is already completed.'
        );

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $offboardingTask->update([
            'status'          => 'completed',
            'completed_at'    => now(),
            'completed_by_id' => $request->user()->id,
            'notes'           => $validated['notes'] ?? $offboardingTask->notes,
        ]);

        // Auto-advance checklist status
        $this->syncChecklistStatus($offboardingTask->checklist);

        AuditLogger::record(
            'offboarding',
            'task_completed',
            OffboardingTask::class,
            $offboardingTask->id,
            null,
            ['task_type' => $offboardingTask->task_type, 'title' => $offboardingTask->title],
            $request
        );

        return back()->with('success', 'Task marked as completed.');
    }

    // ── Waive a task ────────────────────────────────────────────────────────

    public function waiveTask(Request $request, OffboardingTask $offboardingTask): RedirectResponse
    {
        $this->authorise($request);

        abort_if(
            $offboardingTask->status === 'completed',
            422,
            'Cannot waive a completed task.'
        );

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $offboardingTask->update([
            'status' => 'waived',
            'notes'  => $validated['notes'] ?? $offboardingTask->notes,
        ]);

        // Auto-advance checklist status
        $this->syncChecklistStatus($offboardingTask->checklist);

        AuditLogger::record(
            'offboarding',
            'task_waived',
            OffboardingTask::class,
            $offboardingTask->id,
            null,
            ['task_type' => $offboardingTask->task_type, 'notes' => $validated['notes'] ?? null],
            $request
        );

        return back()->with('success', 'Task waived.');
    }

    // ── Complete checklist (issue clearance) ────────────────────────────────

    public function completeChecklist(Request $request, OffboardingChecklist $offboardingChecklist): RedirectResponse
    {
        $this->authorise($request);

        $pendingCount = $offboardingChecklist->tasks()
            ->where('status', 'pending')
            ->count();

        if ($pendingCount > 0) {
            return back()->with('error', "Cannot issue clearance: {$pendingCount} task(s) are still pending.");
        }

        $offboardingChecklist->update([
            'status'            => 'completed',
            'clearance_signed_at' => now(),
        ]);

        AuditLogger::record(
            'offboarding',
            'checklist_completed',
            OffboardingChecklist::class,
            $offboardingChecklist->id,
            null,
            ['user_id' => $offboardingChecklist->user_id],
            $request
        );

        return back()->with('success', 'Clearance certificate issued. Offboarding complete.');
    }

    // ── Update exit interview ────────────────────────────────────────────────

    public function updateExitInterview(Request $request, OffboardingChecklist $offboardingChecklist): RedirectResponse
    {
        $this->authorise($request);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $offboardingChecklist->update([
            'exit_interview_completed_at' => now(),
            'notes'                       => $validated['notes'] ?? $offboardingChecklist->notes,
        ]);

        // Sync status if still initiated
        if ($offboardingChecklist->status === 'initiated') {
            $offboardingChecklist->update(['status' => 'in_progress']);
        }

        AuditLogger::record(
            'offboarding',
            'exit_interview_completed',
            OffboardingChecklist::class,
            $offboardingChecklist->id,
            null,
            ['user_id' => $offboardingChecklist->user_id],
            $request
        );

        return back()->with('success', 'Exit interview recorded.');
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    /**
     * Advance checklist status from initiated -> in_progress when any task
     * is touched, without ever moving backwards.
     */
    private function syncChecklistStatus(OffboardingChecklist $checklist): void
    {
        $checklist->refresh();

        if ($checklist->status === 'initiated') {
            $checklist->update(['status' => 'in_progress']);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function transformChecklist(OffboardingChecklist $checklist): array
    {
        return [
            'id'                          => $checklist->id,
            'status'                      => $checklist->status,
            'termination_date'            => $checklist->termination_date?->toDateString(),
            'reason'                      => $checklist->reason,
            'exit_interview_completed_at' => $checklist->exit_interview_completed_at?->toIso8601String(),
            'clearance_signed_at'         => $checklist->clearance_signed_at?->toIso8601String(),
            'notes'                       => $checklist->notes,
            'completion_percentage'       => $checklist->completionPercentage(),
            'user'                        => [
                'id'          => $checklist->user->id,
                'name'        => $checklist->user->name,
                'employee_id' => $checklist->user->employee_id ?? '',
                'department'  => $checklist->user->department ?? '',
                'position'    => $checklist->user->position ?? '',
            ],
            'initiated_by' => $checklist->initiatedBy ? [
                'id'   => $checklist->initiatedBy->id,
                'name' => $checklist->initiatedBy->name,
            ] : null,
            'tasks' => $checklist->tasks->map(fn (OffboardingTask $t) => [
                'id'           => $t->id,
                'task_type'    => $t->task_type,
                'title'        => $t->title,
                'description'  => $t->description,
                'status'       => $t->status,
                'completed_at' => $t->completed_at?->toIso8601String(),
                'notes'        => $t->notes,
                'sort_order'   => $t->sort_order,
                'completed_by' => $t->completedBy ? ['id' => $t->completedBy->id, 'name' => $t->completedBy->name] : null,
                'assigned_to'  => $t->assignedTo  ? ['id' => $t->assignedTo->id,  'name' => $t->assignedTo->name]  : null,
            ])->values()->all(),
        ];
    }
}
