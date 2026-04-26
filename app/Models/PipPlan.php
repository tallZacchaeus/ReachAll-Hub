<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PipPlan extends Model
{
    protected $fillable = [
        'user_id',
        'initiated_by_id',
        'performance_review_id',
        'title',
        'description',
        'start_date',
        'end_date',
        'status',
        'outcome',
        'outcome_date',
    ];

    protected $casts = [
        'start_date'   => 'date',
        'end_date'     => 'date',
        'outcome_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_id');
    }

    public function performanceReview(): BelongsTo
    {
        return $this->belongsTo(PerformanceReview::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(PipMilestone::class);
    }
}
