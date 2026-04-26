<?php

namespace App\Http\Controllers;

use App\Models\ChecklistTemplate;
use App\Models\EmployeeLifecycleEvent;
use App\Models\OffboardingChecklist;
use App\Models\User;
use App\Models\UserChecklist;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StaffEnrollmentController extends Controller
{
    private const DEPARTMENTS = [
        'Video & Production',
        'Project Management',
        'Product Team',
        'Content & Brand Comms',
        'Interns',
        'Incubator Team',
        'Skillup Team',
        'DAF Team',
        'Graphics Design',
        'Accounting',
        'Business Development',
    ];

    private const POSITIONS = [
        'Video Editor',
        'Producer',
        'Project Manager',
        'Product Manager',
        'Content Writer',
        'Brand Manager',
        'Intern',
        'Tech Trainer',
        'Programs Coordinator',
        'Graphic Designer',
        'Accountant',
        'Business Developer',
    ];

    private const ROLE_LABELS = [
        'staff' => 'Staff',
        'management' => 'Management',
        'hr' => 'HR',
        'superadmin' => 'Super Admin',
    ];

    private const STATUS_LABELS = [
        'active' => 'Active',
        'inactive' => 'Inactive',
        'pending' => 'Pending',
    ];

    public function index(Request $request): Response
    {
        $this->authorizeAdmin($request);

        $staffMembers = User::query()
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $this->transformUser($user));

        return Inertia::render('StaffEnrollmentPage', [
            'userRole' => $request->user()->role,
            'staffMembers' => $staffMembers,
            'departments' => self::DEPARTMENTS,
            'positions' => self::POSITIONS,
            'roles' => ['Staff', 'Management', 'HR'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate($this->rules());

        $newUser = User::create([
            'employee_id' => $validated['employeeId'],
            'name' => trim($validated['firstName'].' '.$validated['lastName']),
            'email' => $validated['email'],
            'department' => $validated['department'],
            'position' => $validated['position'],
            'role' => $this->normalizeRole($validated['role']),
            'status' => 'active',
            'employee_stage' => $validated['employee_stage'] ?? 'performer',
            'password' => Hash::make($validated['password']),
            'email_verified_at' => null,
        ]);

        // Auto-assign default checklists matching the user's stage
        if ($newUser->employee_stage) {
            $defaultTemplates = ChecklistTemplate::where('stage', $newUser->employee_stage)
                ->where('is_default', true)
                ->get();
            foreach ($defaultTemplates as $template) {
                UserChecklist::firstOrCreate([
                    'user_id' => $newUser->id,
                    'checklist_template_id' => $template->id,
                ]);
            }
        }

        $verificationWarning = $this->sendVerificationEmail($newUser);

        $response = back()->with(
            'success',
            $validated['firstName'].' '.$validated['lastName'].' has been enrolled successfully.'
        );

        if ($verificationWarning) {
            $response->with('error', $verificationWarning);
        }

        return $response;
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate($this->rules($user, false));

        $emailChanged = $user->email !== $validated['email'];

        $user->forceFill([
            'employee_id' => $validated['employeeId'],
            'name' => trim($validated['firstName'].' '.$validated['lastName']),
            'email' => $validated['email'],
            'department' => $validated['department'],
            'position' => $validated['position'],
            'role' => $this->normalizeRole($validated['role']),
            'employee_stage' => $validated['employee_stage'] ?? $user->employee_stage ?? 'performer',
            'email_verified_at' => $emailChanged ? null : $user->email_verified_at,
        ])->save();

        $verificationWarning = $emailChanged ? $this->sendVerificationEmail($user) : null;

        $response = back()->with(
            'success',
            $emailChanged
                ? 'Staff information updated. The user must verify the new email address before accessing the platform.'
                : 'Staff information updated successfully.'
        );

        if ($verificationWarning) {
            $response->with('error', $verificationWarning);
        }

        return $response;
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAdmin($request);

        if ($request->user()->is($user)) {
            return back()->with('error', 'You cannot remove your own account.');
        }

        $user->delete();

        return back()->with('success', 'Staff member removed successfully.');
    }

    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $nextStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $nextStatus]);

        // When deactivating: initiate offboarding checklist + record lifecycle event
        if ($nextStatus === 'inactive') {
            $checklist = OffboardingChecklist::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'initiated_by_id' => $request->user()->id,
                    'termination_date' => now()->toDateString(),
                    'status' => 'initiated',
                ]
            );

            if ($checklist->wasRecentlyCreated) {
                $defaults = [
                    ['exit_interview',    'Conduct Exit Interview',                                       'hr',      1],
                    ['access_revocation', 'Revoke System & Building Access',                             'it',      2],
                    ['equipment_return',  'Return Company Equipment',                                    'hr',      3],
                    ['document_handover', 'Complete Document Handover',                                  'hr',      4],
                    ['hr_clearance',      'HR Department Clearance',                                     'hr',      5],
                    ['finance_clearance', 'Finance Department Clearance (Outstanding Advances/Loans)',   'finance', 6],
                    ['final_payroll',     'Process Final Payroll Settlement',                            'payroll', 7],
                    ['clearance_form',    'Issue Clearance Certificate',                                 'hr',      8],
                ];

                foreach ($defaults as [$type, $title, $dept, $order]) {
                    $checklist->tasks()->create([
                        'task_type'  => $type,
                        'title'      => $title,
                        'status'     => 'pending',
                        'sort_order' => $order,
                    ]);
                }

                AuditLogger::record(
                    'offboarding',
                    'checklist_initiated',
                    'App\Models\User',
                    $user->id,
                    null,
                    ['user_name' => $user->name],
                    $request
                );
            }

            // Record lifecycle termination event
            EmployeeLifecycleEvent::record(
                userId: $user->id,
                eventType: 'termination',
                effectiveDate: now()->toDateString(),
                oldValues: ['status' => 'active'],
                newValues: ['status' => 'inactive'],
                notes: 'Status set to inactive via staff enrollment.',
                recordedById: $request->user()->id,
            );
        }

        return back()->with('success', 'Status updated successfully.');
    }

    public function resendVerification(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAdmin($request);

        if ($user->hasVerifiedEmail()) {
            return back()->with('error', 'This user has already verified their email address.');
        }

        $verificationWarning = $this->sendVerificationEmail($user);

        if ($verificationWarning) {
            return back()->with('error', $verificationWarning);
        }

        return back()->with('success', 'Verification email resent successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?User $user = null, bool $requirePassword = true): array
    {
        return [
            'employeeId' => [
                'required',
                'string',
                'max:255',
                Rule::unique(User::class, 'employee_id')->ignore($user?->id),
            ],
            'firstName' => ['required', 'string', 'max:255'],
            'lastName' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique(User::class, 'email')->ignore($user?->id),
            ],
            'password' => $requirePassword ? ['required', 'string', 'min:8'] : ['nullable', 'string', 'min:8'],
            'department' => ['required', 'string', Rule::in(self::DEPARTMENTS)],
            'position' => ['required', 'string', Rule::in(self::POSITIONS)],
            'role' => ['required', 'string', Rule::in(['Staff', 'Management', 'HR'])],
            'employee_stage' => ['nullable', 'string', Rule::in(['joiner', 'performer', 'leader'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function transformUser(User $user): array
    {
        [$firstName, $lastName] = $this->splitName($user->name);

        return [
            'id' => (string) $user->id,
            'employeeId' => $user->employee_id ?? '',
            'firstName' => $firstName,
            'lastName' => $lastName,
            'email' => $user->email,
            'emailVerified' => $user->hasVerifiedEmail(),
            'department' => $user->department ?? 'Unassigned',
            'role' => self::ROLE_LABELS[$user->role] ?? ucfirst((string) $user->role),
            'position' => $user->position ?? 'Unassigned',
            'enrollmentDate' => $user->created_at?->toDateString() ?? '',
            'status' => self::STATUS_LABELS[$user->status ?? 'active'] ?? 'Active',
            'employeeStage' => $user->employee_stage ?? 'performer',
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $firstName = $parts[0] ?? '';
        $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';

        return [$firstName, $lastName];
    }

    private function normalizeRole(string $role): string
    {
        return match ($role) {
            'Management' => 'management',
            'HR' => 'hr',
            default => 'staff',
        };
    }

    private function authorizeAdmin(Request $request): void
    {
        if (! $request->user()?->hasPermission('staff.enroll')) {
            abort(403, 'Unauthorized action.');
        }
    }

    private function sendVerificationEmail(User $user): ?string
    {
        try {
            $user->sendEmailVerificationNotification();

            return null;
        } catch (\Throwable $e) {
            report($e);

            return 'The account was saved, but the verification email could not be sent. Check your mail configuration and resend verification.';
        }
    }
}
