<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseClaim extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'category',
        'currency',
        'amount',
        'exchange_rate',
        'amount_ngn_kobo',
        'expense_date',
        'status',
        'submitted_at',
        'reviewed_by_id',
        'reviewed_at',
        'review_notes',
        'finance_paid_by_id',
        'finance_paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
        'expense_date' => 'date',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'finance_paid_at' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_id');
    }

    public function financePayBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finance_paid_by_id');
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(ExpenseReceipt::class, 'expense_claim_id');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Return the NGN equivalent as a float (amount_ngn_kobo / 100).
     */
    public function amountNgn(): float
    {
        return $this->amount_ngn_kobo / 100;
    }

    // ── Scopes ───────────────────────────────────────────────────────────────

    /**
     * Scope claims submitted by a specific user.
     */
    public function scopeSubmittedBy(\Illuminate\Database\Eloquent\Builder $query, User $user): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('user_id', $user->id);
    }
}
