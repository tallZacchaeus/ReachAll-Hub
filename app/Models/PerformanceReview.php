<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceReview extends Model
{
    protected $fillable = [
        'review_cycle_id',
        'reviewee_id',
        'reviewer_id',
        'type',
        'status',
        'submitted_at',
        'acknowledged_at',
        'overall_rating',
        'ratings',
        'strengths',
        'improvements',
        'comments',
    ];

    protected $casts = [
        'ratings' => 'array',
        'submitted_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'overall_rating' => 'integer',
    ];

    public function reviewCycle(): BelongsTo
    {
        return $this->belongsTo(ReviewCycle::class);
    }

    public function reviewee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewee_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function isSubmitted(): bool
    {
        return $this->submitted_at !== null;
    }

    public function canBeEditedBy(User $user): bool
    {
        if (! in_array($this->status, ['pending', 'in_progress'], true)) {
            return false;
        }

        if ($this->type === 'self') {
            return $this->reviewee_id === $user->id;
        }

        return $this->reviewer_id === $user->id;
    }
}
