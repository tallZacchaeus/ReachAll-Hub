<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeBenefitEnrollment extends Model
{
    protected $fillable = [
        'user_id',
        'benefit_plan_id',
        'status',
        'effective_date',
        'end_date',
        'employee_contribution_kobo',
        'employer_contribution_kobo',
        'member_id',
        'enrolled_by_id',
        'notes',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'end_date' => 'date',
        'employee_contribution_kobo' => 'integer',
        'employer_contribution_kobo' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(BenefitPlan::class, 'benefit_plan_id');
    }

    public function enrolledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enrolled_by_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
