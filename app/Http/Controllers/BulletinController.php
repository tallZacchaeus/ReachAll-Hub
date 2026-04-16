<?php

namespace App\Http\Controllers;

use App\Models\Bulletin;
use App\Models\User;
use App\Services\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BulletinController extends Controller
{
    // ─── Staff ───────────────────────────────────────────────────────────────

    public function index(): Response
    {
        $bulletins = Bulletin::with('author:id,name')
            ->active()
            ->ordered()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('BulletinBoardPage', [
            'bulletins' => $bulletins->through(fn ($b) => $this->transform($b)),
        ]);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    public function adminIndex(Request $request): Response
    {
        $this->requireAdmin($request);

        $bulletins = Bulletin::with('author:id,name')
            ->ordered()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/BulletinEditorPage', [
            'bulletins' => $bulletins->through(fn ($b) => $this->transformAdmin($b)),
            'bulletin' => null,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);

        return Inertia::render('Admin/BulletinEditorPage', [
            'bulletin' => null,
            'bulletins' => [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $validated = $this->validateRequest($request);
        $validated['body'] = HtmlSanitizer::clean($validated['body'] ?? '');

        $data = array_merge($validated, [
            'author_id' => $request->user()->id,
        ]);

        if (! empty($data['is_published'])) {
            $data['published_at'] = now();
        }

        Bulletin::create($data);

        return redirect()
            ->route('admin.bulletins.index')
            ->with('success', 'Bulletin created.');
    }

    public function edit(Request $request, int $id): Response
    {
        $this->requireAdmin($request);

        $bulletin = Bulletin::findOrFail($id);

        $allBulletins = Bulletin::with('author:id,name')
            ->ordered()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/BulletinEditorPage', [
            'bulletin' => $this->transformAdmin($bulletin),
            'bulletins' => $allBulletins->through(fn ($b) => $this->transformAdmin($b)),
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $bulletin = Bulletin::findOrFail($id);
        $validated = $this->validateRequest($request);
        $validated['body'] = HtmlSanitizer::clean($validated['body'] ?? '');

        // Set published_at when first publishing
        if (! empty($validated['is_published']) && ! $bulletin->is_published) {
            $validated['published_at'] = now();
        }
        // Clear published_at when unpublishing
        if (empty($validated['is_published'])) {
            $validated['published_at'] = null;
        }

        $bulletin->update($validated);

        return back()->with('success', 'Bulletin updated.');
    }

    public function togglePin(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $bulletin = Bulletin::findOrFail($id);
        $bulletin->update(['is_pinned' => ! $bulletin->is_pinned]);

        return back()->with('success', $bulletin->is_pinned ? 'Bulletin pinned.' : 'Bulletin unpinned.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        Bulletin::findOrFail($id)->delete();

        return back()->with('success', 'Bulletin deleted.');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function validateRequest(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:500'],
            'priority' => ['required', 'in:info,important,urgent'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:today'],
            'is_pinned' => ['boolean'],
            'is_published' => ['boolean'],
        ]);
    }

    private function isAdmin(User $user): bool
    {
        return in_array($user->role, ['superadmin', 'hr', 'management'], true);
    }

    private function requireAdmin(Request $request): void
    {
        if (! $this->isAdmin($request->user())) {
            abort(403, 'Unauthorized.');
        }
    }

    /** @return array<string, mixed> */
    private function transform(Bulletin $bulletin): array
    {
        return [
            'id' => $bulletin->id,
            'title' => $bulletin->title,
            'body' => $bulletin->body,
            'priority' => $bulletin->priority,
            'is_pinned' => $bulletin->is_pinned,
            'expires_at' => $bulletin->expires_at?->toDateString(),
            'author' => $bulletin->author?->name ?? 'Unknown',
            'published_at' => $bulletin->published_at?->toDateString(),
        ];
    }

    /** @return array<string, mixed> */
    private function transformAdmin(Bulletin $bulletin): array
    {
        return [
            'id' => $bulletin->id,
            'title' => $bulletin->title,
            'body' => $bulletin->body,
            'priority' => $bulletin->priority,
            'is_pinned' => $bulletin->is_pinned,
            'is_published' => $bulletin->is_published,
            'expires_at' => $bulletin->expires_at?->toDateString(),
            'author' => $bulletin->author?->name ?? 'Unknown',
            'published_at' => $bulletin->published_at?->toDateString(),
            'created_at' => $bulletin->created_at?->toDateString(),
        ];
    }
}
