<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompensationReviewEntry extends Model
{
    protected $fillable = [
        'cycle_id',
        'user_id',
        'current_salary_kobo',
        'proposed_salary_kobo',
        'merit_basis_points',
        'recommendation',
        'rationale',
        'status',
        'reviewed_by_id',
        'approved_by_id',
        'approved_at',
    ];

    protected $casts = [
        'current_salary_kobo'  => 'integer',
        'proposed_salary_kobo' => 'integer',
        'merit_basis_points'   => 'integer',
        'approved_at'          => 'datetime',
    ];

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(CompensationReviewCycle::class, 'cycle_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    /** Increase in kobo from current to proposed. */
    public function increaseKobo(): int
    {
        return max(0, ($this->proposed_salary_kobo ?? 0) - $this->current_salary_kobo);
    }

    /** Merit percentage as a decimal (basis points / 10000). */
    public function meritPercent(): float
    {
        return $this->merit_basis_points / 10000;
    }
}
