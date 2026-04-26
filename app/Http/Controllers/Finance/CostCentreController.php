<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\CostCentre;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CostCentreController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorise($request->user());

        // Load full tree: roots with children and grandchildren
        $roots = CostCentre::with(['children.children', 'head:id,name', 'creator:id,name'])
            ->roots()
            ->orderBy('code')
            ->get()
            ->map(fn (CostCentre $cc) => $this->formatNode($cc, true));

        $users = User::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'department']);

        return Inertia::render('Finance/CostCentreAdminPage', [
            'tree' => $roots,
            'users' => $users,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise($request->user());

        $validated = $request->validate([
            'code' => ['required', 'string', 'size:4', 'unique:cost_centres,code'],
            'name' => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'integer', 'exists:cost_centres,id'],
            'head_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'budget_kobo' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        CostCentre::create(array_merge($validated, ['created_by' => $request->user()->id]));

        return back()->with('success', 'Cost centre created.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->authorise($request->user());

        $cc = CostCentre::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'integer', 'exists:cost_centres,id'],
            'head_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'budget_kobo' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        // Prevent a node from being its own parent or a circular reference
        if (isset($validated['parent_id']) && $validated['parent_id'] === $id) {
            return back()->withErrors(['parent_id' => 'A cost centre cannot be its own parent.']);
        }

        $cc->update($validated);

        return back()->with('success', 'Cost centre updated.');
    }

    private function formatNode(CostCentre $cc, bool $withChildren = false): array
    {
        $node = [
            'id' => $cc->id,
            'code' => $cc->code,
            'name' => $cc->name,
            'parent_id' => $cc->parent_id,
            'head_user_id' => $cc->head_user_id,
            'head_name' => $cc->head?->name,
            'budget_kobo' => $cc->budget_kobo,
            'status' => $cc->status,
            'depth' => $cc->depth,
        ];

        if ($withChildren && $cc->relationLoaded('children')) {
            $node['children'] = $cc->children->map(fn (CostCentre $child) => $this->formatNode($child, true))->values()->all();
        }

        return $node;
    }

    /**
     * Archive a cost centre instead of deleting.
     * Financial principle: never hard-delete entities with transaction history.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->authorise($request->user());

        $cc = CostCentre::findOrFail($id);
        $cc->update(['status' => 'archived']);

        return back()->with('success', 'Cost centre archived successfully.');
    }

    private function authorise(User $user): void
    {
        if (! $user->isFinanceAdmin()) {
            abort(403);
        }
    }
}
