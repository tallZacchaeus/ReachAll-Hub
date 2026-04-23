<?php

namespace App\Http\Controllers;

use App\Models\Newsletter;
use App\Models\User;
use App\Services\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class NewsletterController extends Controller
{
    // ─── Staff: browse ──────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $this->isAdmin($user);

        $query = Newsletter::with('author:id,name')
            ->where('status', 'published')
            ->orderByDesc('published_at');

        if (! $isAdmin) {
            $query->where(function ($q) use ($user) {
                // type = 'all'
                $q->whereJsonContains('target_audience->type', 'all')
                    // OR type = 'department' and value matches user's department
                    ->orWhere(function ($q2) use ($user) {
                        $q2->whereJsonContains('target_audience->type', 'department')
                            ->whereJsonContains('target_audience->value', $user->department ?? '');
                    })
                    // OR type = 'stage' and value matches user's stage
                    ->orWhere(function ($q2) use ($user) {
                        $q2->whereJsonContains('target_audience->type', 'stage')
                            ->whereJsonContains('target_audience->value', $user->employee_stage ?? 'performer');
                    });
            });
        }

        $newsletters = $query->paginate(10)->withQueryString();

        return Inertia::render('NewsletterIndexPage', [
            'newsletters' => $newsletters->through(fn ($n) => $this->transformCard($n)),
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $user = $request->user();
        $isAdmin = $this->isAdmin($user);

        $newsletter = Newsletter::with('author:id,name')->findOrFail($id);

        if ($newsletter->status !== 'published' && ! $isAdmin) {
            abort(404);
        }

        if (! $isAdmin && ! $this->isVisibleToUser($newsletter, $user)) {
            abort(404);
        }

        return Inertia::render('NewsletterViewPage', [
            'newsletter' => $this->transformFull($newsletter),
        ]);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    public function adminIndex(Request $request): Response
    {
        $this->requireAdmin($request);

        $newsletters = Newsletter::with('author:id,name')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/NewsletterManagerPage', [
            'newsletters' => $newsletters->through(fn ($n) => $this->transformAdmin($n)),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);

        return Inertia::render('Admin/NewsletterEditorPage', [
            'newsletter' => null,
            'departments' => $this->departments(),
            'stages' => ['joiner', 'performer', 'leader'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $validated = $this->validateRequest($request);

        $newsletter = Newsletter::create([
            'title' => $validated['title'],
            'body' => HtmlSanitizer::clean($validated['body']),
            'target_audience' => $validated['target_audience'],
            'status' => 'draft',
            'author_id' => $request->user()->id,
            'featured_image' => $this->storeImage($request),
        ]);

        return redirect()
            ->route('admin.newsletters.edit', $newsletter->id)
            ->with('success', 'Newsletter saved as draft.');
    }

    public function edit(Request $request, int $id): Response
    {
        $this->requireAdmin($request);

        $newsletter = Newsletter::findOrFail($id);

        return Inertia::render('Admin/NewsletterEditorPage', [
            'newsletter' => $this->transformFull($newsletter),
            'departments' => $this->departments(),
            'stages' => ['joiner', 'performer', 'leader'],
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $newsletter = Newsletter::findOrFail($id);
        $validated = $this->validateRequest($request);
        $validated['body'] = HtmlSanitizer::clean($validated['body'] ?? '');

        if ($request->hasFile('featured_image')) {
            if ($newsletter->featured_image) {
                Storage::disk('public')->delete($newsletter->featured_image);
            }
            $validated['featured_image'] = $this->storeImage($request);
        }

        $newsletter->update($validated);

        return back()->with('success', 'Newsletter updated.');
    }

    public function publish(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $newsletter = Newsletter::findOrFail($id);

        if ($newsletter->status === 'published') {
            $newsletter->update(['status' => 'draft', 'published_at' => null]);
            return back()->with('success', 'Newsletter unpublished.');
        }

        $newsletter->update(['status' => 'published', 'published_at' => now()]);

        return back()->with('success', 'Newsletter published.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $newsletter = Newsletter::findOrFail($id);

        if ($newsletter->featured_image) {
            Storage::disk('public')->delete($newsletter->featured_image);
        }

        $newsletter->delete();

        return back()->with('success', 'Newsletter deleted.');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function validateRequest(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'target_audience' => ['required', 'array'],
            'target_audience.type' => ['required', 'in:all,department,stage'],
            'target_audience.value' => ['required', 'string'],
            'featured_image' => ['nullable', 'file', 'image', 'max:4096'],
        ]);
    }

    private function storeImage(Request $request): ?string
    {
        if ($request->hasFile('featured_image')) {
            return $request->file('featured_image')->store('newsletter-images', 'public');
        }

        return null;
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasPermission('content.manage');
    }

    private function requireAdmin(Request $request): void
    {
        if (! $this->isAdmin($request->user())) {
            abort(403, 'Unauthorized.');
        }
    }

    private function isVisibleToUser(Newsletter $newsletter, User $user): bool
    {
        $audience = $newsletter->target_audience ?? ['type' => 'all', 'value' => 'all'];
        $type = $audience['type'] ?? 'all';
        $value = $audience['value'] ?? 'all';

        return match ($type) {
            'all' => true,
            'department' => $user->department === $value,
            'stage' => ($user->employee_stage ?? 'performer') === $value,
            default => false,
        };
    }

    /** @return array<string, mixed> */
    private function transformCard(Newsletter $newsletter): array
    {
        $excerpt = mb_substr(strip_tags($newsletter->body), 0, 150);
        if (mb_strlen(strip_tags($newsletter->body)) > 150) {
            $excerpt .= '…';
        }

        return [
            'id' => $newsletter->id,
            'title' => $newsletter->title,
            'excerpt' => $excerpt,
            'featured_image' => $newsletter->featured_image
                ? Storage::disk('public')->url($newsletter->featured_image)
                : null,
            'author' => $newsletter->author?->name ?? 'Unknown',
            'author_initials' => $this->initials($newsletter->author?->name ?? 'Unknown'),
            'published_at' => $newsletter->published_at?->toDateString(),
            'target_audience' => $newsletter->target_audience,
        ];
    }

    /** @return array<string, mixed> */
    private function transformFull(Newsletter $newsletter): array
    {
        return [
            'id' => $newsletter->id,
            'title' => $newsletter->title,
            'body' => $newsletter->body,
            'featured_image' => $newsletter->featured_image
                ? Storage::disk('public')->url($newsletter->featured_image)
                : null,
            'author' => $newsletter->author?->name ?? 'Unknown',
            'author_initials' => $this->initials($newsletter->author?->name ?? 'Unknown'),
            'published_at' => $newsletter->published_at?->toDateString(),
            'status' => $newsletter->status,
            'target_audience' => $newsletter->target_audience ?? ['type' => 'all', 'value' => 'all'],
        ];
    }

    /** @return array<string, mixed> */
    private function transformAdmin(Newsletter $newsletter): array
    {
        return [
            'id' => $newsletter->id,
            'title' => $newsletter->title,
            'status' => $newsletter->status,
            'target_audience' => $newsletter->target_audience ?? ['type' => 'all', 'value' => 'all'],
            'author' => $newsletter->author?->name ?? 'Unknown',
            'published_at' => $newsletter->published_at?->toDateString(),
            'created_at' => $newsletter->created_at?->toDateString(),
        ];
    }

    private function initials(string $name): string
    {
        return collect(preg_split('/\s+/', trim($name)) ?: [])
            ->filter()
            ->take(2)
            ->map(fn (string $part) => strtoupper($part[0]))
            ->implode('');
    }

    /** @return string[] */
    private function departments(): array
    {
        return [
            'Video & Production',
            'Project Management',
            'Product Team',
            'Content & Brand Comms',
            'Interns',
            'Incubator Team',
            'Skillup Team',
            'DAF Team',
            'Graphics Design',
            'Accounting',
            'Business Development',
        ];
    }
}
