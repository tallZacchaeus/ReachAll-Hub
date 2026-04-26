<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BonusAward extends Model
{
    protected $fillable = [
        'bonus_plan_id',
        'user_id',
        'amount_kobo',
        'rationale',
        'status',
        'approved_by_id',
        'approved_at',
        'paid_at',
    ];

    protected $casts = [
        'amount_kobo' => 'integer',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(BonusPlan::class, 'bonus_plan_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }
}
