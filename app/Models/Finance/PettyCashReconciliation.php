<?php

namespace App\Models\Finance;

use App\Models\User;
use App\Services\Finance\MoneyHelper;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PettyCashReconciliation extends Model
{
    protected $fillable = [
        'float_id',
        'period_start',
        'period_end',
        'submitted_by',
        'reviewed_by',
        'status',
        'total_expenses_kobo',
        'variance_kobo',
        'replenishment_requisition_id',
        'notes',
        'reviewed_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'total_expenses_kobo' => 'integer',
        'variance_kobo' => 'integer',
        'reviewed_at' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function float(): BelongsTo
    {
        return $this->belongsTo(PettyCashFloat::class, 'float_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PettyCashTransaction::class, 'reconciliation_id');
    }

    public function replenishmentRequisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class, 'replenishment_requisition_id');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function totalFmt(): string
    {
        return MoneyHelper::format($this->total_expenses_kobo);
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }
}
