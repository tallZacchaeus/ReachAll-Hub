<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isManager = $this->isManager($user);

        $taskQuery = Task::query()
            ->with([
                'assignedTo:id,employee_id,name,department',
                'assignedBy:id,employee_id,name',
                'comments.user:id,name',
            ])
            ->orderByRaw("case when status = 'completed' then 1 else 0 end")
            ->orderBy('due_date');

        if (! $isManager) {
            $taskQuery->where(function ($query) use ($user) {
                $query->where('assigned_to_user_id', $user->id)
                    ->orWhere('assigned_by_user_id', $user->id);
            });
        }

        $tasks = $taskQuery->get()->map(fn (Task $task) => $this->transformTask($task));

        $staffQuery = User::query()->orderBy('name');
        if (! $isManager) {
            $staffQuery->whereKey($user->id);
        }

        $staffOptions = $staffQuery->get()->map(fn (User $staff) => [
            'employeeId' => $staff->employee_id ?? '',
            'name' => $staff->name,
            'department' => $staff->department,
        ]);

        $departments = User::query()
            ->whereNotNull('department')
            ->distinct()
            ->orderBy('department')
            ->pluck('department')
            ->values();

        $projects = Task::query()
            ->whereNotNull('project')
            ->distinct()
            ->orderBy('project')
            ->pluck('project')
            ->values();

        return Inertia::render('TasksPage', [
            'userRole' => $user->role,
            'tasks' => $tasks,
            'staffOptions' => $staffOptions,
            'departments' => $departments,
            'projects' => $projects,
            'currentUserEmployeeId' => $user->employee_id,
            'currentUserName' => $user->name,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isManager = $this->isManager($user);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'assignedTo' => [
                Rule::requiredIf($isManager),
                'nullable',
                'string',
                Rule::exists(User::class, 'employee_id'),
            ],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'dueDate' => ['required', 'date'],
            'description' => ['nullable', 'string'],
            'department' => ['nullable', 'string', 'max:255'],
            'project' => ['nullable', 'string', 'max:255'],
        ]);

        $assignee = $isManager
            ? User::query()->where('employee_id', $validated['assignedTo'])->firstOrFail()
            : $user;

        Task::create([
            'title' => $validated['title'],
            'assigned_to_user_id' => $assignee->id,
            'assigned_by_user_id' => $user->id,
            'priority' => $validated['priority'],
            'due_date' => $validated['dueDate'],
            'status' => 'todo',
            'progress' => 0,
            'description' => $validated['description'] ?? null,
            'department' => $validated['department'] ?: $assignee->department,
            'project' => $validated['project'] ?: null,
            'subtasks' => [],
            'tags' => [],
            'attachments' => [],
        ]);

        return back()->with('success', 'Task created successfully!');
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTaskMutation($request, $task);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'dueDate' => ['required', 'date'],
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
            'description' => ['nullable', 'string'],
        ]);

        $task->update([
            'title' => $validated['title'],
            'priority' => $validated['priority'],
            'due_date' => $validated['dueDate'],
            'progress' => $validated['progress'],
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', 'Task updated successfully!');
    }

    public function updateStatus(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTaskMutation($request, $task);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['todo', 'in-progress', 'blocked', 'completed'])],
        ]);

        $payload = [
            'status' => $validated['status'],
        ];

        if ($validated['status'] === 'completed') {
            $payload['progress'] = 100;
        }

        $task->update($payload);

        return back()->with('success', 'Task status updated!');
    }

    public function destroy(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTaskMutation($request, $task);

        $task->delete();

        return back()->with('success', 'Task deleted!');
    }

    public function storeComment(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTaskAccess($request, $task);

        $validated = $request->validate([
            'text' => ['required', 'string', 'max:5000'],
        ]);

        TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $request->user()->id,
            'text' => $validated['text'],
        ]);

        return back()->with('success', 'Comment added!');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformTask(Task $task): array
    {
        $assignedTo = $task->assignedTo;
        $assignedBy = $task->assignedBy;

        return [
            'id' => (string) $task->id,
            'title' => $task->title,
            'assignedTo' => $assignedTo?->employee_id ?? '',
            'assignedBy' => $assignedBy?->employee_id ?? '',
            'assignedByName' => $assignedBy?->name ?? 'Unknown',
            'assignedToName' => $assignedTo?->name ?? 'Unassigned',
            'priority' => $task->priority,
            'dueDate' => $task->due_date?->toDateString() ?? '',
            'status' => $task->status,
            'progress' => $task->progress,
            'comments' => $task->comments->map(fn (TaskComment $comment) => [
                'id' => (string) $comment->id,
                'author' => $comment->user?->name ?? 'Unknown',
                'authorAvatar' => $this->initials($comment->user?->name ?? 'Unknown'),
                'text' => $comment->text,
                'timestamp' => $comment->created_at?->diffForHumans() ?? '',
            ])->values(),
            'description' => $task->description,
            'createdAt' => $task->created_at?->toDateString() ?? '',
            'assignedTimestamp' => $task->created_at?->format('M j, Y - h:i A') ?? '',
            'subtasks' => $task->subtasks ?? [],
            'tags' => $task->tags ?? [],
            'attachments' => $task->attachments ?? [],
            'department' => $task->department ?: $assignedTo?->department,
            'project' => $task->project,
        ];
    }

    private function authorizeTaskAccess(Request $request, Task $task): void
    {
        $user = $request->user();

        if ($this->isManager($user)) {
            return;
        }

        if ($task->assigned_to_user_id !== $user->id && $task->assigned_by_user_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }
    }

    private function authorizeTaskMutation(Request $request, Task $task): void
    {
        $user = $request->user();

        if ($this->isManager($user)) {
            return;
        }

        if ($task->assigned_to_user_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }
    }

    private function isManager(User $user): bool
    {
        return in_array($user->role, ['management', 'superadmin', 'hr'], true);
    }

    private function initials(string $name): string
    {
        return collect(preg_split('/\s+/', trim($name)) ?: [])
            ->filter()
            ->take(2)
            ->map(fn (string $part) => strtoupper($part[0]))
            ->implode('');
    }
}
