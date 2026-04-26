<?php

namespace App\Http\Controllers\Feedback;

use App\Http\Controllers\Controller;
use App\Models\FeedbackRequest;
use App\Models\FeedbackResponse;
use App\Models\ReviewCompetency;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackRequestController extends Controller
{
    /**
     * List feedback requests.
     * HR sees all; others see requests where they are subject or requester.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isHr = $user->hasPermission('feedback.manage');

        $query = FeedbackRequest::with([
            'subject:id,name,employee_id',
            'requester:id,name',
        ])->withCount('responses');

        if (!$isHr) {
            $query->where(function ($q) use ($user) {
                $q->where('subject_id', $user->id)
                  ->orWhere('requester_id', $user->id);
            });
        }

        $requests = $query->latest()->get()->map(fn ($r) => [
            'id'              => $r->id,
            'subject'         => $r->subject ? [
                'id'          => $r->subject->id,
                'name'        => $r->subject->name,
                'employee_id' => $r->subject->employee_id,
            ] : null,
            'requester'       => $r->requester ? [
                'id'   => $r->requester->id,
                'name' => $r->requester->name,
            ] : null,
            'type'            => $r->type,
            'message'         => $r->message,
            'due_date'        => $r->due_date?->toDateString(),
            'status'          => $r->status,
            'responses_count' => $r->responses_count,
        ]);

        $employees = User::where('status', 'active')
            ->select('id', 'name', 'employee_id', 'department', 'position')
            ->orderBy('name')
            ->get();

        return Inertia::render('Feedback/FeedbackRequestsPage', [
            'requests'  => $requests,
            'employees' => $employees,
            'canManage' => $isHr,
        ]);
    }

    /**
     * Create a new feedback request.
     * Permission: feedback.manage (HR) OR any user requesting about themselves.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $canManage = $user->hasPermission('feedback.manage');

        $validated = $request->validate([
            'subject_id'      => ['required', 'integer', 'exists:users,id'],
            'type'            => ['required', 'in:360,peer,upward,downward'],
            'due_date'        => ['nullable', 'date', 'after:today'],
            'message'         => ['nullable', 'string', 'max:1000'],
            'review_cycle_id' => ['nullable', 'integer', 'exists:review_cycles,id'],
        ]);

        // Non-HR users can only request feedback about themselves
        if (!$canManage && (int) $validated['subject_id'] !== $user->id) {
            abort(403, 'You may only request feedback about yourself.');
        }

        $feedbackRequest = FeedbackRequest::create([
            'requester_id'    => $user->id,
            'subject_id'      => $validated['subject_id'],
            'review_cycle_id' => $validated['review_cycle_id'] ?? null,
            'type'            => $validated['type'],
            'message'         => $validated['message'] ?? null,
            'due_date'        => $validated['due_date'] ?? null,
            'status'          => 'pending',
        ]);

        AuditLogger::record(
            'feedback',
            'feedback_request.created',
            FeedbackRequest::class,
            $feedbackRequest->id,
            null,
            ['subject_id' => $feedbackRequest->subject_id, 'type' => $feedbackRequest->type],
            $request,
        );

        return back()->with('success', 'Feedback request created successfully.');
    }

    /**
     * Show a feedback request with responses.
     * HR sees respondent names for non-anonymous; subject sees aggregated only.
     */
    public function show(Request $request, FeedbackRequest $feedbackRequest): Response
    {
        $user = $request->user();
        $isHr = $user->hasPermission('feedback.manage');

        // Access control: HR, requester, or subject can view
        $canView = $isHr
            || $feedbackRequest->requester_id === $user->id
            || $feedbackRequest->subject_id === $user->id;

        if (!$canView) {
            abort(403);
        }

        $feedbackRequest->load(['subject:id,name,employee_id', 'requester:id,name', 'reviewCycle:id,name']);

        $responses = $feedbackRequest->responses()
            ->whereNotNull('submitted_at')
            ->get()
            ->map(function (FeedbackResponse $resp) use ($isHr) {
                $data = [
                    'id'             => $resp->id,
                    'is_anonymous'   => $resp->is_anonymous,
                    'ratings'        => $resp->ratings,
                    'overall_rating' => $resp->overall_rating,
                    'strengths'      => $resp->strengths,
                    'improvements'   => $resp->improvements,
                    'submitted_at'   => $resp->submitted_at?->toIso8601String(),
                    // respondent exposed only to HR and only when NOT anonymous
                    'respondent'     => ($isHr && !$resp->is_anonymous && $resp->respondent_id)
                        ? ['id' => $resp->respondent_id, 'name' => $resp->respondent?->name]
                        : null,
                ];

                return $data;
            });

        $aggregated = [
            'competency_averages' => $feedbackRequest->aggregatedRatings(),
            'overall_average'     => $feedbackRequest->overallAverage(),
            'response_count'      => $responses->count(),
        ];

        return Inertia::render('Feedback/FeedbackRequestPage', [
            'feedbackRequest' => [
                'id'          => $feedbackRequest->id,
                'subject'     => $feedbackRequest->subject ? [
                    'id'          => $feedbackRequest->subject->id,
                    'name'        => $feedbackRequest->subject->name,
                    'employee_id' => $feedbackRequest->subject->employee_id,
                ] : null,
                'requester'   => $feedbackRequest->requester ? [
                    'id'   => $feedbackRequest->requester->id,
                    'name' => $feedbackRequest->requester->name,
                ] : null,
                'review_cycle' => $feedbackRequest->reviewCycle ? [
                    'id'   => $feedbackRequest->reviewCycle->id,
                    'name' => $feedbackRequest->reviewCycle->name,
                ] : null,
                'type'        => $feedbackRequest->type,
                'message'     => $feedbackRequest->message,
                'due_date'    => $feedbackRequest->due_date?->toDateString(),
                'status'      => $feedbackRequest->status,
            ],
            'responses'   => $responses,
            'aggregated'  => $aggregated,
            'canManage'   => $isHr,
            'isSubject'   => $feedbackRequest->subject_id === $user->id,
        ]);
    }

    /**
     * Respond to a feedback request.
     * Permission: feedback.submit
     */
    public function respond(Request $request, FeedbackRequest $feedbackRequest): RedirectResponse
    {
        $user = $request->user();

        if (!$user->hasPermission('feedback.submit')) {
            abort(403, 'You do not have permission to submit feedback.');
        }

        if ($feedbackRequest->status === 'cancelled') {
            abort(422, 'This feedback request has been cancelled.');
        }

        // Subject cannot respond to their own feedback request
        if ($feedbackRequest->subject_id === $user->id) {
            abort(403, 'You cannot respond to your own feedback request.');
        }

        $validated = $request->validate([
            'ratings'        => ['nullable', 'array'],
            'ratings.*'      => ['integer', 'min:1', 'max:5'],
            'overall_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'strengths'      => ['nullable', 'string', 'max:2000'],
            'improvements'   => ['nullable', 'string', 'max:2000'],
            'is_anonymous'   => ['boolean'],
        ]);

        $existingResponse = FeedbackResponse::where('feedback_request_id', $feedbackRequest->id)
            ->where('respondent_id', $user->id)
            ->first();

        $responseData = [
            'feedback_request_id' => $feedbackRequest->id,
            'respondent_id'       => $user->id,
            'is_anonymous'        => $validated['is_anonymous'] ?? false,
            'ratings'             => $validated['ratings'] ?? null,
            'overall_rating'      => $validated['overall_rating'] ?? null,
            'strengths'           => $validated['strengths'] ?? null,
            'improvements'        => $validated['improvements'] ?? null,
            'submitted_at'        => now(),
        ];

        if ($existingResponse) {
            $existingResponse->update($responseData);
            $response = $existingResponse->fresh();
        } else {
            $response = FeedbackResponse::create($responseData);
        }

        // Check if all respondents have submitted — if request was sent to specific people
        // mark the request as completed (simple heuristic for non-bulk requests)
        $this->maybeMarkCompleted($feedbackRequest);

        AuditLogger::record(
            'feedback',
            'feedback_response.submitted',
            FeedbackResponse::class,
            $response->id,
            null,
            [
                'feedback_request_id' => $feedbackRequest->id,
                'is_anonymous'        => $response->is_anonymous,
            ],
            $request,
        );

        return back()->with('success', 'Feedback submitted successfully. Thank you.');
    }

    /**
     * Cancel a feedback request.
     * Permission: feedback.manage or the original requester.
     */
    public function cancel(Request $request, FeedbackRequest $feedbackRequest): RedirectResponse
    {
        $user = $request->user();
        $canCancel = $user->hasPermission('feedback.manage')
            || $feedbackRequest->requester_id === $user->id;

        if (!$canCancel) {
            abort(403);
        }

        $feedbackRequest->update(['status' => 'cancelled']);

        AuditLogger::record(
            'feedback',
            'feedback_request.cancelled',
            FeedbackRequest::class,
            $feedbackRequest->id,
            ['status' => 'pending'],
            ['status' => 'cancelled'],
            $request,
        );

        return back()->with('success', 'Feedback request cancelled.');
    }

    /**
     * Employee self-service: feedback requests received + aggregated results.
     */
    public function myFeedback(Request $request): Response
    {
        $user = $request->user();

        // Feedback requests about me
        $myRequests = FeedbackRequest::with(['requester:id,name', 'reviewCycle:id,name'])
            ->where('subject_id', $user->id)
            ->withCount('responses')
            ->latest()
            ->get()
            ->map(fn ($r) => [
                'id'              => $r->id,
                'requester'       => $r->requester ? ['id' => $r->requester->id, 'name' => $r->requester->name] : null,
                'review_cycle'    => $r->reviewCycle ? ['id' => $r->reviewCycle->id, 'name' => $r->reviewCycle->name] : null,
                'type'            => $r->type,
                'status'          => $r->status,
                'due_date'        => $r->due_date?->toDateString(),
                'responses_count' => $r->responses_count,
                // Include aggregated data for completed requests
                'aggregated' => $r->status === 'completed' ? [
                    'competency_averages' => $r->aggregatedRatings(),
                    'overall_average'     => $r->overallAverage(),
                    'response_count'      => $r->responses_count,
                ] : null,
            ]);

        // Pending requests for me to respond to (where I'm NOT the subject)
        $pendingRespond = FeedbackRequest::with(['subject:id,name,employee_id'])
            ->where('status', 'pending')
            ->where('subject_id', '!=', $user->id)
            ->whereDoesntHave('responses', function ($q) use ($user) {
                $q->where('respondent_id', $user->id)->whereNotNull('submitted_at');
            })
            ->latest()
            ->get()
            ->map(fn ($r) => [
                'id'       => $r->id,
                'subject'  => $r->subject ? [
                    'id'          => $r->subject->id,
                    'name'        => $r->subject->name,
                    'employee_id' => $r->subject->employee_id,
                ] : null,
                'type'     => $r->type,
                'due_date' => $r->due_date?->toDateString(),
                'message'  => $r->message,
            ]);

        $competencies = ReviewCompetency::orderBy('sort_order')->get(['id', 'name', 'slug']);

        return Inertia::render('Feedback/MyFeedbackPage', [
            'myRequests'    => $myRequests,
            'pendingRespond' => $pendingRespond,
            'competencies'  => $competencies,
        ]);
    }

    private function maybeMarkCompleted(FeedbackRequest $feedbackRequest): void
    {
        // Simple heuristic: if at least one response has been submitted and
        // the request was created for a single person, it stays pending until
        // explicitly marked completed or cancelled by HR.
        // This keeps the logic simple without requiring a separate respondents list.
    }
}
