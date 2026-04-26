<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\ComplianceTraining;
use App\Models\ComplianceTrainingAssignment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ComplianceTrainingController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $trainings = ComplianceTraining::withCount('assignments')
            ->when($request->category, fn ($q, $c) => $q->where('category', $c))
            ->when($request->boolean('active_only', false), fn ($q) => $q->where('is_active', true))
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        $staff = User::orderBy('name')->get(['id', 'name', 'employee_id']);

        $assignments = ComplianceTrainingAssignment::with('training', 'user')
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderBy('due_at')
            ->paginate(25, ['*'], 'apage')
            ->withQueryString();

        return Inertia::render('Compliance/ComplianceTrainingsPage', [
            'trainings' => $trainings,
            'assignments' => $assignments,
            'staff_list' => $staff,
            'filters' => $request->only('category', 'active_only', 'status'),
            'can_report' => $request->user()->hasPermission('compliance.report'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'in:data_protection,health_safety,anti_bribery,code_of_conduct,cybersecurity,general'],
            'is_mandatory' => ['boolean'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'content_url' => ['nullable', 'url', 'max:500'],
            'recurrence_months' => ['nullable', 'integer', 'min:1'],
        ]);

        ComplianceTraining::create($data);

        return back()->with('success', 'Training created.');
    }

    public function update(Request $request, ComplianceTraining $training): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'in:data_protection,health_safety,anti_bribery,code_of_conduct,cybersecurity,general'],
            'is_mandatory' => ['boolean'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'content_url' => ['nullable', 'url', 'max:500'],
            'recurrence_months' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ]);

        $training->update($data);

        return back()->with('success', 'Training updated.');
    }

    public function assign(Request $request, ComplianceTraining $training): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $data = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['exists:users,id'],
            'due_at' => ['required', 'date', 'after:today'],
        ]);

        $assigned = 0;
        foreach ($data['user_ids'] as $userId) {
            $exists = ComplianceTrainingAssignment::where('training_id', $training->id)
                ->where('user_id', $userId)
                ->exists();

            if (! $exists) {
                ComplianceTrainingAssignment::create([
                    'training_id' => $training->id,
                    'user_id' => $userId,
                    'assigned_by_id' => $request->user()->id,
                    'due_at' => $data['due_at'],
                    'status' => 'pending',
                ]);
                $assigned++;
            }
        }

        return back()->with('success', "{$assigned} assignment(s) created.");
    }

    public function report(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('compliance.report'), 403);

        $statusFilter = $request->get('status');
        $trainingFilter = $request->get('training_id');

        $assignments = ComplianceTrainingAssignment::with(['training:id,title,category', 'user:id,name,employee_id'])
            ->when($trainingFilter, fn ($q) => $q->where('training_id', $trainingFilter))
            ->when($statusFilter && $statusFilter !== 'all', function ($q) use ($statusFilter) {
                if ($statusFilter === 'overdue') {
                    $q->where('status', 'pending')->whereDate('due_at', '<', now());
                } else {
                    $q->where('status', $statusFilter);
                }
            })
            ->orderBy('due_at')
            ->paginate(50)
            ->withQueryString();

        // Summary stats across ALL assignments (unfiltered).
        $allStats = ComplianceTrainingAssignment::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $totalAssigned = (int) ComplianceTrainingAssignment::count();
        $completed = (int) ($allStats['completed'] ?? 0);
        $overdue = (int) ComplianceTrainingAssignment::where('status', 'pending')
            ->whereDate('due_at', '<', now())->count();

        $stats = [
            'total_employees' => (int) User::where('status', 'active')->count(),
            'total_assigned' => $totalAssigned,
            'completed' => $completed,
            'overdue' => $overdue,
            'pending' => (int) ($allStats['pending'] ?? 0),
        ];

        $trainings = ComplianceTraining::where('is_active', true)
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('Compliance/ComplianceReportPage', [
            'assignments' => $assignments,
            'stats' => $stats,
            'trainings' => $trainings,
            'filters' => $request->only('status', 'training_id'),
        ]);
    }

    public function complete(Request $request, ComplianceTraining $training): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.self'), 403);

        $assignment = ComplianceTrainingAssignment::where('training_id', $training->id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        abort_if($assignment->isCompleted(), 422);

        $data = $request->validate([
            'completion_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $assignment->update([
            'status' => 'completed',
            'completed_at' => now(),
            'completion_notes' => $data['completion_notes'] ?? null,
        ]);

        return back()->with('success', 'Training marked as completed.');
    }
}
