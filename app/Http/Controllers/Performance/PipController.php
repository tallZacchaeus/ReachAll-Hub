<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\PipMilestone;
use App\Models\PipPlan;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PipController extends Controller
{
    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $canManage = $user->hasPermission('reviews.manage');

        $query = PipPlan::with([
            'user:id,name,employee_id,department',
            'initiatedBy:id,name',
            'milestones',
        ]);

        if ($canManage) {
            // HR sees all
        } elseif ($user->directReports()->exists()) {
            // Managers see own PIPs + their direct reports
            $directReportIds = $user->directReports()->pluck('id')->toArray();
            $query->where(function ($q) use ($user, $directReportIds) {
                $q->where('user_id', $user->id)
                    ->orWhereIn('user_id', $directReportIds);
            });
        } else {
            // Staff see own
            $query->where('user_id', $user->id);
        }

        $pips = $query->orderByDesc('created_at')->get();

        $employees = $canManage
            ? User::where('status', 'active')->get(['id', 'name', 'employee_id', 'department'])
            : collect();

        return Inertia::render('Performance/PipsPage', [
            'pips' => $pips,
            'employees' => $employees,
            'canManage' => $canManage,
            'authId' => $user->id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $canCreate = $user->hasPermission('reviews.manage')
            || ($user->directReports()->exists());

        abort_unless($canCreate, 403);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'performance_review_id' => ['nullable', 'exists:performance_reviews,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:3000'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        // Managers can only create PIPs for direct reports
        if (! $user->hasPermission('reviews.manage')) {
            $directReportIds = $user->directReports()->pluck('id')->toArray();
            abort_unless(in_array((int) $validated['user_id'], $directReportIds, true), 403);
        }

        $pip = PipPlan::create(array_merge($validated, [
            'initiated_by_id' => $user->id,
            'status' => 'draft',
        ]));

        AuditLogger::record(
            'performance',
            'pip.created',
            PipPlan::class,
            $pip->id,
            null,
            $pip->toArray(),
            $request,
        );

        return redirect()->route('performance.pips.show', $pip)
            ->with('success', 'PIP created.');
    }

    public function show(PipPlan $pipPlan): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $this->authoriseView($pipPlan, $user);

        $pipPlan->load([
            'user:id,name,employee_id,department,position',
            'initiatedBy:id,name',
            'performanceReview',
            'milestones',
        ]);

        return Inertia::render('Performance/PipDetailPage', [
            'pip' => $pipPlan,
            'canManage' => $user->hasPermission('reviews.manage') || $user->directReports()->where('id', $pipPlan->user_id)->exists(),
            'authId' => $user->id,
        ]);
    }

    public function update(Request $request, PipPlan $pipPlan): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $canEdit = $user->hasPermission('reviews.manage')
            || $user->directReports()->where('id', $pipPlan->user_id)->exists();

        abort_unless($canEdit, 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:3000'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'status' => ['sometimes', 'in:draft,active,completed,failed,cancelled'],
            'outcome' => ['nullable', 'string', 'max:3000'],
            'outcome_date' => ['nullable', 'date'],
        ]);

        $old = $pipPlan->toArray();

        $pipPlan->update($validated);

        AuditLogger::record(
            'performance',
            'pip.updated',
            PipPlan::class,
            $pipPlan->id,
            $old,
            $pipPlan->fresh()->toArray(),
            $request,
        );

        return back()->with('success', 'PIP updated.');
    }

    public function storeMilestone(Request $request, PipPlan $pipPlan): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $canEdit = $user->hasPermission('reviews.manage')
            || $user->directReports()->where('id', $pipPlan->user_id)->exists();

        abort_unless($canEdit, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'due_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $pipPlan->milestones()->create(array_merge($validated, [
            'status' => 'pending',
        ]));

        return back()->with('success', 'Milestone added.');
    }

    public function updateMilestone(Request $request, PipPlan $pipPlan, PipMilestone $pipMilestone): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        abort_unless($pipMilestone->pip_plan_id === $pipPlan->id, 404);

        $canEdit = $user->hasPermission('reviews.manage')
            || $user->directReports()->where('id', $pipPlan->user_id)->exists();

        abort_unless($canEdit, 403);

        $validated = $request->validate([
            'status' => ['required', 'in:pending,completed,missed'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $extra = [];
        if ($validated['status'] === 'completed' && $pipMilestone->completed_at === null) {
            $extra['completed_at'] = now();
        }

        $pipMilestone->update(array_merge($validated, $extra));

        return back()->with('success', 'Milestone updated.');
    }

    private function authoriseView(PipPlan $pip, User $user): void
    {
        if ($user->hasPermission('reviews.manage')) {
            return;
        }

        $allowed = $pip->user_id === $user->id
            || $user->directReports()->where('id', $pip->user_id)->exists();

        abort_unless($allowed, 403);
    }
}
