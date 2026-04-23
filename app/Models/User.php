<?php

namespace App\Models;

use App\Services\Finance\FinanceRoleHelper;
use App\Services\PermissionService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'employee_id',
        'name',
        'email',
        'phone',
        'location',
        'department',
        'position',
        'role',
        'status',
        'employee_stage',
        'password',
        // Structured org fields
        'department_id',
        'job_position_id',
        'office_location_id',
        'reports_to_id',
        'hire_date',
        'date_of_birth',
        'gender',
        'employment_type',
        'probation_end_date',
        'nin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'    => 'datetime',
            'password'             => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'hire_date'            => 'date',
            'date_of_birth'        => 'date',
            'probation_end_date'   => 'date',
        ];
    }

    // ── Org structure relationships ─────────────────────────────────────────

    public function departmentEntity(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function jobPosition(): BelongsTo
    {
        return $this->belongsTo(JobPosition::class, 'job_position_id');
    }

    public function officeLocation(): BelongsTo
    {
        return $this->belongsTo(OfficeLocation::class, 'office_location_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reports_to_id');
    }

    public function directReports(): HasMany
    {
        return $this->hasMany(User::class, 'reports_to_id');
    }

    public function lifecycleEvents(): HasMany
    {
        return $this->hasMany(EmployeeLifecycleEvent::class, 'user_id')->orderByDesc('effective_date');
    }

    public function scopeJoiners($query)
    {
        return $query->where('employee_stage', 'joiner');
    }

    public function scopePerformers($query)
    {
        return $query->where('employee_stage', 'performer');
    }

    public function scopeLeaders($query)
    {
        return $query->where('employee_stage', 'leader');
    }

    public function isJoiner(): bool
    {
        return $this->employee_stage === 'joiner';
    }

    public function isPerformer(): bool
    {
        return $this->employee_stage === 'performer';
    }

    public function isLeader(): bool
    {
        return $this->employee_stage === 'leader';
    }

    // ── Finance role helpers ────────────────────────────────────────────────
    // A1-02: Delegates to FinanceRoleHelper — single source of truth.

    public function isFinance(): bool
    {
        // A1-02: Maps to FINANCE_ADMIN_ROLES (the authoritative 4-role set).
        // Previously User::FINANCE_ROLES = ['finance','general_management','ceo','superadmin'].
        return FinanceRoleHelper::isAdmin($this->role);
    }

    public function isFinanceAdmin(): bool
    {
        return FinanceRoleHelper::isAdmin($this->role);
    }

    public function isCeo(): bool
    {
        return $this->role === 'ceo';
    }

    public function isGeneralManagement(): bool
    {
        return in_array($this->role, ['general_management', 'ceo', 'superadmin'], true);
    }

    /**
     * Role hierarchy value — higher = more permissions.
     * staff(1) < management(2) < hr(3) < finance(4) < general_management(5) < ceo(6) < superadmin(7)
     */
    public function getRoleWeightAttribute(): int
    {
        return match ($this->role) {
            'staff'              => 1,
            'management'         => 2,
            'hr'                 => 3,
            'finance'            => 4,
            'general_management' => 5,
            'ceo'                => 6,
            'superadmin'         => 7,
            default              => 1,
        };
    }

    // ── RBAC helpers ───────────────────────────────────────────────────────

    /**
     * Return true if this user holds the named permission.
     * Superadmin bypasses all permission checks.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->role === 'superadmin') {
            return true;
        }

        if (!$this->role) {
            return false;
        }

        return PermissionService::roleHasPermission($this->role, $permission);
    }

    /**
     * Return every permission slug this user holds (for Inertia shared props).
     *
     * @return list<string>
     */
    public function getPermissions(): array
    {
        if ($this->role === 'superadmin') {
            return \Illuminate\Support\Facades\Cache::remember(
                'rbac:all_permissions',
                3600,
                fn () => \App\Models\Permission::pluck('name')->all()
            );
        }

        if (!$this->role) {
            return [];
        }

        return PermissionService::permissionsForRole($this->role);
    }

    // ── HR Document vault relationships ────────────────────────────────────

    public function hrDocuments(): HasMany
    {
        return $this->hasMany(HrDocument::class, 'user_id');
    }

    public function documentSignatures(): HasMany
    {
        return $this->hasMany(DocumentSignature::class, 'signee_id');
    }

    // ── Payroll relationships ───────────────────────────────────────────────

    public function salaries(): HasMany
    {
        return $this->hasMany(EmployeeSalary::class, 'user_id')->orderByDesc('effective_date');
    }

    /** Current active salary record. */
    public function currentSalary(): ?EmployeeSalary
    {
        return $this->salaries()
            ->where('effective_date', '<=', now()->toDateString())
            ->where(fn ($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', now()->toDateString()))
            ->first();
    }

    public function payrollEntries(): HasMany
    {
        return $this->hasMany(PayrollEntry::class, 'user_id');
    }

    public function payrollDeductions(): HasMany
    {
        return $this->hasMany(PayrollDeduction::class, 'user_id');
    }

    // ── Benefits relationships ──────────────────────────────────────────────

    public function benefitEnrollments(): HasMany
    {
        return $this->hasMany(EmployeeBenefitEnrollment::class, 'user_id');
    }

    public function activeBenefits(): HasMany
    {
        return $this->hasMany(EmployeeBenefitEnrollment::class, 'user_id')
            ->where('status', 'active');
    }

    public function dependents(): HasMany
    {
        return $this->hasMany(EmployeeDependent::class, 'user_id');
    }

    public function benefitElections(): HasMany
    {
        return $this->hasMany(BenefitEnrollmentElection::class, 'user_id');
    }

    public function compensationReviewEntries(): HasMany
    {
        return $this->hasMany(CompensationReviewEntry::class, 'user_id');
    }

    public function bonusAwards(): HasMany
    {
        return $this->hasMany(BonusAward::class, 'user_id');
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to_user_id');
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_by_user_id');
    }

    public function taskComments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function resourceRequests(): HasMany
    {
        return $this->hasMany(ResourceRequest::class);
    }

    public function reviewedResourceRequests(): HasMany
    {
        return $this->hasMany(ResourceRequest::class, 'reviewed_by_user_id');
    }

    public function resourceRequestComments(): HasMany
    {
        return $this->hasMany(ResourceRequestComment::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function reviewedLeaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'reviewed_by_user_id');
    }

    public function contentPages(): HasMany
    {
        return $this->hasMany(ContentPage::class, 'author_id');
    }

    public function policyAcknowledgements(): HasMany
    {
        return $this->hasMany(PolicyAcknowledgement::class);
    }

    public function courseEnrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    public function sentRecognitions(): HasMany
    {
        return $this->hasMany(Recognition::class, 'from_user_id');
    }

    public function receivedRecognitions(): HasMany
    {
        return $this->hasMany(Recognition::class, 'to_user_id');
    }

    public function jobApplications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function interviews(): HasMany
    {
        return $this->hasMany(InterviewSchedule::class, 'interviewer_id');
    }

    public function interviewScorecards(): HasMany
    {
        return $this->hasMany(InterviewScorecard::class, 'evaluator_id');
    }

    public function reportedCases(): HasMany
    {
        return $this->hasMany(HrCase::class, 'reported_by_id');
    }

    public function assignedCases(): HasMany
    {
        return $this->hasMany(HrCase::class, 'assigned_to_id');
    }

    public function caseParticipations(): HasMany
    {
        return $this->hasMany(HrCaseParty::class);
    }

    public function complianceDocuments(): HasMany
    {
        return $this->hasMany(ComplianceDocument::class);
    }

    public function dataSubjectRequests(): HasMany
    {
        return $this->hasMany(DataSubjectRequest::class);
    }

    public function trainingAssignments(): HasMany
    {
        return $this->hasMany(ComplianceTrainingAssignment::class);
    }

    public function policyAcknowledgements2(): HasMany
    {
        return $this->hasMany(CompliancePolicyAcknowledgement::class);
    }
}
