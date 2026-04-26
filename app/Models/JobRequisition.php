<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobRequisition extends Model
{
    protected $fillable = [
        'title',
        'department',
        'headcount',
        'employment_type',
        'justification',
        'priority',
        'status',
        'requested_by_id',
        'approved_by_id',
        'approved_at',
        'rejection_reason',
        'job_posting_id',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'headcount' => 'integer',
    ];

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function posting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class, 'job_posting_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
