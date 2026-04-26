<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollDeduction extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'description',
        'monthly_amount_kobo',
        'remaining_kobo',
        'status',
        'start_date',
        'end_date',
        'created_by_id',
        'notes',
    ];

    protected $casts = [
        'monthly_amount_kobo' => 'integer',
        'remaining_kobo' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->remaining_kobo > 0;
    }

    /** Amount to recover this cycle — capped at remaining balance. */
    public function instalment(): int
    {
        return min($this->monthly_amount_kobo, $this->remaining_kobo);
    }
}
