<?php

namespace App\Http\Controllers;

use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\PublicHoliday;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\LeaveService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    // Legacy fallback balances for requests without a leave_type_id
    private const LEGACY_BALANCES = [
        'annual'   => 20,
        'sick'     => 10,
        'personal' => 5,
    ];

    // -----------------------------------------------------------------------
    // Index
    // -----------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $user    = $request->user();
        $isAdmin = $this->isAdmin($user);
        $year    = now()->year;

        // Active leave types
        $leaveTypes = LeaveType::where('is_active', true)->orderBy('name')->get();

        // Per-user balance cards (new system)
        $balances = $leaveTypes->map(function (LeaveType $leaveType) use ($user, $year): array {
            $balance = LeaveService::getOrCreateBalance($user, $leaveType, $year);
            return [
                'leave_type_id'     => $leaveType->id,
                'leave_type'        => [
                    'id'                     => $leaveType->id,
                    'name'                   => $leaveType->name,
                    'code'                   => $leaveType->code,
                    'days_per_year'          => $leaveType->days_per_year,
                    'accrual_policy'         => $leaveType->accrual_policy,
                    'carry_over_days'        => $leaveType->carry_over_days,
                    'requires_documentation' => $leaveType->requires_documentation,
                    'is_active'              => $leaveType->is_active,
                ],
                'entitled_days'     => (float) $balance->entitled_days,
                'used_days'         => (float) $balance->used_days,
                'carried_over_days' => (float) $balance->carried_over_days,
                'remaining'         => $balance->remaining,
            ];
        })->values()->all();

        // Requests query
        $requestsQuery = LeaveRequest::query()
            ->with([
                'user:id,employee_id,name',
                'reviewer:id,name',
                'leaveType:id,name,code',
                'coverUser:id,name',
            ])
            ->latest('created_at');

        if (! $isAdmin) {
            $requestsQuery->where('user_id', $user->id);
        }

        // Leave history for current user (non-pending)
        $historyQuery = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('status', '!=', 'pending')
            ->with(['leaveType:id,name,code'])
            ->latest('start_date');

        $payload = [
            'userRole'               => $user->role,
            'currentUserName'        => $user->name,
            'currentUserEmployeeId'  => $user->employee_id,
            'canManageLeave'         => $user->hasPermission('leave.manage'),
            'leaveTypes'             => $leaveTypes->map(fn (LeaveType $lt) => [
                'id'                     => $lt->id,
                'name'                   => $lt->name,
                'code'                   => $lt->code,
                'days_per_year'          => $lt->days_per_year,
                'accrual_policy'         => $lt->accrual_policy,
                'carry_over_days'        => $lt->carry_over_days,
                'max_carry_over_days'    => $lt->max_carry_over_days,
                'requires_documentation' => $lt->requires_documentation,
                'is_active'              => $lt->is_active,
            ])->values()->all(),
            'balances'               => $balances,
            // Legacy balance structure kept for backward compat
            'leaveBalance'           => $this->buildLegacyLeaveBalance($user),
            'requests'               => $requestsQuery->get()
                ->map(fn (LeaveRequest $lr) => $this->transformLeaveRequest($lr))
                ->all(),
            'leaveHistory'           => $historyQuery->get()
                ->map(fn (LeaveRequest $lr) => $this->transformLeaveHistory($lr))
                ->all(),
        ];

        // Admin-only extras
        if ($isAdmin) {
            $payload['publicHolidays'] = PublicHoliday::active()
                ->where('country_code', 'NG')
                ->whereYear('date', $year)
                ->orderBy('date')
                ->get()
                ->map(fn (PublicHoliday $h) => [
                    'id'           => $h->id,
                    'name'         => $h->name,
                    'date'         => $h->date->format('Y-m-d'),
                    'country_code' => $h->country_code,
                    'is_active'    => $h->is_active,
                ])
                ->all();

            // Team calendar: approved leave requests for current year, all users
            $payload['teamLeave'] = LeaveRequest::query()
                ->where('status', 'approved')
                ->whereYear('start_date', $year)
                ->with([
                    'user:id,employee_id,name',
                    'leaveType:id,name,code',
                ])
                ->orderBy('start_date')
                ->get()
                ->map(fn (LeaveRequest $lr) => [
                    'id'          => (string) $lr->id,
                    'staffName'   => $lr->user?->name ?? 'Unknown',
                    'staffId'     => $lr->user?->employee_id ?? '',
                    'leaveType'   => $lr->leaveType?->name ?? $this->leaveTypeLabel($lr->type),
                    'typeCode'    => $lr->leaveType?->code ?? $lr->type,
                    'startDate'   => $lr->start_date?->format('Y-m-d') ?? '',
                    'endDate'     => $lr->end_date?->format('Y-m-d') ?? '',
                    'workingDays' => $lr->working_days !== null ? (float) $lr->working_days : (int) $lr->days,
                ])
                ->all();

            // All leave types (active + inactive) for HR management tab
            $payload['allLeaveTypes'] = LeaveType::orderBy('name')->get()->map(fn (LeaveType $lt) => [
                'id'                     => $lt->id,
                'name'                   => $lt->name,
                'code'                   => $lt->code,
                'days_per_year'          => $lt->days_per_year,
                'accrual_policy'         => $lt->accrual_policy,
                'carry_over_days'        => $lt->carry_over_days,
                'max_carry_over_days'    => $lt->max_carry_over_days,
                'requires_documentation' => $lt->requires_documentation,
                'is_active'              => $lt->is_active,
            ])->values()->all();

            // All public holidays (not just current year)
            $payload['allPublicHolidays'] = PublicHoliday::orderBy('date')
                ->get()
                ->map(fn (PublicHoliday $h) => [
                    'id'           => $h->id,
                    'name'         => $h->name,
                    'date'         => $h->date->format('Y-m-d'),
                    'country_code' => $h->country_code,
                    'is_recurring' => $h->is_recurring,
                    'is_active'    => $h->is_active,
                ])
                ->all();
        }

        return Inertia::render('LeaveManagementPage', $payload);
    }

    // -----------------------------------------------------------------------
    // Store (new leave request)
    // -----------------------------------------------------------------------

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'leave_type_id' => [
                'nullable',
                Rule::exists('leave_types', 'id')->where('is_active', true),
            ],
            // Legacy fallback field
            'type'          => [
                Rule::requiredIf(fn () => empty($request->input('leave_type_id'))),
                'nullable',
                Rule::in(['annual', 'sick', 'personal']),
            ],
            'startDate'     => ['required', 'date'],
            'endDate'       => ['required', 'date', 'after_or_equal:startDate'],
            'reason'        => ['required', 'string', 'max:5000'],
            'cover_user_id' => ['nullable', Rule::exists('users', 'id')],
        ]);

        $user      = $request->user();
        $startDate = Carbon::parse($validated['startDate']);
        $endDate   = Carbon::parse($validated['endDate']);

        $leaveTypeId = $validated['leave_type_id'] ?? null;

        if ($leaveTypeId !== null) {
            // New-style request with leave type entity
            $leaveType   = LeaveType::findOrFail($leaveTypeId);
            $workingDays = LeaveService::workingDaysBetween($startDate, $endDate);
            $calDays     = $startDate->diffInDays($endDate) + 1;

            // Balance check — skip for types that require documentation (approved at review)
            if (! $leaveType->requires_documentation) {
                $balance   = LeaveService::getOrCreateBalance($user, $leaveType, now()->year);
                $remaining = $balance->remaining;

                if ($workingDays > $remaining) {
                    return back()->withErrors([
                        'endDate' => "This request exceeds your remaining {$leaveType->name} balance ({$remaining} days left).",
                    ]);
                }
            }

            LeaveRequest::create([
                'user_id'       => $user->id,
                'leave_type_id' => $leaveType->id,
                'cover_user_id' => $validated['cover_user_id'] ?? null,
                'type'          => strtolower($leaveType->code), // keep type for legacy compat
                'start_date'    => $startDate->toDateString(),
                'end_date'      => $endDate->toDateString(),
                'days'          => (int) $calDays,
                'working_days'  => $workingDays,
                'reason'        => $validated['reason'],
                'status'        => 'pending',
            ]);
        } else {
            // Legacy path — no leave_type_id
            $type    = $validated['type'] ?? 'personal';
            $calDays = $startDate->diffInDays($endDate) + 1;
            $balance = $this->buildLegacyLeaveBalance($user);
            $remaining = $balance[$type]['remaining'] ?? 0;

            if ($calDays > $remaining) {
                return back()->withErrors([
                    'endDate' => 'This request exceeds your remaining leave balance.',
                ]);
            }

            LeaveRequest::create([
                'user_id'    => $user->id,
                'type'       => $type,
                'start_date' => $startDate->toDateString(),
                'end_date'   => $endDate->toDateString(),
                'days'       => (int) $calDays,
                'reason'     => $validated['reason'],
                'status'     => 'pending',
            ]);
        }

        return back()->with('success', 'Leave request submitted successfully!');
    }

    // -----------------------------------------------------------------------
    // Update status (approve / reject)
    // -----------------------------------------------------------------------

    public function updateStatus(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        if (! $this->isAdmin($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'status'    => ['required', Rule::in(['approved', 'rejected'])],
            'hrComment' => ['nullable', 'string', 'max:5000'],
        ]);

        $previousStatus = $leaveRequest->status;
        $newStatus      = $validated['status'];

        // Balance adjustments for new-style requests
        if ($leaveRequest->leave_type_id !== null) {
            if ($newStatus === 'approved' && $previousStatus !== 'approved') {
                LeaveService::deductBalance($leaveRequest);
            } elseif ($newStatus === 'rejected' && $previousStatus === 'approved') {
                LeaveService::restoreBalance($leaveRequest);
            }
        }

        $leaveRequest->update([
            'status'               => $newStatus,
            'hr_comment'           => $validated['hrComment'] ?: ucfirst($newStatus) . ' by HR.',
            'reviewed_by_user_id'  => $request->user()->id,
            'reviewed_at'          => now(),
        ]);

        AuditLogger::record(
            module: 'leave',
            action: 'status_updated',
            subjectType: LeaveRequest::class,
            subjectId: $leaveRequest->id,
            oldData: ['status' => $previousStatus],
            newData: ['status' => $newStatus, 'hr_comment' => $leaveRequest->hr_comment],
            request: $request
        );

        return back()->with('success', 'Leave request updated successfully!');
    }

    // -----------------------------------------------------------------------
    // Leave type management (HR only — leave.manage permission)
    // -----------------------------------------------------------------------

    public function types(Request $request): Response
    {
        $this->authorizeManage($request->user());

        $types = LeaveType::orderBy('name')->get()->map(fn (LeaveType $lt) => [
            'id'                     => $lt->id,
            'name'                   => $lt->name,
            'code'                   => $lt->code,
            'days_per_year'          => $lt->days_per_year,
            'accrual_policy'         => $lt->accrual_policy,
            'carry_over_days'        => $lt->carry_over_days,
            'max_carry_over_days'    => $lt->max_carry_over_days,
            'requires_documentation' => $lt->requires_documentation,
            'is_active'              => $lt->is_active,
        ])->values()->all();

        return Inertia::render('LeaveManagementPage', [
            'userRole'       => $request->user()->role,
            'allLeaveTypes'  => $types,
            'canManageLeave' => true,
        ]);
    }

    public function storeType(Request $request): RedirectResponse
    {
        $this->authorizeManage($request->user());

        $validated = $request->validate([
            'name'                   => ['required', 'string', 'max:100'],
            'code'                   => ['required', 'string', 'max:20', 'unique:leave_types,code'],
            'days_per_year'          => ['required', 'integer', 'min:1', 'max:365'],
            'accrual_policy'         => ['required', Rule::in(['none', 'monthly', 'annual'])],
            'carry_over_days'        => ['required', 'integer', 'min:0'],
            'max_carry_over_days'    => ['required', 'integer', 'min:0'],
            'requires_documentation' => ['boolean'],
            'is_active'              => ['boolean'],
        ]);

        $leaveType = LeaveType::create(array_merge($validated, [
            'code' => strtoupper($validated['code']),
        ]));

        AuditLogger::record(
            module: 'leave',
            action: 'type_created',
            subjectType: LeaveType::class,
            subjectId: $leaveType->id,
            newData: $leaveType->toArray(),
            request: $request
        );

        return back()->with('success', "Leave type '{$leaveType->name}' created.");
    }

    public function updateType(Request $request, LeaveType $leaveType): RedirectResponse
    {
        $this->authorizeManage($request->user());

        $validated = $request->validate([
            'name'                   => ['required', 'string', 'max:100'],
            'code'                   => ['required', 'string', 'max:20', Rule::unique('leave_types', 'code')->ignore($leaveType->id)],
            'days_per_year'          => ['required', 'integer', 'min:1', 'max:365'],
            'accrual_policy'         => ['required', Rule::in(['none', 'monthly', 'annual'])],
            'carry_over_days'        => ['required', 'integer', 'min:0'],
            'max_carry_over_days'    => ['required', 'integer', 'min:0'],
            'requires_documentation' => ['boolean'],
            'is_active'              => ['boolean'],
        ]);

        $oldData = $leaveType->toArray();
        $leaveType->update(array_merge($validated, [
            'code' => strtoupper($validated['code']),
        ]));

        AuditLogger::record(
            module: 'leave',
            action: 'type_updated',
            subjectType: LeaveType::class,
            subjectId: $leaveType->id,
            oldData: $oldData,
            newData: $leaveType->fresh()?->toArray(),
            request: $request
        );

        return back()->with('success', "Leave type '{$leaveType->name}' updated.");
    }

    public function destroyType(Request $request, LeaveType $leaveType): RedirectResponse
    {
        $this->authorizeManage($request->user());

        $name    = $leaveType->name;
        $oldData = $leaveType->toArray();

        // Soft-deactivate if it has associated requests rather than hard delete
        if ($leaveType->leaveRequests()->exists()) {
            $leaveType->update(['is_active' => false]);

            AuditLogger::record(
                module: 'leave',
                action: 'type_deactivated',
                subjectType: LeaveType::class,
                subjectId: $leaveType->id,
                oldData: $oldData,
                newData: ['is_active' => false],
                request: $request
            );

            return back()->with('success', "Leave type '{$name}' has existing requests — it has been deactivated rather than deleted.");
        }

        $leaveType->delete();

        AuditLogger::record(
            module: 'leave',
            action: 'type_deleted',
            subjectType: LeaveType::class,
            subjectId: null,
            oldData: $oldData,
            request: $request
        );

        return back()->with('success', "Leave type '{$name}' deleted.");
    }

    // -----------------------------------------------------------------------
    // Public holiday management (HR only — leave.manage permission)
    // -----------------------------------------------------------------------

    public function holidays(Request $request): Response
    {
        $this->authorizeManage($request->user());

        $holidays = PublicHoliday::orderBy('date')->get()->map(fn (PublicHoliday $h) => [
            'id'           => $h->id,
            'name'         => $h->name,
            'date'         => $h->date->format('Y-m-d'),
            'country_code' => $h->country_code,
            'is_recurring' => $h->is_recurring,
            'is_active'    => $h->is_active,
        ])->all();

        return Inertia::render('LeaveManagementPage', [
            'userRole'          => $request->user()->role,
            'allPublicHolidays' => $holidays,
            'canManageLeave'    => true,
        ]);
    }

    public function storeHoliday(Request $request): RedirectResponse
    {
        $this->authorizeManage($request->user());

        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'date'         => ['required', 'date'],
            'country_code' => ['required', 'string', 'size:2'],
            'is_recurring' => ['boolean'],
            'is_active'    => ['boolean'],
        ]);

        $holiday = PublicHoliday::create($validated);

        // Bust the cached holiday list so new entries take effect immediately
        \Illuminate\Support\Facades\Cache::forget('public_holidays_ng');

        AuditLogger::record(
            module: 'leave',
            action: 'holiday_created',
            subjectType: PublicHoliday::class,
            subjectId: $holiday->id,
            newData: $holiday->toArray(),
            request: $request
        );

        return back()->with('success', "Public holiday '{$holiday->name}' added.");
    }

    public function updateHoliday(Request $request, PublicHoliday $publicHoliday): RedirectResponse
    {
        $this->authorizeManage($request->user());

        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'date'         => ['required', 'date', Rule::unique('public_holidays', 'date')->where('country_code', $request->input('country_code', 'NG'))->ignore($publicHoliday->id)],
            'country_code' => ['required', 'string', 'size:2'],
            'is_recurring' => ['boolean'],
            'is_active'    => ['boolean'],
        ]);

        $oldData = $publicHoliday->toArray();
        $publicHoliday->update($validated);

        \Illuminate\Support\Facades\Cache::forget('public_holidays_ng');

        AuditLogger::record(
            module: 'leave',
            action: 'holiday_updated',
            subjectType: PublicHoliday::class,
            subjectId: $publicHoliday->id,
            oldData: $oldData,
            newData: $publicHoliday->fresh()?->toArray(),
            request: $request
        );

        return back()->with('success', "Holiday '{$publicHoliday->name}' updated.");
    }

    public function destroyHoliday(Request $request, PublicHoliday $publicHoliday): RedirectResponse
    {
        $this->authorizeManage($request->user());

        $name    = $publicHoliday->name;
        $oldData = $publicHoliday->toArray();
        $publicHoliday->delete();

        \Illuminate\Support\Facades\Cache::forget('public_holidays_ng');

        AuditLogger::record(
            module: 'leave',
            action: 'holiday_deleted',
            subjectType: PublicHoliday::class,
            subjectId: null,
            oldData: $oldData,
            request: $request
        );

        return back()->with('success', "Holiday '{$name}' removed.");
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * @return array<string, array<string, int>>
     */
    private function buildLegacyLeaveBalance(User $user): array
    {
        $year = now()->year;
        $usedByType = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereYear('start_date', $year)
            ->whereNull('leave_type_id') // only legacy rows
            ->get()
            ->groupBy('type')
            ->map(fn ($requests) => (int) $requests->sum('days'));

        return collect(self::LEGACY_BALANCES)
            ->mapWithKeys(function (int $total, string $type) use ($usedByType): array {
                $used = (int) ($usedByType[$type] ?? 0);
                return [
                    $type => [
                        'total'     => $total,
                        'used'      => $used,
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
            'id'           => (string) $leaveRequest->id,
            'staffId'      => $leaveRequest->user?->employee_id ?? '',
            'staffName'    => $leaveRequest->user?->name ?? 'Unknown',
            'leaveType'    => $leaveRequest->leaveType?->name ?? $this->leaveTypeLabel($leaveRequest->type),
            'type'         => $leaveRequest->leaveType?->name ?? $this->leaveTypeLabel($leaveRequest->type),
            'typeKey'      => $leaveRequest->type,
            'leaveTypeId'  => $leaveRequest->leave_type_id,
            'startDate'    => $leaveRequest->start_date?->format('M d, Y') ?? '',
            'endDate'      => $leaveRequest->end_date?->format('M d, Y') ?? '',
            'days'         => $leaveRequest->days,
            'workingDays'  => $leaveRequest->working_days !== null ? (float) $leaveRequest->working_days : null,
            'reason'       => $leaveRequest->reason,
            'status'       => $leaveRequest->status,
            'hrComment'    => $leaveRequest->hr_comment,
            'approverName' => $leaveRequest->reviewer?->name,
            'submittedDate'=> $leaveRequest->created_at?->format('M d, Y'),
            'coverName'    => $leaveRequest->coverUser?->name,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformLeaveHistory(LeaveRequest $leaveRequest): array
    {
        return [
            'id'           => (string) $leaveRequest->id,
            'period'       => $leaveRequest->start_date?->format('M Y') ?? '',
            'type'         => $leaveRequest->leaveType?->name ?? $this->leaveTypeLabel($leaveRequest->type),
            'startDate'    => $leaveRequest->start_date?->format('M d, Y') ?? '',
            'endDate'      => $leaveRequest->end_date?->format('M d, Y') ?? '',
            'days'         => $leaveRequest->days,
            'workingDays'  => $leaveRequest->working_days !== null ? (float) $leaveRequest->working_days : null,
            'status'       => ucfirst($leaveRequest->status),
            'reason'       => $leaveRequest->reason,
            'approverName' => $leaveRequest->reviewer?->name,
            'hrComment'    => $leaveRequest->hr_comment,
        ];
    }

    private function leaveTypeLabel(string $type): string
    {
        return match ($type) {
            'annual'     => 'Annual Leave',
            'sick'       => 'Sick Leave',
            'maternity'  => 'Maternity Leave',
            'paternity'  => 'Paternity Leave',
            default      => 'Personal Leave',
        };
    }

    private function isAdmin(User $user): bool
    {
        return $user->hasPermission('leave.review');
    }

    private function authorizeManage(User $user): void
    {
        if (! $user->hasPermission('leave.manage')) {
            abort(403, 'You do not have permission to manage leave types and holidays.');
        }
    }
}
