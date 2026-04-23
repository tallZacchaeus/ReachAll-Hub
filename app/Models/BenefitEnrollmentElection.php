<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BenefitEnrollmentElection extends Model
{
    protected $fillable = [
        'enrollment_window_id',
        'user_id',
        'benefit_plan_id',
        'election',
        'status',
        'submitted_at',
        'processed_at',
        'processed_by_id',
        'notes',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function window(): BelongsTo
    {
        return $this->belongsTo(BenefitEnrollmentWindow::class, 'enrollment_window_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(BenefitPlan::class, 'benefit_plan_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_id');
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }
}
