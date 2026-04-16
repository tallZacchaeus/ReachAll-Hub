<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\User;
use App\Services\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LearningController extends Controller
{
    // ─── Staff ───────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();
        $stage = $user->employee_stage ?? 'performer';
        $isAdmin = $this->isAdmin($user);

        $query = Course::where('is_published', true);

        if (! $isAdmin) {
            $query->whereJsonContains('stage_visibility', $stage);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%'.$request->search.'%')
                    ->orWhere('category', 'like', '%'.$request->search.'%');
            });
        }

        $courses = $query->orderBy('type')->orderBy('title')
            ->paginate(12)
            ->withQueryString();

        // Fetch the user's enrollments for these course IDs
        $courseIds = $courses->pluck('id')->toArray();
        $enrollments = CourseEnrollment::where('user_id', $user->id)
            ->whereIn('course_id', $courseIds)
            ->get()
            ->keyBy('course_id');

        return Inertia::render('LearningHubPage', [
            'courses' => $courses->through(fn ($c) => $this->transformCard($c, $enrollments->get($c->id))),
            'filters' => [
                'type' => $request->type ?? 'all',
                'search' => $request->search ?? '',
            ],
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $user = $request->user();
        $stage = $user->employee_stage ?? 'performer';
        $isAdmin = $this->isAdmin($user);

        $course = Course::findOrFail($id);

        if (! $course->is_published && ! $isAdmin) {
            abort(404);
        }

        if (! $isAdmin && ! in_array($stage, $course->stage_visibility ?? [], true)) {
            abort(404);
        }

        $enrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        return Inertia::render('CourseViewPage', [
            'course' => $this->transformFull($course),
            'enrollment' => $enrollment ? $this->transformEnrollment($enrollment) : null,
        ]);
    }

    public function enroll(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $course = Course::where('id', $id)->where('is_published', true)->firstOrFail();

        CourseEnrollment::firstOrCreate(
            ['user_id' => $user->id, 'course_id' => $course->id],
            ['status' => 'in_progress', 'started_at' => now(), 'progress' => 0],
        );

        return back()->with('success', 'Enrolled in '.$course->title.'.');
    }

    public function updateProgress(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
            'score' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $enrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $id)
            ->firstOrFail();

        $updates = ['progress' => $validated['progress']];

        if ($validated['progress'] >= 100) {
            $updates['status'] = 'completed';
            $updates['completed_at'] = now();
            $updates['progress'] = 100;
        } elseif ($enrollment->status === 'assigned') {
            $updates['status'] = 'in_progress';
            $updates['started_at'] = $enrollment->started_at ?? now();
        }

        if (isset($validated['score'])) {
            $updates['score'] = $validated['score'];
        }

        $enrollment->update($updates);

        $message = $validated['progress'] >= 100
            ? 'Course completed! Well done.'
            : 'Progress updated.';

        return back()->with('success', $message);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    public function adminIndex(Request $request): Response
    {
        $this->requireAdmin($request);

        $courses = Course::withCount('enrollments')
            ->orderBy('type')
            ->orderBy('title')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/CourseEditorPage', [
            'courses' => $courses->through(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'type' => $c->type,
                'category' => $c->category,
                'is_published' => $c->is_published,
                'duration_minutes' => $c->duration_minutes,
                'stage_visibility' => $c->stage_visibility ?? ['joiner', 'performer', 'leader'],
                'enrollment_count' => $c->enrollments_count,
            ]),
            'course' => null,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);

        return Inertia::render('Admin/CourseEditorPage', [
            'courses' => [],
            'course' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $validated = $this->validateCourse($request);
        $validated['description'] = HtmlSanitizer::clean($validated['description'] ?? '');
        $validated['content']     = HtmlSanitizer::clean($validated['content'] ?? '');

        Course::create($validated);

        return redirect()
            ->route('admin.courses.index')
            ->with('success', 'Course created.');
    }

    public function edit(Request $request, int $id): Response
    {
        $this->requireAdmin($request);

        $course = Course::findOrFail($id);

        $courses = Course::withCount('enrollments')
            ->orderBy('type')->orderBy('title')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/CourseEditorPage', [
            'courses' => $courses->through(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'type' => $c->type,
                'category' => $c->category,
                'is_published' => $c->is_published,
                'duration_minutes' => $c->duration_minutes,
                'stage_visibility' => $c->stage_visibility ?? ['joiner', 'performer', 'leader'],
                'enrollment_count' => $c->enrollments_count,
            ]),
            'course' => $this->transformFull($course),
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        $course = Course::findOrFail($id);
        $validated = $this->validateCourse($request);
        $validated['description'] = HtmlSanitizer::clean($validated['description'] ?? '');
        $validated['content']     = HtmlSanitizer::clean($validated['content'] ?? '');
        $course->update($validated);

        return back()->with('success', 'Course updated.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->requireAdmin($request);

        Course::findOrFail($id)->delete();

        return back()->with('success', 'Course deleted.');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function validateCourse(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'type' => ['required', 'in:mandatory,optional,certification'],
            'stage_visibility' => ['required', 'array', 'min:1'],
            'stage_visibility.*' => ['in:joiner,performer,leader'],
            'category' => ['required', 'string', 'max:100'],
            'content' => ['required', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
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

    private function durationLabel(?int $minutes): string
    {
        if (! $minutes) {
            return 'Self-paced';
        }

        if ($minutes < 60) {
            return "~{$minutes} min";
        }

        $h = intdiv($minutes, 60);
        $m = $minutes % 60;

        return $m > 0 ? "~{$h}h {$m}m" : "~{$h}h";
    }

    /** @return array<string, mixed> */
    private function transformCard(Course $course, ?CourseEnrollment $enrollment): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'type' => $course->type,
            'category' => $course->category,
            'duration_label' => $this->durationLabel($course->duration_minutes),
            'stage_visibility' => $course->stage_visibility ?? ['joiner', 'performer', 'leader'],
            'enrollment' => $enrollment ? $this->transformEnrollment($enrollment) : null,
        ];
    }

    /** @return array<string, mixed> */
    private function transformFull(Course $course): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'type' => $course->type,
            'category' => $course->category,
            'content' => $course->content,
            'duration_minutes' => $course->duration_minutes,
            'duration_label' => $this->durationLabel($course->duration_minutes),
            'stage_visibility' => $course->stage_visibility ?? ['joiner', 'performer', 'leader'],
            'is_published' => $course->is_published,
        ];
    }

    /** @return array<string, mixed> */
    private function transformEnrollment(CourseEnrollment $e): array
    {
        return [
            'id' => $e->id,
            'status' => $e->status,
            'progress' => $e->progress,
            'score' => $e->score,
            'started_at' => $e->started_at?->toDateString(),
            'completed_at' => $e->completed_at?->toDateString(),
        ];
    }
}
