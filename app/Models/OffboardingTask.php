<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OffboardingTask extends Model
{
    protected $fillable = [
        'offboarding_checklist_id',
        'task_type',
        'title',
        'description',
        'assigned_to_id',
        'status',
        'completed_at',
        'completed_by_id',
        'notes',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────

    public function checklist(): BelongsTo
    {
        return $this->belongsTo(OffboardingChecklist::class, 'offboarding_checklist_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by_id');
    }
}
