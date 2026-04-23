<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    private const BALANCES = [
        'annual' => 20,
        'sick' => 10,
        'personal' => 5,
    ];

    public function index(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $this->isAdmin($user);

        $query = LeaveRequest::query()
            ->with(['user:id,employee_id,name', 'reviewer:id,name'])
            ->latest('created_at');

        if (! $isAdmin) {
            $query->where('user_id', $user->id);
        }

        $history = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('status', '!=', 'pending')
            ->latest('start_date')
            ->get();

        return Inertia::render('LeaveManagementPage', [
            'userRole' => $user->role,
            'currentUserName' => $user->name,
            'currentUserEmployeeId' => $user->employee_id,
            'leaveBalance' => $this->buildLeaveBalance($user),
            'requests' => $query->get()->map(fn (LeaveRequest $leaveRequest) => $this->transformLeaveRequest($leaveRequest))->all(),
            'leaveHistory' => $history->map(fn (LeaveRequest $leaveRequest) => $this->transformLeaveHistory($leaveRequest))->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['annual', 'sick', 'personal'])],
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date', 'after_or_equal:startDate'],
            'reason' => ['required', 'string'],
        ]);

        $startDate = Carbon::parse($validated['startDate']);
        $endDate = Carbon::parse($validated['endDate']);
        $days = $startDate->diffInDays($endDate) + 1;
        $balance = $this->buildLeaveBalance($request->user());
        $remaining = $balance[$validated['type']]['remaining'] ?? 0;

        if ($days > $remaining) {
            return back()->withErrors([
                'endDate' => 'This request exceeds your remaining leave balance.',
            ]);
        }

        LeaveRequest::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'days' => $days,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return back()->with('success', 'Leave request submitted successfully!');
    }

    public function updateStatus(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        if (! $this->isAdmin($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'hrComment' => ['nullable', 'string', 'max:5000'],
        ]);

        $leaveRequest->update([
            'status' => $validated['status'],
            'hr_comment' => $validated['hrComment'] ?: ucfirst($validated['status']) . ' by HR.',
            'reviewed_by_user_id' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Leave request updated successfully!');
    }

    /**
     * @return array<string, array<string, int>>
     */
    private function buildLeaveBalance(User $user): array
    {
        $year = now()->year;
        $usedByType = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereYear('start_date', $year)
            ->get()
            ->groupBy('type')
            ->map(fn ($requests) => (int) $requests->sum('days'));

        return collect(self::BALANCES)
            ->mapWithKeys(function (int $total, string $type) use ($usedByType): array {
                $used = (int) ($usedByType[$type] ?? 0);

                return [
                    $type => [
                        'total' => $total,
                        'used' => $used,
                        'remaining' => max($total - $used, 0),
                    ],
                ];
            })
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function transformLeaveRequest(LeaveRequest $leaveRequest): array
    {
        return [
            'id' => (string) $leaveRequest->id,
            'staffId' => $leaveRequest->user?->employee_id ?? '',
            'staffName' => $leaveRequest->user?->name ?? 'Unknown',
            'type' => $this->leaveTypeLabel($leaveRequest->type),
            'typeKey' => $leaveRequest->type,
            'startDate' => $leaveRequest->start_date?->format('M d, Y') ?? '',
            'endDate' => $leaveRequest->end_date?->format('M d, Y') ?? '',
            'days' => $leaveRequest->days,
            'reason' => $leaveRequest->reason,
            'status' => $leaveRequest->status,
            'hrComment' => $leaveRequest->hr_comment,
            'approverName' => $leaveRequest->reviewer?->name,
            'submittedDate' => $leaveRequest->created_at?->format('M d, Y'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformLeaveHistory(LeaveRequest $leaveRequest): array
    {
        return [
            'id' => (string) $leaveRequest->id,
            'period' => $leaveRequest->start_date?->format('M Y') ?? '',
            'type' => $this->leaveTypeLabel($leaveRequest->type),
            'startDate' => $leaveRequest->start_date?->format('M d, Y') ?? '',
            'endDate' => $leaveRequest->end_date?->format('M d, Y') ?? '',
            'days' => $leaveRequest->days,
            'status' => ucfirst($leaveRequest->status),
            'reason' => $leaveRequest->reason,
            'approverName' => $leaveRequest->reviewer?->name,
            'hrComment' => $leaveRequest->hr_comment,
        ];
    }

    private function leaveTypeLabel(string $type): string
    {
        return match ($type) {
            'annual' => 'Annual Leave',
            'sick' => 'Sick Leave',
            default => 'Personal Leave',
        };
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasPermission('leave.review');
    }
}
