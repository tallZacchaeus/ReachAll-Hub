<?php

namespace App\Http\Controllers;

use App\Models\Bulletin;
use App\Models\ContentPage;
use App\Models\CourseEnrollment;
use App\Models\Objective;
use App\Models\PolicyAcknowledgement;
use App\Models\Recognition;
use App\Models\ResourceRequest;
use App\Models\Task;
use App\Models\User;
use App\Models\UserChecklist;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $role = $user?->role ?? 'staff';
        $employeeStage = $user?->employee_stage ?? 'performer';
        $daysHere = $user?->created_at ? (int) $user->created_at->diffInDays(now()) : 0;

        $bulletins = Bulletin::with('author:id,name')
            ->active()
            ->ordered()
            ->limit(3)
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'title' => $b->title,
                'body' => $b->body,
                'priority' => $b->priority,
                'is_pinned' => $b->is_pinned,
                'expires_at' => $b->expires_at?->toDateString(),
                'author' => $b->author?->name ?? 'Unknown',
                'published_at' => $b->published_at?->toDateString(),
            ])
            ->values()
            ->all();

        $acknowledgedIds = $user
            ? PolicyAcknowledgement::where('user_id', $user->id)->pluck('content_page_id')
            : collect();

        $pendingAckCount = $user
            ? ContentPage::where('is_published', true)
                ->where('requires_acknowledgement', true)
                ->whereJsonContains('stage_visibility', $employeeStage)
                ->whereNotIn('id', $acknowledgedIds)
                ->count()
            : 0;

        // Recognition widget data (performer/leader dashboard)
        $recentRecognitions = [];
        $receivedThisMonth = 0;
        if ($user) {
            $recentRecognitions = Recognition::with('sender:id,name')
                ->where('to_user_id', $user->id)
                ->where('is_public', true)
                ->latest()
                ->limit(3)
                ->get()
                ->map(fn ($r) => [
                    'id'         => $r->id,
                    'badge_type' => $r->badge_type,
                    'message'    => $r->message,
                    'created_at' => $r->created_at->diffForHumans(),
                    'sender_name'     => $r->sender?->name ?? 'Someone',
                    'sender_initials' => $r->sender
                        ? strtoupper(
                            collect(explode(' ', trim($r->sender->name)))
                                ->filter()
                                ->map(fn ($p) => $p[0])
                                ->implode('')
                        )
                        : '?',
                ])
                ->values()
                ->all();

            $receivedThisMonth = Recognition::where('to_user_id', $user->id)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
        }

        $sharedData = [
            'employeeStage'      => $employeeStage,
            'userName'           => $user?->name ?? '',
            'daysHere'           => $daysHere,
            'bulletins'          => $bulletins,
            'pendingAckCount'    => $pendingAckCount,
            'recentRecognitions' => $recentRecognitions,
            'receivedThisMonth'  => $receivedThisMonth,
        ];

        // ── Stage-specific data ─────────────────────────────────────────────────
        if ($user && $employeeStage === 'joiner') {
            // Checklist progress
            $userChecklists = UserChecklist::where('user_id', $user->id)
                ->with(['template.items', 'progressRecords'])
                ->get();
            $totalItems     = 0;
            $completedItems = 0;
            foreach ($userChecklists as $uc) {
                $totalItems     += $uc->template?->items->count() ?? 0;
                $completedItems += $uc->progressRecords->whereNotNull('completed_at')->count();
            }

            // Mandatory courses remaining
            $mandatoryCoursesRemaining = CourseEnrollment::where('user_id', $user->id)
                ->whereHas('course', fn ($q) => $q->where('type', 'mandatory'))
                ->where('status', '!=', 'completed')
                ->count();

            $sharedData += [
                'checklistCompletePct'      => $totalItems > 0 ? (int) round($completedItems / $totalItems * 100) : 0,
                'checklistCompletedItems'   => $completedItems,
                'checklistTotalItems'       => $totalItems,
                'mandatoryCoursesRemaining' => $mandatoryCoursesRemaining,
            ];
        }

        if ($user && $employeeStage === 'performer') {
            // Learning progress
            $enrollments = CourseEnrollment::where('user_id', $user->id)
                ->with('course:id,title,type')
                ->get();

            $learningInProgress = $enrollments->where('status', 'in_progress')->count();
            $learningCompleted  = $enrollments->where('status', 'completed')->count();

            $enrolledCourses = $enrollments->take(4)->map(fn ($e) => [
                'title'    => $e->course?->title ?? 'Untitled',
                'type'     => ucfirst($e->course?->type ?? 'optional'),
                'progress' => $e->progress ?? 0,
            ])->values()->all();

            $sharedData += [
                'learningInProgress' => $learningInProgress,
                'learningCompleted'  => $learningCompleted,
                'enrolledCourses'    => $enrolledCourses,
            ];
        }

        if ($user && ($employeeStage === 'leader' || in_array($role, ['superadmin', 'hr', 'management'], true))) {
            // Team size (same department, excluding self)
            $teamSize = $user->department
                ? User::where('department', $user->department)
                    ->where('id', '!=', $user->id)
                    ->where('is_active', true)
                    ->count()
                : 0;

            // Pending approvals
            $pendingApprovals = ResourceRequest::where('status', 'pending')->count();

            // OKR health
            $activeOKRs = Objective::where('status', 'active')->whereNull('parent_id')->get(['id', 'title', 'progress']);
            $activeOKRsCount = $activeOKRs->count();
            $onTrackKRsCount = $activeOKRs->where('progress', '>=', 50)->count();

            $activeOKRList = $activeOKRs->take(3)->map(fn ($o) => [
                'title'    => $o->title,
                'progress' => $o->progress,
            ])->values()->all();

            $sharedData += [
                'teamSize'        => $teamSize,
                'pendingApprovals'=> $pendingApprovals,
                'activeOKRsCount' => $activeOKRsCount,
                'onTrackKRsCount' => $onTrackKRsCount,
                'activeOKRList'   => $activeOKRList,
            ];
        }

        if (in_array($role, ['superadmin', 'hr', 'management'])) {
            return Inertia::render('AdminDashboardPage', $sharedData);
        }

        return Inertia::render('DashboardPage', $sharedData);
    }

    public function onboarding(Request $request)
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['superadmin', 'hr', 'management']);

        if (! $isAdmin && $user->employee_stage !== 'joiner') {
            abort(403, 'This page is for joiners only.');
        }

        // Checklist completion summary
        $userChecklists = UserChecklist::where('user_id', $user->id)
            ->with(['template.items', 'progressRecords'])
            ->get();

        $totalItems = 0;
        $completedItems = 0;
        foreach ($userChecklists as $uc) {
            $totalItems += $uc->template->items->count();
            $completedItems += $uc->progressRecords->whereNotNull('completed_at')->count();
        }
        $checklistPercentage = $totalItems > 0 ? (int) round(($completedItems / $totalItems) * 100) : 0;

        // CEO welcome content page (optional)
        $ceoWelcome = ContentPage::where('slug', 'ceo-welcome')
            ->where('is_published', true)
            ->first();

        return Inertia::render('OnboardingHubPage', [
            'userName' => $user->name,
            'checklistPercentage' => $checklistPercentage,
            'completedItems' => $completedItems,
            'totalItems' => $totalItems,
            'ceoWelcomeBody' => $ceoWelcome?->body,
        ]);
    }

    public function evaluation()
    {
        return Inertia::render('EvaluationPage');
    }

    public function tasks()
    {
        return Inertia::render('TasksPage');
    }

    public function chat()
    {
        $user = auth()->user();
        
        return Inertia::render('ChatPage', [
            'userRole' => $user->role,
            'userDepartment' => $user->department ?? 'Tech',
        ]);
    }

    public function attendanceUpload()
    {
        return Inertia::render('AttendanceUploadPage');
    }

    public function results()
    {
        return Inertia::render('ResultsOverviewPage');
    }

    public function leaderboard()
    {
        return Inertia::render('LeaderboardPage');
    }

    public function profile()
    {
        $user = auth()->user();
        $pendingRequest = \App\Models\ProfileChangeRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        return Inertia::render('ProfilePage', [
            'user' => $user,
            'pendingRequest' => $pendingRequest,
        ]);
    }

    public function profileRequests()
    {
        $user = auth()->user();
        if (!in_array($user->role, ['superadmin', 'hr'])) {
            abort(403);
        }

        $requests = \App\Models\ProfileChangeRequest::with('user')
            ->where('status', 'pending')
            ->latest()
            ->get();

        return Inertia::render('Admin/ProfileRequests', [
            'requests' => $requests,
        ]);
    }

    public function leave()
    {
        return Inertia::render('LeaveManagementPage');
    }

    public function notifications()
    {
        return Inertia::render('NotificationsPage');
    }

    public function announcements()
    {
        return Inertia::render('AnnouncementsPage');
    }

    public function performanceReview()
    {
        return Inertia::render('PerformanceReviewPage');
    }

    public function peerReview()
    {
        return Inertia::render('PeerReviewPage');
    }

    public function reports()
    {
        return Inertia::render('ReportsPage');
    }

    public function departmentAnalytics()
    {
        return Inertia::render('DepartmentAnalyticsPage');
    }

    public function staffOverview()
    {
        return Inertia::render('StaffOverviewPage');
    }

    public function progressReport()
    {
        return Inertia::render('ProgressReportPage');
    }

    public function projects()
    {
        return Inertia::render('ProjectsPage');
    }

    public function requests()
    {
        return Inertia::render('RequestsPage');
    }

    public function attendance()
    {
        return Inertia::render('AttendancePage');
    }

    public function staffEnrollment()
    {
        return Inertia::render('StaffEnrollmentPage');
    }

    public function settings()
    {
        return Inertia::render('SettingsPage');
    }
}
