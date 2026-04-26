<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OffboardingChecklist extends Model
{
    protected $fillable = [
        'user_id',
        'initiated_by_id',
        'termination_date',
        'reason',
        'status',
        'exit_interview_completed_at',
        'clearance_signed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'termination_date' => 'date',
            'exit_interview_completed_at' => 'datetime',
            'clearance_signed_at' => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(OffboardingTask::class, 'offboarding_checklist_id')
            ->orderBy('sort_order');
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Percentage of tasks that are completed or waived (0-100).
     */
    public function completionPercentage(): int
    {
        $total = $this->tasks()->count();

        if ($total === 0) {
            return 0;
        }

        $done = $this->tasks()
            ->whereIn('status', ['completed', 'waived'])
            ->count();

        return (int) round(($done / $total) * 100);
    }
}
