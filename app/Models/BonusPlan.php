<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BonusPlan extends Model
{
    protected $fillable = [
        'name',
        'bonus_type',
        'period_label',
        'total_budget_kobo',
        'status',
        'payout_date',
        'description',
        'created_by_id',
    ];

    protected $casts = [
        'total_budget_kobo' => 'integer',
        'payout_date'       => 'date',
    ];

    public function awards(): HasMany
    {
        return $this->hasMany(BonusAward::class, 'bonus_plan_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /** Sum of approved + paid award amounts. */
    public function committedKobo(): int
    {
        return (int) $this->awards()
            ->whereIn('status', ['approved', 'paid'])
            ->sum('amount_kobo');
    }

    public function remainingBudgetKobo(): int
    {
        return $this->total_budget_kobo - $this->committedKobo();
    }
}
