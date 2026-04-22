<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalStep extends Model
{
    protected $fillable = [
        'requisition_id',
        'approver_id',
        'level',
        'role_label',
        'status',
        'comment',
        'acted_at',
        'sla_deadline',
        'reminder_sent',
        'escalated_from_id',
        'is_budget_override',
    ];

    protected $casts = [
        'acted_at'           => 'datetime',
        'sla_deadline'       => 'datetime',
        'reminder_sent'      => 'boolean',
        'is_budget_override' => 'boolean',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function escalatedFrom(): BelongsTo
    {
        return $this->belongsTo(ApprovalStep::class, 'escalated_from_id');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isOverdue(): bool
    {
        return $this->isPending()
            && $this->sla_deadline !== null
            && $this->sla_deadline->isPast();
    }
}
