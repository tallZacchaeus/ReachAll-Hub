<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function dashboard(Request $request)
    {
        $role = $request->user()?->role ?? 'staff';
        
        if (in_array($role, ['superadmin', 'hr', 'management'])) {
            return Inertia::render('AdminDashboardPage');
        }
        
        return Inertia::render('DashboardPage');
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
