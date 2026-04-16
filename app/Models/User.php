<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
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

    /** All roles with any finance module access */
    public const FINANCE_ROLES = ['finance', 'general_management', 'ceo', 'superadmin'];

    /** Roles that can access finance admin pages */
    public const FINANCE_ADMIN_ROLES = ['finance', 'ceo', 'superadmin'];

    /** Roles with executive-level approval authority */
    public const EXEC_ROLES = ['general_management', 'ceo', 'superadmin'];

    public function isFinance(): bool
    {
        return in_array($this->role, self::FINANCE_ROLES, true);
    }

    public function isFinanceAdmin(): bool
    {
        return in_array($this->role, self::FINANCE_ADMIN_ROLES, true);
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
}
