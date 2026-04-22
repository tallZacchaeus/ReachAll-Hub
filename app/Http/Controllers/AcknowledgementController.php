<?php

namespace App\Http\Controllers;

use App\Models\ContentPage;
use App\Models\PolicyAcknowledgement;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcknowledgementController extends Controller
{
    /**
     * List all policies that require acknowledgement and haven't been
     * acknowledged by the current user yet.
     */
    public function pending(Request $request): Response
    {
        $user = $request->user();
        $stage = $user->employee_stage ?? 'performer';

        $acknowledgedIds = PolicyAcknowledgement::where('user_id', $user->id)
            ->pluck('content_page_id')
            ->toArray();

        $pending = ContentPage::where('is_published', true)
            ->where('requires_acknowledgement', true)
            ->whereJsonContains('stage_visibility', $stage)
            ->whereNotIn('id', $acknowledgedIds)
            ->orderBy('acknowledgement_deadline')
            ->get(['id', 'title', 'slug', 'acknowledgement_deadline']);

        return Inertia::render('AcknowledgementsPendingPage', [
            'policies' => $pending->map(fn ($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'acknowledgement_deadline' => $p->acknowledgement_deadline?->toDateString(),
            ])->values(),
        ]);
    }

    /**
     * Record the authenticated user's acknowledgement of a policy.
     */
    public function acknowledge(Request $request, int $contentPageId): RedirectResponse
    {
        $user = $request->user();

        $page = ContentPage::where('id', $contentPageId)
            ->where('is_published', true)
            ->where('requires_acknowledgement', true)
            ->firstOrFail();

        // Idempotent — silently succeed if already acknowledged
        PolicyAcknowledgement::firstOrCreate(
            ['content_page_id' => $page->id, 'user_id' => $user->id],
            [
                'acknowledged_at' => now(),
                'ip_address' => $request->ip(),
            ],
        );

        return back()->with('success', 'Policy acknowledged successfully.');
    }

    /**
     * Admin report: per-policy breakdown of acknowledgement progress.
     */
    public function adminReport(Request $request): Response
    {
        $this->requireAdmin($request);

        $policies = ContentPage::where('requires_acknowledgement', true)
            ->where('is_published', true)
            ->with(['acknowledgements.user:id,name,department,employee_id'])
            ->orderBy('acknowledgement_deadline')
            ->get();

        $report = $policies->map(function (ContentPage $policy) {
            $stages = $policy->stage_visibility ?? ['joiner', 'performer', 'leader'];

            $targetUsers = User::where('status', 'active')
                ->whereIn('employee_stage', $stages)
                ->get(['id', 'name', 'department', 'employee_id', 'employee_stage']);

            $acknowledgedIds = $policy->acknowledgements->pluck('user_id')->flip();

            $acknowledgedCount = $targetUsers->filter(fn ($u) => $acknowledgedIds->has($u->id))->count();
            $totalCount = $targetUsers->count();

            $pendingUsers = $targetUsers
                ->filter(fn ($u) => ! $acknowledgedIds->has($u->id))
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'department' => $u->department ?? '—',
                    'employee_id' => $u->employee_id ?? '—',
                    'employee_stage' => $u->employee_stage,
                ])
                ->values();

            return [
                'id' => $policy->id,
                'title' => $policy->title,
                'slug' => $policy->slug,
                'acknowledgement_deadline' => $policy->acknowledgement_deadline?->toDateString(),
                'total' => $totalCount,
                'acknowledged' => $acknowledgedCount,
                'pending_count' => $totalCount - $acknowledgedCount,
                'percentage' => $totalCount > 0 ? round(($acknowledgedCount / $totalCount) * 100) : 0,
                'pending_users' => $pendingUsers,
            ];
        })->values();

        $totalPolicies = $report->count();
        $overallPercentage = $totalPolicies > 0
            ? (int) round($report->avg('percentage'))
            : 0;

        return Inertia::render('Admin/AcknowledgementReportPage', [
            'report' => $report,
            'summary' => [
                'total_policies' => $totalPolicies,
                'overall_percentage' => $overallPercentage,
            ],
        ]);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function requireAdmin(Request $request): void
    {
        $user = $request->user();
        if (! in_array($user->role, ['superadmin', 'hr', 'management'], true)) {
            abort(403, 'Unauthorized.');
        }
    }
}
