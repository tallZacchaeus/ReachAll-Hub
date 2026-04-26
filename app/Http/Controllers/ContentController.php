<?php

namespace App\Http\Controllers;

use App\Models\ContentCategory;
use App\Models\ContentPage;
use App\Models\PolicyAcknowledgement;
use App\Services\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ContentController extends Controller
{
    // ─── Staff: browse published content ────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();
        $stage = $user->employee_stage ?? 'performer';
        $isAdmin = $this->isAdmin($user);

        $query = ContentPage::with(['category:id,name,slug', 'author:id,name'])
            ->where('is_published', true);

        if (! $isAdmin) {
            $query->whereJsonContains('stage_visibility', $stage);
        }

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%');
        }

        $pages = $query->latest('published_at')->paginate(12)->withQueryString();

        $categories = ContentCategory::orderBy('sort_order')->orderBy('name')->get(['id', 'name', 'slug', 'icon']);

        return Inertia::render('ContentIndexPage', [
            'pages' => $pages->through(fn ($page) => $this->transformPageCard($page)),
            'categories' => $categories,
            'filters' => [
                'category' => $request->category,
                'search' => $request->search,
            ],
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $user = $request->user();
        $stage = $user->employee_stage ?? 'performer';
        $isAdmin = $this->isAdmin($user);

        $page = ContentPage::with(['category:id,name,slug', 'author:id,name'])
            ->where('slug', $slug)
            ->firstOrFail();

        if (! $page->is_published && ! $isAdmin) {
            abort(404);
        }

        if (! $isAdmin && ! in_array($stage, $page->stage_visibility ?? [], true)) {
            abort(404);
        }

        $ack = $page->requires_acknowledgement
            ? PolicyAcknowledgement::where('content_page_id', $page->id)
                ->where('user_id', $user->id)
                ->first()
            : null;

        return Inertia::render('ContentViewPage', [
            'page' => $this->transformPageFull($page),
            'hasAcknowledged' => $ack !== null,
            'acknowledgedAt' => $ack?->acknowledged_at?->toDateString(),
        ]);
    }

    // ─── Admin: manage content ───────────────────────────────────────────────

    public function adminIndex(Request $request): Response
    {
        $this->requireAdmin($request);

        $query = ContentPage::with(['category:id,name', 'author:id,name'])->withTrashed();

        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        if ($request->filled('status')) {
            if ($request->status === 'published') {
                $query->where('is_published', true)->whereNull('deleted_at');
            } elseif ($request->status === 'draft') {
                $query->where('is_published', false)->whereNull('deleted_at');
            } elseif ($request->status === 'deleted') {
                $query->onlyTrashed();
            }
        }

        $pages = $query->latest()->paginate(20)->withQueryString();
        $categories = ContentCategory::orderBy('sort_order')->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/ContentManagerPage', [
            'pages' => $pages->through(fn ($page) => $this->transformAdminCard($page)),
            'categories' => $categories,
            'filters' => [
                'search' => $request->search,
                'category' => $request->category,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);

        $categories = ContentCategory::orderBy('sort_order')->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/ContentEditorPage', [
            'page' => null,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $this->validatePageRequest($request);

        $slug = $this->uniqueSlug($validated['title']);

        $featuredImage = null;
        if ($request->hasFile('featured_image')) {
            $featuredImage = $request->file('featured_image')->store('content-images', 'public');
        }

        $attachments = $this->uploadAttachments($request);

        ContentPage::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'body' => HtmlSanitizer::clean($validated['body'] ?? ''),
            'category_id' => $validated['category_id'],
            'stage_visibility' => $validated['stage_visibility'],
            'requires_acknowledgement' => $validated['requires_acknowledgement'],
            'acknowledgement_deadline' => $validated['acknowledgement_deadline'] ?? null,
            'is_published' => $validated['is_published'],
            'published_at' => $validated['is_published'] ? now() : null,
            'author_id' => $request->user()->id,
            'featured_image' => $featuredImage,
            'attachments' => $attachments,
        ]);

        return redirect()->route('admin.content.index')->with('success', 'Content page created successfully.');
    }

    public function edit(Request $request, int $id): Response
    {
        $this->requireAdmin($request);

        $page = ContentPage::withTrashed()->with(['category:id,name,slug'])->findOrFail($id);
        $categories = ContentCategory::orderBy('sort_order')->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Admin/ContentEditorPage', [
            'page' => $this->transformPageFull($page),
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $page = ContentPage::withTrashed()->findOrFail($id);
        $validated = $this->validatePageRequest($request);
        $validated['body'] = HtmlSanitizer::clean($validated['body'] ?? '');

        // Keep existing featured image if no new one is uploaded
        if ($request->hasFile('featured_image')) {
            if ($page->featured_image) {
                Storage::disk('public')->delete($page->featured_image);
            }
            $validated['featured_image'] = $request->file('featured_image')->store('content-images', 'public');
        } else {
            unset($validated['featured_image']);
        }

        // Append any newly uploaded attachments to existing ones
        $newAttachments = $this->uploadAttachments($request);
        if (! empty($newAttachments)) {
            $validated['attachments'] = array_merge($page->attachments ?? [], $newAttachments);
        } else {
            unset($validated['attachments']);
        }

        if ($validated['is_published'] && ! $page->is_published) {
            $validated['published_at'] = now();
        }

        $page->update($validated);

        return redirect()->route('admin.content.index')->with('success', 'Content page updated successfully.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $page = ContentPage::findOrFail($id);
        $page->delete();

        return back()->with('success', 'Content page deleted.');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    private function uploadAttachments(Request $request): array
    {
        $request->validate([
            'new_attachments' => ['nullable', 'array', 'max:5'],
            'new_attachments.*' => ['nullable', 'file', 'max:10240'],
        ]);

        $result = [];
        if ($request->hasFile('new_attachments')) {
            foreach ($request->file('new_attachments') as $file) {
                $path = $file->store('content-attachments', 'public');
                $result[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => Storage::disk('public')->url($path),
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType() ?? 'application/octet-stream',
                ];
            }
        }

        return $result;
    }

    private function validatePageRequest(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'category_id' => ['required', 'integer', 'exists:content_categories,id'],
            'stage_visibility' => ['required', 'array', 'min:1'],
            'stage_visibility.*' => ['in:joiner,performer,leader'],
            'requires_acknowledgement' => ['boolean'],
            'acknowledgement_deadline' => ['nullable', 'date'],
            'is_published' => ['boolean'],
            'featured_image' => ['nullable', 'file', 'image', 'max:4096'],
        ]);
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $i = 1;

        while (ContentPage::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    private function isAdmin($user): bool
    {
        return $user->hasPermission('content.manage');
    }

    private function requireAdmin(Request $request): void
    {
        if (! $this->isAdmin($request->user())) {
            abort(403, 'Unauthorized.');
        }
    }

    private function excerpt(string $html, int $length = 120): string
    {
        $text = strip_tags($html);

        return mb_strlen($text) > $length ? mb_substr($text, 0, $length).'…' : $text;
    }

    /** @return array<string, mixed> */
    private function transformPageCard(ContentPage $page): array
    {
        return [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'excerpt' => $this->excerpt($page->body),
            'category' => $page->category ? ['name' => $page->category->name, 'slug' => $page->category->slug] : null,
            'author' => $page->author?->name ?? 'Unknown',
            'published_at' => $page->published_at?->toDateString(),
            'featured_image' => $page->featured_image ? Storage::disk('public')->url($page->featured_image) : null,
            'requires_acknowledgement' => $page->requires_acknowledgement,
        ];
    }

    /** @return array<string, mixed> */
    private function transformPageFull(ContentPage $page): array
    {
        return [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'body' => $page->body,
            'category_id' => $page->category_id,
            'category' => $page->category ? ['id' => $page->category->id, 'name' => $page->category->name, 'slug' => $page->category->slug] : null,
            'stage_visibility' => $page->stage_visibility ?? ['joiner', 'performer', 'leader'],
            'is_published' => $page->is_published,
            'author' => $page->author?->name ?? 'Unknown',
            'author_initials' => $this->initials($page->author?->name ?? 'Unknown'),
            'featured_image' => $page->featured_image ? Storage::disk('public')->url($page->featured_image) : null,
            'attachments' => $page->attachments ?? [],
            'requires_acknowledgement' => $page->requires_acknowledgement,
            'acknowledgement_deadline' => $page->acknowledgement_deadline?->toDateString(),
            'published_at' => $page->published_at?->toDateString(),
        ];
    }

    /** @return array<string, mixed> */
    private function transformAdminCard(ContentPage $page): array
    {
        return [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'category' => $page->category ? ['name' => $page->category->name] : null,
            'is_published' => $page->is_published,
            'author' => $page->author?->name ?? 'Unknown',
            'published_at' => $page->published_at?->toDateString(),
            'created_at' => $page->created_at?->toDateString(),
            'deleted_at' => $page->deleted_at?->toDateString(),
            'requires_acknowledgement' => $page->requires_acknowledgement,
            'stage_visibility' => $page->stage_visibility ?? [],
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
}
