<?php

namespace App\Http\Controllers;

use App\Models\Bulletin;
use App\Models\ContentPage;
use App\Models\Course;
use App\Models\FaqEntry;
use App\Models\Newsletter;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function search(Request $request): Response
    {
        $q     = trim($request->get('q', ''));
        $user  = $request->user();
        $stage = $user?->employee_stage ?? 'performer';

        $results = [];

        if (mb_strlen($q) >= 2 && mb_strlen($q) <= 100) {
            $like = "%{$q}%";

            // ── People ──────────────────────────────────────────────────────────
            $people = User::where('status', 'active')
                ->where(fn ($query) => $query
                    ->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('employee_id', 'like', $like)
                )
                ->limit(5)
                ->get(['id', 'name', 'department', 'position', 'employee_id'])
                ->map(fn ($u) => [
                    'id'      => $u->id,
                    'title'   => $u->name,
                    'excerpt' => trim(($u->position ?? '') . ' — ' . ($u->department ?? '')),
                    'url'     => '/directory',
                    'badge'   => $u->employee_id ?? '',
                ])
                ->values()
                ->all();

            if (! empty($people)) {
                $results[] = ['type' => 'People', 'items' => $people];
            }

            // ── Content Pages ────────────────────────────────────────────────────
            $contentPages = ContentPage::where('is_published', true)
                ->whereJsonContains('stage_visibility', $stage)
                ->where(fn ($query) => $query
                    ->where('title', 'like', $like)
                    ->orWhere('body', 'like', $like)
                )
                ->limit(5)
                ->get(['id', 'title', 'slug', 'body'])
                ->map(fn ($p) => [
                    'id'      => $p->id,
                    'title'   => $p->title,
                    'excerpt' => $this->excerpt($p->body, $q),
                    'url'     => "/content/{$p->slug}",
                    'badge'   => 'Content',
                ])
                ->values()
                ->all();

            if (! empty($contentPages)) {
                $results[] = ['type' => 'Content', 'items' => $contentPages];
            }

            // ── FAQs ─────────────────────────────────────────────────────────────
            $faqs = FaqEntry::published()
                ->where(fn ($query) => $query
                    ->where('question', 'like', $like)
                    ->orWhere('answer', 'like', $like)
                )
                ->limit(5)
                ->get(['id', 'question', 'answer', 'category'])
                ->map(fn ($f) => [
                    'id'      => $f->id,
                    'title'   => $f->question,
                    'excerpt' => $this->excerpt($f->answer, $q),
                    'url'     => '/faqs',
                    'badge'   => $f->category,
                ])
                ->values()
                ->all();

            if (! empty($faqs)) {
                $results[] = ['type' => 'FAQs', 'items' => $faqs];
            }

            // ── Newsletters ──────────────────────────────────────────────────────
            $newsletters = Newsletter::where('status', 'published')
                ->where(fn ($query) => $query
                    ->where('title', 'like', $like)
                    ->orWhere('body', 'like', $like)
                )
                ->limit(5)
                ->get(['id', 'title', 'body'])
                ->map(fn ($n) => [
                    'id'      => $n->id,
                    'title'   => $n->title,
                    'excerpt' => $this->excerpt($n->body, $q),
                    'url'     => "/newsletters/{$n->id}",
                    'badge'   => 'Newsletter',
                ])
                ->values()
                ->all();

            if (! empty($newsletters)) {
                $results[] = ['type' => 'Newsletters', 'items' => $newsletters];
            }

            // ── Bulletins ────────────────────────────────────────────────────────
            $bulletins = Bulletin::active()
                ->where(fn ($query) => $query
                    ->where('title', 'like', $like)
                    ->orWhere('body', 'like', $like)
                )
                ->limit(5)
                ->get(['id', 'title', 'body'])
                ->map(fn ($b) => [
                    'id'      => $b->id,
                    'title'   => $b->title,
                    'excerpt' => $this->excerpt($b->body, $q),
                    'url'     => '/bulletins',
                    'badge'   => 'Bulletin',
                ])
                ->values()
                ->all();

            if (! empty($bulletins)) {
                $results[] = ['type' => 'Bulletins', 'items' => $bulletins];
            }

            // ── Courses ──────────────────────────────────────────────────────────
            $courses = Course::where('is_published', true)
                ->whereJsonContains('stage_visibility', $stage)
                ->where(fn ($query) => $query
                    ->where('title', 'like', $like)
                    ->orWhere('description', 'like', $like)
                )
                ->limit(5)
                ->get(['id', 'title', 'description'])
                ->map(fn ($c) => [
                    'id'      => $c->id,
                    'title'   => $c->title,
                    'excerpt' => $this->excerpt($c->description ?? '', $q),
                    'url'     => "/learning/{$c->id}",
                    'badge'   => 'Course',
                ])
                ->values()
                ->all();

            if (! empty($courses)) {
                $results[] = ['type' => 'Courses', 'items' => $courses];
            }

            // ── Tasks (own only) ─────────────────────────────────────────────────
            if ($user) {
                $tasks = Task::where('assigned_to_user_id', $user->id)
                    ->where(fn ($query) => $query
                        ->where('title', 'like', $like)
                        ->orWhere('description', 'like', $like)
                    )
                    ->limit(5)
                    ->get(['id', 'title', 'description', 'status'])
                    ->map(fn ($t) => [
                        'id'      => $t->id,
                        'title'   => $t->title,
                        'excerpt' => $this->excerpt($t->description ?? '', $q),
                        'url'     => '/tasks',
                        'badge'   => ucfirst(str_replace('_', ' ', $t->status)),
                    ])
                    ->values()
                    ->all();

                if (! empty($tasks)) {
                    $results[] = ['type' => 'Tasks', 'items' => $tasks];
                }
            }
        }

        $totalCount = collect($results)->sum(fn ($group) => count($group['items']));

        return Inertia::render('SearchResultsPage', [
            'query'      => $q,
            'results'    => $results,
            'totalCount' => $totalCount,
        ]);
    }

    private function excerpt(string $text, string $q, int $length = 120): string
    {
        // Strip HTML tags
        $plain = strip_tags($text);

        if (mb_strlen($plain) === 0) {
            return '';
        }

        // Try to center around the match
        $pos = mb_stripos($plain, $q);

        if ($pos !== false) {
            $start = max(0, $pos - 40);
            $snippet = mb_substr($plain, $start, $length);

            if ($start > 0) {
                $snippet = '…' . $snippet;
            }

            if (mb_strlen($plain) > $start + $length) {
                $snippet .= '…';
            }

            return $snippet;
        }

        return mb_strlen($plain) > $length
            ? mb_substr($plain, 0, $length) . '…'
            : $plain;
    }
}
