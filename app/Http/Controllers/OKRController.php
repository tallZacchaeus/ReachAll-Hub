<?php

namespace App\Http\Controllers;

use App\Models\KeyResult;
use App\Models\Objective;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OKRController extends Controller
{
    public function index(Request $request): Response
    {
        $user    = $request->user();
        $isAdmin = $user->hasPermission('okr.manage');

        $query = Objective::with(['keyResults', 'owner:id,name'])
            ->whereNull('parent_id');

        if ($request->filled('period')) {
            $query->where('period', $request->period);
        }

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        $objectives  = $query->latest()->get()->map(fn (Objective $obj) => $this->transformObjective($obj));
        $periods     = Objective::distinct()->orderBy('period')->pluck('period')->filter()->values();
        $departments = Objective::distinct()->orderBy('department')->pluck('department')->filter()->values();

        return Inertia::render('OKRPage', [
            'objectives'  => $objectives,
            'periods'     => $periods,
            'departments' => $departments,
            'filters'     => $request->only(['period', 'department']),
            'isAdmin'     => $isAdmin,
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $objective = Objective::with(['keyResults', 'owner:id,name', 'children.keyResults'])
            ->findOrFail($id);

        return Inertia::render('OKRDetailPage', [
            'objective' => $this->transformObjectiveFull($objective),
            'isAdmin'   => $request->user()->hasPermission('okr.manage'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermission('okr.manage')) {
            abort(403);
        }

        $validated = $request->validate([
            'title'                      => ['required', 'string', 'max:255'],
            'description'                => ['nullable', 'string'],
            'department'                 => ['nullable', 'string', 'max:100'],
            'period'                     => ['required', 'string', 'max:20'],
            'status'                     => ['required', Rule::in(['draft', 'active', 'completed'])],
            'parent_id'                  => ['nullable', 'exists:objectives,id'],
            'key_results'                => ['nullable', 'array', 'max:10'],
            'key_results.*.title'        => ['required', 'string', 'max:255'],
            'key_results.*.target_value' => ['required', 'numeric', 'min:0'],
            'key_results.*.unit'         => ['required', 'string', 'max:50'],
        ]);

        $objective = Objective::create([
            'title'         => $validated['title'],
            'description'   => $validated['description'] ?? null,
            'owner_user_id' => $user->id,
            'department'    => $validated['department'] ?? null,
            'period'        => $validated['period'],
            'status'        => $validated['status'],
            'parent_id'     => $validated['parent_id'] ?? null,
        ]);

        foreach ($validated['key_results'] ?? [] as $kr) {
            $objective->keyResults()->create([
                'title'         => $kr['title'],
                'target_value'  => $kr['target_value'],
                'current_value' => 0,
                'unit'          => $kr['unit'],
                'status'        => 'on_track',
            ]);
        }

        return back()->with('success', 'Objective created successfully.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermission('okr.manage')) {
            abort(403);
        }

        $objective = Objective::findOrFail($id);

        $validated = $request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'department'  => ['nullable', 'string', 'max:100'],
            'period'      => ['sometimes', 'string', 'max:20'],
            'status'      => ['sometimes', Rule::in(['draft', 'active', 'completed'])],
        ]);

        $objective->update($validated);

        return back()->with('success', 'Objective updated.');
    }

    public function updateKeyResult(Request $request, int $id): RedirectResponse
    {
        $kr = KeyResult::with('objective')->findOrFail($id);

        $validated = $request->validate([
            'current_value' => ['required', 'numeric', 'min:0'],
            'status'        => ['required', Rule::in(['on_track', 'at_risk', 'behind'])],
        ]);

        $kr->update($validated);
        $kr->objective->recalculateProgress();

        return back()->with('success', 'Key result updated.');
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /** @return array<string, mixed> */
    private function transformObjective(Objective $obj): array
    {
        return [
            'id'          => $obj->id,
            'title'       => $obj->title,
            'description' => $obj->description,
            'department'  => $obj->department,
            'period'      => $obj->period,
            'status'      => $obj->status,
            'progress'    => $obj->progress,
            'owner'       => $obj->owner?->name ?? 'Unknown',
            'key_results' => $obj->keyResults
                ->map(fn (KeyResult $kr) => $this->transformKR($kr))
                ->values()
                ->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function transformObjectiveFull(Objective $obj): array
    {
        $base             = $this->transformObjective($obj);
        $base['children'] = $obj->children
            ->map(fn (Objective $child) => $this->transformObjective($child))
            ->values()
            ->all();

        return $base;
    }

    /** @return array<string, mixed> */
    private function transformKR(KeyResult $kr): array
    {
        return [
            'id'            => $kr->id,
            'title'         => $kr->title,
            'target_value'  => $kr->target_value,
            'current_value' => $kr->current_value,
            'unit'          => $kr->unit,
            'status'        => $kr->status,
            'progress'      => $kr->target_value > 0
                ? min(100, (int) round($kr->current_value / $kr->target_value * 100))
                : 0,
        ];
    }
}
