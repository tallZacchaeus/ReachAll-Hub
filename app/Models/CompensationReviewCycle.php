<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompensationReviewCycle extends Model
{
    protected $fillable = [
        'name',
        'cycle_type',
        'review_start_date',
        'review_end_date',
        'effective_date',
        'status',
        'budget_kobo',
        'created_by_id',
        'notes',
    ];

    protected $casts = [
        'review_start_date' => 'date',
        'review_end_date' => 'date',
        'effective_date' => 'date',
        'budget_kobo' => 'integer',
    ];

    public function entries(): HasMany
    {
        return $this->hasMany(CompensationReviewEntry::class, 'cycle_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function totalProposedKobo(): int
    {
        return (int) $this->entries()
            ->where('status', 'approved')
            ->sum(\DB::raw('proposed_salary_kobo - current_salary_kobo'));
    }
}
