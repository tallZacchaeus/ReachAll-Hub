<?php

namespace App\Http\Controllers;

use App\Models\ChecklistItem;
use App\Models\ChecklistTemplate;
use App\Models\UserChecklist;
use App\Models\UserChecklistProgress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChecklistController extends Controller
{
    // ─── Staff ───────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();

        $userChecklists = UserChecklist::where('user_id', $user->id)
            ->with([
                'template.items',
                'progressRecords',
            ])
            ->get();

        $checklists = $userChecklists->map(function (UserChecklist $uc) {
            $items = $uc->template->items;
            $completedIds = $uc->progressRecords
                ->whereNotNull('completed_at')
                ->pluck('checklist_item_id')
                ->flip();

            $completedCount = $completedIds->count();
            $totalCount = $items->count();

            return [
                'id' => $uc->id,
                'template' => [
                    'id' => $uc->template->id,
                    'title' => $uc->template->title,
                    'description' => $uc->template->description,
                ],
                'completion_percentage' => $totalCount > 0
                    ? (int) round(($completedCount / $totalCount) * 100)
                    : 0,
                'completed_count' => $completedCount,
                'total_count' => $totalCount,
                'items' => $items->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'sort_order' => $item->sort_order,
                    'is_required' => $item->is_required,
                    'completed_at' => $completedIds->has($item->id)
                        ? $uc->progressRecords
                            ->firstWhere('checklist_item_id', $item->id)
                            ?->completed_at
                            ?->toDateString()
                        : null,
                ])->values(),
            ];
        })->values();

        return Inertia::render('ChecklistPage', [
            'checklists' => $checklists,
        ]);
    }

    public function toggle(Request $request, int $itemId): RedirectResponse
    {
        $user = $request->user();

        $item = ChecklistItem::findOrFail($itemId);

        $userChecklist = UserChecklist::where('user_id', $user->id)
            ->where('checklist_template_id', $item->checklist_template_id)
            ->firstOrFail();

        $progress = UserChecklistProgress::firstOrCreate(
            [
                'user_checklist_id' => $userChecklist->id,
                'checklist_item_id' => $itemId,
            ],
            ['completed_at' => null]
        );

        if ($progress->completed_at) {
            $progress->update(['completed_at' => null]);
        } else {
            $progress->update(['completed_at' => now()]);
        }

        return back();
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    public function adminIndex(Request $request): Response
    {
        $this->requireAdmin($request);

        $templates = ChecklistTemplate::withCount(['items', 'userChecklists'])
            ->orderBy('stage')
            ->orderBy('title')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'stage' => $t->stage,
                'is_default' => $t->is_default,
                'item_count' => $t->items_count,
                'assignment_count' => $t->user_checklists_count,
            ]);

        return Inertia::render('Admin/ChecklistTemplatePage', [
            'templates' => $templates,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'in:joiner,performer,leader'],
            'is_default' => ['boolean'],
            'items' => ['array'],
            'items.*.title' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.is_required' => ['boolean'],
        ]);

        $template = ChecklistTemplate::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'stage' => $validated['stage'],
            'is_default' => $validated['is_default'] ?? false,
        ]);

        foreach ($validated['items'] ?? [] as $index => $itemData) {
            $template->items()->create([
                'title' => $itemData['title'],
                'description' => $itemData['description'] ?? null,
                'sort_order' => $index,
                'is_required' => $itemData['is_required'] ?? true,
            ]);
        }

        return back()->with('success', 'Checklist template created.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $template = ChecklistTemplate::findOrFail($id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'in:joiner,performer,leader'],
            'is_default' => ['boolean'],
            'items' => ['array'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.title' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.is_required' => ['boolean'],
        ]);

        $template->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'stage' => $validated['stage'],
            'is_default' => $validated['is_default'] ?? false,
        ]);

        // Sync items: keep existing by id, delete removed, upsert all
        $incomingIds = collect($validated['items'] ?? [])
            ->filter(fn ($i) => ! empty($i['id']))
            ->pluck('id')
            ->toArray();

        $template->items()->whereNotIn('id', $incomingIds)->delete();

        foreach ($validated['items'] ?? [] as $index => $itemData) {
            if (! empty($itemData['id'])) {
                ChecklistItem::where('id', $itemData['id'])
                    ->where('checklist_template_id', $template->id)
                    ->update([
                        'title' => $itemData['title'],
                        'description' => $itemData['description'] ?? null,
                        'sort_order' => $index,
                        'is_required' => $itemData['is_required'] ?? true,
                    ]);
            } else {
                $template->items()->create([
                    'title' => $itemData['title'],
                    'description' => $itemData['description'] ?? null,
                    'sort_order' => $index,
                    'is_required' => $itemData['is_required'] ?? true,
                ]);
            }
        }

        return back()->with('success', 'Checklist template updated.');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function requireAdmin(Request $request): void
    {
        if (! $request->user()->hasPermission('checklist.manage')) {
            abort(403, 'Unauthorized.');
        }
    }
}
