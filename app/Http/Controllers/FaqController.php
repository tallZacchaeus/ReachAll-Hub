<?php

namespace App\Http\Controllers;

use App\Models\FaqEntry;
use App\Services\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FaqController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim($request->get('q', ''));

        $query = FaqEntry::published()->orderBy('category')->orderBy('sort_order');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                  ->orWhere('answer', 'like', "%{$search}%");
            });
        }

        $faqs = $query->get()->map(fn (FaqEntry $f) => [
            'id'       => $f->id,
            'question' => $f->question,
            'answer'   => $f->answer,
            'category' => $f->category,
        ]);

        // Group by category when no search
        $grouped = [];
        if ($search === '') {
            foreach ($faqs as $faq) {
                $grouped[$faq['category']][] = $faq;
            }
        }

        return Inertia::render('FaqPage', [
            'faqs'    => $faqs,
            'grouped' => $grouped,
            'search'  => $search,
        ]);
    }

    public function adminIndex(Request $request): Response
    {
        if (! $this->isAdmin($request->user())) {
            abort(403);
        }

        $faqs = FaqEntry::orderBy('category')->orderBy('sort_order')->get();

        return Inertia::render('Admin/FaqManagerPage', [
            'faqs' => $faqs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $this->isAdmin($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'question'     => ['required', 'string', 'max:500'],
            'answer'       => ['required', 'string'],
            'category'     => ['required', 'string', 'max:100'],
            'sort_order'   => ['nullable', 'integer', 'min:0'],
            'is_published' => ['boolean'],
        ]);

        FaqEntry::create([
            'question'     => $validated['question'],
            'answer'       => HtmlSanitizer::clean($validated['answer']),
            'category'     => $validated['category'],
            'sort_order'   => $validated['sort_order'] ?? 0,
            'is_published' => $validated['is_published'] ?? true,
        ]);

        return back()->with('success', 'FAQ created successfully.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        if (! $this->isAdmin($request->user())) {
            abort(403);
        }

        $faq = FaqEntry::findOrFail($id);

        $validated = $request->validate([
            'question'     => ['required', 'string', 'max:500'],
            'answer'       => ['required', 'string'],
            'category'     => ['required', 'string', 'max:100'],
            'sort_order'   => ['nullable', 'integer', 'min:0'],
            'is_published' => ['boolean'],
        ]);

        $validated['answer'] = HtmlSanitizer::clean($validated['answer']);
        $faq->update($validated);

        return back()->with('success', 'FAQ updated successfully.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        if (! $this->isAdmin($request->user())) {
            abort(403);
        }

        FaqEntry::findOrFail($id)->delete();

        return back()->with('success', 'FAQ deleted.');
    }

    private function isAdmin($user): bool
    {
        return in_array($user->role, ['superadmin', 'hr', 'management'], true);
    }
}
