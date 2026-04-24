<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\LeaveRequest;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasPermission('team.dashboard')) {
            abort(403);
        }

        $department = $user->department;

        $teamMembers = User::where('department', $department)
            ->where('id', '!=', $user->id)
            ->where('status', 'active')
            ->get();

        $now = now();
        $monthStart = $now->copy()->startOfMonth()->toDateString();
        $monthEnd   = $now->copy()->endOfMonth()->toDateString();
        $weekStart  = $now->copy()->startOfWeek();
        $weekEnd    = $now->copy()->endOfWeek();
        $yearStart  = $now->copy()->startOfYear()->toDateString();

        $memberStats = $teamMembers->map(function (User $member) use ($monthStart, $monthEnd, $yearStart): array {
            $attendanceRecords = AttendanceRecord::where('user_id', $member->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->get();

            $present  = $attendanceRecords->whereIn('status', ['present', 'late'])->count();
            $late     = $attendanceRecords->where('status', 'late')->count();
            $absent   = $attendanceRecords->where('status', 'absent')->count();
            $workdays = $present + $absent;

            $attendancePct = $workdays > 0 ? (int) round($present / $workdays * 100) : 0;

            $activeTasks    = Task::where('assigned_to_user_id', $member->id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->count();
            $completedTasks = Task::where('assigned_to_user_id', $member->id)
                ->where('status', 'completed')
                ->count();

            $leaveDays = (int) LeaveRequest::where('user_id', $member->id)
                ->where('status', 'approved')
                ->where('start_date', '>=', $yearStart)
                ->sum('days');

            return [
                'id'             => $member->id,
                'name'           => $member->name,
                'position'       => $member->position ?? 'Staff',
                'initials'       => $this->initials($member->name),
                'attendance_pct' => $attendancePct,
                'present'        => $present,
                'late'           => $late,
                'absent'         => $absent,
                'active_tasks'   => $activeTasks,
                'completed_tasks'=> $completedTasks,
                'leave_days_used'=> $leaveDays,
            ];
        })->values()->all();

        $teamSize      = count($memberStats);
        $avgAttendance = $teamSize > 0
            ? (int) round(collect($memberStats)->avg('attendance_pct'))
            : 0;

        $teamIds = $teamMembers->pluck('id')->toArray();

        $tasksCompletedThisWeek = ! empty($teamIds)
            ? Task::whereIn('assigned_to_user_id', $teamIds)
                ->where('status', 'completed')
                ->whereBetween('updated_at', [$weekStart, $weekEnd])
                ->count()
            : 0;

        $pendingLeaveRequests = ! empty($teamIds)
            ? LeaveRequest::whereIn('user_id', $teamIds)
                ->where('status', 'pending')
                ->count()
            : 0;

        $chartData = collect($memberStats)->map(fn (array $m): array => [
            'name'       => explode(' ', $m['name'])[0],
            'attendance' => $m['attendance_pct'],
            'tasks'      => $m['completed_tasks'],
        ])->all();

        return Inertia::render('TeamDashboardPage', [
            'department'             => $department ?? 'All',
            'teamSize'               => $teamSize,
            'avgAttendance'          => $avgAttendance,
            'tasksCompletedThisWeek' => $tasksCompletedThisWeek,
            'pendingLeaveRequests'   => $pendingLeaveRequests,
            'members'                => $memberStats,
            'chartData'              => $chartData,
        ]);
    }

    private function initials(string $name): string
    {
        $words = explode(' ', trim($name));

        return strtoupper(
            substr($words[0] ?? '', 0, 1).
            (isset($words[1]) ? substr($words[1], 0, 1) : '')
        );
    }
}
