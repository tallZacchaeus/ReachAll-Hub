<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollLoan extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'description',
        'principal_kobo',
        'remaining_kobo',
        'monthly_instalment_kobo',
        'start_date',
        'end_date',
        'status',
        'approved_by_id',
        'approved_at',
        'notes',
    ];

    protected $casts = [
        'principal_kobo' => 'integer',
        'remaining_kobo' => 'integer',
        'monthly_instalment_kobo' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    /** Scope: only active loans. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /** True if the loan has been fully repaid. */
    public function isFullyRepaid(): bool
    {
        return $this->remaining_kobo <= 0;
    }
}
