<?php

namespace App\Http\Controllers\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\OfferLetter;
use App\Models\PreboardingTask;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PreboardingController extends Controller
{
    /**
     * List all accepted offer letters that still have incomplete preboarding tasks.
     *
     * Permission: onboarding.manage
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('onboarding.manage'), 403);

        $offers = OfferLetter::query()
            ->where('status', 'accepted')
            ->with([
                'application.candidate',
                'application.jobRequisition',
                'preboarding_tasks',
            ])
            ->get()
            ->filter(fn (OfferLetter $o) => $o->preboarding_tasks->where('status', 'pending')->isNotEmpty())
            ->map(fn (OfferLetter $o) => [
                'id' => $o->id,
                'candidate' => [
                    'id' => $o->application?->candidate?->id,
                    'name' => $o->application?->candidate?->name ?? 'Unknown Candidate',
                ],
                'position_title' => $o->application?->jobRequisition?->title ?? $o->application?->position_applied ?? '—',
                'start_date' => $o->start_date?->toDateString(),
                'tasks_total' => $o->preboarding_tasks->count(),
                'tasks_completed' => $o->preboarding_tasks->where('status', 'completed')->count(),
                'status' => $o->status,
                'updated_at' => $o->updated_at?->toDateTimeString(),
            ])
            ->values();

        return Inertia::render('Recruitment/PreboardingPage', [
            'offers' => $offers,
        ]);
    }

    /**
     * Show the preboarding task checklist for a specific accepted offer letter.
     *
     * Permission: onboarding.manage
     */
    public function showOffer(Request $request, OfferLetter $offerLetter): Response
    {
        abort_unless($request->user()->hasPermission('onboarding.manage'), 403);
        abort_unless($offerLetter->status === 'accepted', 422);

        $offerLetter->load([
            'application.candidate',
            'application.jobRequisition',
            'preboarding_tasks.completedBy',
        ]);

        $tasks = $offerLetter->preboarding_tasks->map(fn (PreboardingTask $t) => [
            'id' => $t->id,
            'task_type' => $t->task_type,
            'title' => $t->title,
            'description' => $t->description,
            'status' => $t->status,
            'due_date' => $t->due_date?->toDateString(),
            'completed_at' => $t->completed_at?->toDateTimeString(),
            'completed_by' => $t->completedBy ? ['id' => $t->completedBy->id, 'name' => $t->completedBy->name] : null,
            'notes' => $t->notes,
        ]);

        return Inertia::render('Recruitment/PreboardingDetailPage', [
            'offer' => [
                'id' => $offerLetter->id,
                'candidate' => [
                    'id' => $offerLetter->application?->candidate?->id,
                    'name' => $offerLetter->application?->candidate?->name ?? 'Unknown Candidate',
                ],
                'position_title' => $offerLetter->application?->jobRequisition?->title
                    ?? $offerLetter->application?->position_applied
                    ?? '—',
                'start_date' => $offerLetter->start_date?->toDateString(),
                'status' => $offerLetter->status,
            ],
            'tasks' => $tasks,
            'tasks_total' => $tasks->count(),
            'tasks_completed' => $tasks->where('status', 'completed')->count(),
        ]);
    }

    /**
     * Mark a preboarding task as completed.
     *
     * Permission: onboarding.manage
     */
    public function complete(Request $request, PreboardingTask $preboardingTask): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('onboarding.manage'), 403);
        abort_unless($preboardingTask->status === 'pending', 422);

        $data = $request->validate([
            'notes' => 'nullable|string|max:2000',
        ]);

        $preboardingTask->update([
            'status' => 'completed',
            'completed_at' => now(),
            'completed_by_id' => $request->user()->id,
            'notes' => $data['notes'] ?? null,
        ]);

        AuditLogger::record(
            'onboarding',
            'task_completed',
            PreboardingTask::class,
            $preboardingTask->id,
            ['status' => 'pending'],
            ['status' => 'completed', 'completed_by_id' => $request->user()->id],
            $request,
        );

        return back()->with('success', 'Task marked as completed.');
    }

    /**
     * Waive a preboarding task (i.e. it is not required for this hire).
     *
     * Permission: onboarding.manage
     */
    public function waive(Request $request, PreboardingTask $preboardingTask): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('onboarding.manage'), 403);
        abort_unless($preboardingTask->status === 'pending', 422);

        $data = $request->validate([
            'notes' => 'nullable|string|max:2000',
        ]);

        $preboardingTask->update([
            'status' => 'waived',
            'notes' => $data['notes'] ?? null,
        ]);

        AuditLogger::record(
            'onboarding',
            'task_waived',
            PreboardingTask::class,
            $preboardingTask->id,
            ['status' => 'pending'],
            ['status' => 'waived'],
            $request,
        );

        return back()->with('success', 'Task waived.');
    }

    /**
     * Add a custom preboarding task to an accepted offer letter.
     *
     * Permission: onboarding.manage
     */
    public function addTask(Request $request, OfferLetter $offerLetter): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('onboarding.manage'), 403);
        abort_unless($offerLetter->status === 'accepted', 422);

        $data = $request->validate([
            'task_type' => 'required|in:document_upload,policy_ack,equipment_request,it_access,bank_details,compliance_doc',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string|max:3000',
            'due_date' => 'nullable|date',
        ]);

        $task = $offerLetter->preboarding_tasks()->create([
            'task_type' => $data['task_type'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'due_date' => $data['due_date'] ?? null,
            'status' => 'pending',
        ]);

        AuditLogger::record(
            'onboarding',
            'task_added',
            PreboardingTask::class,
            $task->id,
            null,
            ['offer_letter_id' => $offerLetter->id, 'title' => $task->title, 'task_type' => $task->task_type],
            $request,
        );

        return back()->with('success', 'Task added.');
    }
}
