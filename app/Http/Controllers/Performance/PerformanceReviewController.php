<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\PerformanceReview;
use App\Models\ReviewCompetency;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceReviewController extends Controller
{
    public function show(PerformanceReview $performanceReview): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $canManage = $user->hasPermission('reviews.manage');

        $this->authoriseView($performanceReview, $user, $canManage);

        $performanceReview->load([
            'reviewCycle',
            'reviewee:id,name,employee_id,department,position',
            'reviewer:id,name,employee_id',
        ]);

        $competencies = ReviewCompetency::active()->get();

        return Inertia::render('Performance/PerformanceReviewFormPage', [
            'review' => $performanceReview,
            'competencies' => $competencies,
            'canEdit' => $performanceReview->canBeEditedBy($user),
            'canManage' => $canManage,
            'authId' => $user->id,
        ]);
    }

    public function update(Request $request, PerformanceReview $performanceReview): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        abort_unless($performanceReview->canBeEditedBy($user), 403);

        $competencySlugs = ReviewCompetency::active()->pluck('slug')->toArray();

        $ratingsRules = [];
        foreach ($competencySlugs as $slug) {
            $ratingsRules["ratings.{$slug}"] = ['nullable', 'integer', 'min:1', 'max:5'];
        }

        $validated = $request->validate(array_merge([
            'overall_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'strengths' => ['nullable', 'string', 'max:3000'],
            'improvements' => ['nullable', 'string', 'max:3000'],
            'comments' => ['nullable', 'string', 'max:3000'],
            'ratings' => ['nullable', 'array'],
        ], $ratingsRules));

        $old = $performanceReview->toArray();

        $performanceReview->update(array_merge($validated, [
            'status' => 'in_progress',
        ]));

        AuditLogger::record(
            'performance',
            'review.updated',
            PerformanceReview::class,
            $performanceReview->id,
            $old,
            $performanceReview->fresh()->toArray(),
            $request,
        );

        return back()->with('success', 'Review saved.');
    }

    public function submit(PerformanceReview $performanceReview, Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        abort_unless($performanceReview->canBeEditedBy($user), 403);
        abort_unless($user->hasPermission('reviews.submit'), 403);

        // Validate competency ratings are filled
        $competencySlugs = ReviewCompetency::active()->pluck('slug')->toArray();
        $ratings = $performanceReview->ratings ?? [];

        foreach ($competencySlugs as $slug) {
            if (empty($ratings[$slug])) {
                return back()->with('error', "Please rate all competencies before submitting. Missing: {$slug}.");
            }
        }

        abort_unless($performanceReview->overall_rating !== null, 422, 'Overall rating is required before submitting.');

        $old = $performanceReview->toArray();

        $performanceReview->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        AuditLogger::record(
            'performance',
            'review.submitted',
            PerformanceReview::class,
            $performanceReview->id,
            $old,
            $performanceReview->fresh()->toArray(),
            $request,
        );

        return back()->with('success', 'Review submitted successfully.');
    }

    public function acknowledge(PerformanceReview $performanceReview, Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        // Only the reviewee can acknowledge
        abort_unless($performanceReview->reviewee_id === $user->id, 403);
        abort_unless($performanceReview->status === 'submitted', 422, 'Review must be submitted before it can be acknowledged.');

        $old = $performanceReview->toArray();

        $performanceReview->update([
            'status' => 'acknowledged',
            'acknowledged_at' => now(),
        ]);

        AuditLogger::record(
            'performance',
            'review.acknowledged',
            PerformanceReview::class,
            $performanceReview->id,
            $old,
            $performanceReview->fresh()->toArray(),
            $request,
        );

        return back()->with('success', 'Review acknowledged.');
    }

    private function authoriseView(PerformanceReview $review, User $user, bool $canManage): void
    {
        if ($canManage) {
            return;
        }

        $directReportIds = $user->directReports()->pluck('id')->toArray();

        $allowed = $review->reviewee_id === $user->id
            || $review->reviewer_id === $user->id
            || in_array($review->reviewee_id, $directReportIds, true);

        abort_unless($allowed, 403);
    }
}
