<?php

namespace App\Http\Controllers;

use App\Models\ResourceRequest;
use App\Models\ResourceRequestComment;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ResourceRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $this->isAdmin($user);

        $query = ResourceRequest::query()
            ->with(['user:id,employee_id,name', 'reviewer:id,name', 'comments.user:id,name'])
            ->latest();

        if (! $isAdmin) {
            $query->where('user_id', $user->id);
        }

        $projectOptions = Task::query()
            ->whereNotNull('project')
            ->distinct()
            ->orderBy('project')
            ->pluck('project')
            ->values();

        $taggedPeople = User::query()
            ->orderBy('name')
            ->get(['name'])
            ->pluck('name')
            ->filter()
            ->values();

        return Inertia::render('RequestsPage', [
            'userRole' => $user->role,
            'requests' => $query->get()->map(fn (ResourceRequest $resourceRequest) => $this->transformRequest($resourceRequest))->all(),
            'projectOptions' => $projectOptions,
            'taggedPeople' => $taggedPeople,
            'currentUserName' => $user->name,
            'currentUserEmployeeId' => $user->employee_id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $multiLevel = ['budget_approval', 'procurement'];

        $validated = $request->validate([
            'type'         => ['required', Rule::in(['invoice', 'funds', 'equipment', 'budget_approval', 'procurement'])],
            'title'        => ['required', 'string', 'max:255'],
            'description'  => ['required', 'string'],
            'amount'       => ['nullable', 'numeric', 'min:0'],
            'project'      => ['required', 'string', 'max:255'],
            'taggedPerson' => ['nullable', 'string', 'max:255'],
        ]);

        // Multi-level approval chain for budget/procurement
        $approvalChain = in_array($validated['type'], $multiLevel, true)
            ? ['management', 'hr', 'superadmin']
            : null;

        ResourceRequest::create([
            'user_id'        => $request->user()->id,
            'type'           => $validated['type'],
            'title'          => $validated['title'],
            'description'    => $validated['description'],
            'amount'         => $validated['amount'] ?? null,
            'project'        => $validated['project'],
            'status'         => 'pending',
            'tagged_person'  => $validated['taggedPerson'] ?? null,
            'attachments'    => [],
            'receipts'       => [],
            'approval_chain' => $approvalChain,
            'approval_level' => 0,
        ]);

        return back()->with('success', 'Request submitted successfully!');
    }

    public function storeComment(Request $request, ResourceRequest $resourceRequest): RedirectResponse
    {
        $this->authorizeView($request->user(), $resourceRequest);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
        ]);

        ResourceRequestComment::create([
            'resource_request_id' => $resourceRequest->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        return back()->with('success', 'Comment added!');
    }

    public function updateStatus(Request $request, ResourceRequest $resourceRequest): RedirectResponse
    {
        if (! $this->isAdmin($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'status'  => ['required', Rule::in(['approved', 'declined'])],
            'comment' => ['nullable', 'string', 'max:5000'],
        ]);

        $chain = $resourceRequest->approval_chain;

        if ($validated['status'] === 'declined' || empty($chain)) {
            // Flat approval or explicit decline
            $resourceRequest->update([
                'status'               => $validated['status'],
                'reviewed_by_user_id'  => $request->user()->id,
                'reviewed_at'          => now(),
            ]);
        } else {
            // Multi-level: advance approval_level
            $nextLevel = ($resourceRequest->approval_level ?? 0) + 1;

            if ($nextLevel >= count($chain)) {
                // All levels approved
                $resourceRequest->update([
                    'status'              => 'approved',
                    'approval_level'      => $nextLevel,
                    'reviewed_by_user_id' => $request->user()->id,
                    'reviewed_at'         => now(),
                ]);
            } else {
                // Still more levels — keep pending, advance level
                $resourceRequest->update([
                    'status'         => 'pending',
                    'approval_level' => $nextLevel,
                ]);
            }
        }

        if (! empty($validated['comment'])) {
            ResourceRequestComment::create([
                'resource_request_id' => $resourceRequest->id,
                'user_id'             => $request->user()->id,
                'content'             => $validated['comment'],
            ]);
        }

        return back()->with('success', 'Request status updated successfully!');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformRequest(ResourceRequest $resourceRequest): array
    {
        return [
            'id' => (string) $resourceRequest->id,
            'type' => $resourceRequest->type,
            'title' => $resourceRequest->title,
            'description' => $resourceRequest->description,
            'amount' => $resourceRequest->amount !== null ? (float) $resourceRequest->amount : null,
            'project' => $resourceRequest->project,
            'status' => $resourceRequest->status,
            'createdAt' => $resourceRequest->created_at?->toIso8601String() ?? '',
            'updatedAt' => $resourceRequest->updated_at?->toIso8601String() ?? '',
            'attachments' => $resourceRequest->attachments ?? [],
            'receipts' => $resourceRequest->receipts ?? [],
            'comments' => $resourceRequest->comments->map(function (ResourceRequestComment $comment): array {
                return [
                    'id' => (string) $comment->id,
                    'author' => $comment->user?->name ?? 'Unknown',
                    'content' => $comment->content,
                    'timestamp' => $comment->created_at?->toIso8601String() ?? '',
                ];
            })->values()->all(),
            'taggedPerson'        => $resourceRequest->tagged_person,
            'requesterName'       => $resourceRequest->user?->name ?? 'Unknown',
            'requesterEmployeeId' => $resourceRequest->user?->employee_id ?? '',
            'reviewerName'        => $resourceRequest->reviewer?->name,
            'approvalChain'       => $resourceRequest->approval_chain,
            'approvalLevel'       => $resourceRequest->approval_level ?? 0,
        ];
    }

    private function authorizeView(User $user, ResourceRequest $resourceRequest): void
    {
        if ($this->isAdmin($user) || $resourceRequest->user_id === $user->id) {
            return;
        }

        abort(403);
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasPermission('requests.review');
    }
}
