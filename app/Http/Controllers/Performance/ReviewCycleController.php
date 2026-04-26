<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\PerformanceReview;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReviewCycleController extends Controller
{
    private function authoriseManage(): void
    {
        abort_unless(Auth::user()?->hasPermission('reviews.manage'), 403);
    }

    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        if ($user->hasPermission('reviews.manage')) {
            $cycles = ReviewCycle::with('createdBy:id,name,employee_id')
                ->withCount('performanceReviews')
                ->orderByDesc('created_at')
                ->get();
        } else {
            // Staff/managers see active + closed cycles where they have reviews
            $myReviewCycleIds = PerformanceReview::where(function ($q) use ($user) {
                $q->where('reviewee_id', $user->id)
                    ->orWhere('reviewer_id', $user->id);
            })->pluck('review_cycle_id');

            $cycles = ReviewCycle::whereIn('status', ['active', 'closed'])
                ->orWhereIn('id', $myReviewCycleIds)
                ->with('createdBy:id,name,employee_id')
                ->withCount('performanceReviews')
                ->orderByDesc('created_at')
                ->get();
        }

        return Inertia::render('Performance/ReviewCyclesPage', [
            'cycles' => $cycles,
            'canManage' => $user->hasPermission('reviews.manage'),
        ]);
    }

    public function show(ReviewCycle $reviewCycle): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $canManage = $user->hasPermission('reviews.manage');

        // Load reviews filtered to user perspective
        $reviewsQuery = PerformanceReview::where('review_cycle_id', $reviewCycle->id)
            ->with([
                'reviewee:id,name,employee_id,department,position',
                'reviewer:id,name,employee_id',
            ]);

        if (! $canManage) {
            // Regular user sees only their own reviews; managers also see their direct reports
            $directReportIds = $user->directReports()->pluck('id')->toArray();
            $reviewsQuery->where(function ($q) use ($user, $directReportIds) {
                $q->where('reviewee_id', $user->id)
                    ->orWhere('reviewer_id', $user->id)
                    ->orWhereIn('reviewee_id', $directReportIds);
            });
        }

        $reviews = $reviewsQuery->orderBy('type')->orderBy('status')->get();

        // PIPs for this cycle (linked via performance_review_id)
        $reviewIds = $reviews->pluck('id');
        $pipsQuery = \App\Models\PipPlan::whereIn('performance_review_id', $reviewIds)
            ->orWhereIn('user_id', $reviews->pluck('reviewee_id'))
            ->with(['user:id,name,employee_id', 'initiatedBy:id,name']);

        if (! $canManage) {
            $directReportIds = $user->directReports()->pluck('id')->toArray();
            $pipsQuery->where(function ($q) use ($user, $directReportIds) {
                $q->where('user_id', $user->id)
                    ->orWhereIn('user_id', $directReportIds);
            });
        }

        $pips = $pipsQuery->get();

        return Inertia::render('Performance/ReviewCyclePage', [
            'cycle' => $reviewCycle,
            'reviews' => $reviews,
            'pips' => $pips,
            'canManage' => $canManage,
            'authId' => $user->id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authoriseManage();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'type' => ['required', 'in:annual,quarterly,mid_year,probation'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after:period_start'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        /** @var User $user */
        $user = Auth::user();

        $cycle = ReviewCycle::create(array_merge($validated, [
            'created_by_id' => $user->id,
        ]));

        AuditLogger::record(
            'performance',
            'review_cycle.created',
            ReviewCycle::class,
            $cycle->id,
            null,
            $cycle->toArray(),
            $request,
        );

        return redirect()->route('performance.cycles.show', $cycle)
            ->with('success', 'Review cycle created.');
    }

    public function activate(ReviewCycle $reviewCycle, Request $request): RedirectResponse
    {
        $this->authoriseManage();

        abort_unless($reviewCycle->status === 'draft', 422, 'Only draft cycles can be activated.');

        $old = $reviewCycle->toArray();

        $reviewCycle->update(['status' => 'active']);

        // Generate performance_reviews records
        $this->generateReviewRecords($reviewCycle);

        AuditLogger::record(
            'performance',
            'review_cycle.activated',
            ReviewCycle::class,
            $reviewCycle->id,
            $old,
            $reviewCycle->fresh()->toArray(),
            $request,
        );

        return back()->with('success', 'Review cycle activated and reviews generated.');
    }

    public function close(ReviewCycle $reviewCycle, Request $request): RedirectResponse
    {
        $this->authoriseManage();

        abort_unless($reviewCycle->status === 'active', 422, 'Only active cycles can be closed.');

        $old = $reviewCycle->toArray();

        $reviewCycle->update(['status' => 'closed']);

        AuditLogger::record(
            'performance',
            'review_cycle.closed',
            ReviewCycle::class,
            $reviewCycle->id,
            $old,
            $reviewCycle->fresh()->toArray(),
            $request,
        );

        return back()->with('success', 'Review cycle closed.');
    }

    public function destroy(ReviewCycle $reviewCycle): RedirectResponse
    {
        $this->authoriseManage();

        abort_unless($reviewCycle->status === 'draft', 422, 'Only draft cycles can be deleted.');

        $reviewCycle->delete();

        return redirect()->route('performance.cycles.index')
            ->with('success', 'Review cycle deleted.');
    }

    /**
     * Generate self-review records for every active employee, and
     * manager-review records for employees who have a reports_to_id set.
     */
    private function generateReviewRecords(ReviewCycle $cycle): void
    {
        $employees = User::where('status', 'active')->get(['id', 'reports_to_id']);

        foreach ($employees as $employee) {
            // Self review
            PerformanceReview::firstOrCreate([
                'review_cycle_id' => $cycle->id,
                'reviewee_id' => $employee->id,
                'reviewer_id' => null,
                'type' => 'self',
            ], [
                'status' => 'pending',
            ]);

            // Manager review if manager is set
            if ($employee->reports_to_id) {
                PerformanceReview::firstOrCreate([
                    'review_cycle_id' => $cycle->id,
                    'reviewee_id' => $employee->id,
                    'reviewer_id' => $employee->reports_to_id,
                    'type' => 'manager',
                ], [
                    'status' => 'pending',
                ]);
            }
        }
    }
}
