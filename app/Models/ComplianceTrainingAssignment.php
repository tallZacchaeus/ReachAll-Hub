<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplianceTrainingAssignment extends Model
{
    protected $fillable = [
        'training_id', 'user_id', 'assigned_by_id',
        'due_at', 'completed_at', 'status', 'completion_notes',
        'last_reminded_at', 'reminder_count',
    ];

    protected $casts = [
        'due_at'           => 'date',
        'completed_at'     => 'datetime',
        'last_reminded_at' => 'datetime',
        'reminder_count'   => 'integer',
    ];

    public function training(): BelongsTo
    {
        return $this->belongsTo(ComplianceTraining::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_id');
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isOverdue(): bool
    {
        return $this->status === 'pending' && $this->due_at->isPast();
    }
}
