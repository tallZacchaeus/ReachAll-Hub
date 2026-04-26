<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PeriodCloseWaiver extends Model
{
    protected $fillable = [
        'financial_period_id',
        'item_type',
        'item_id',
        'reason',
        'waived_by',
        'waived_at',
    ];

    protected $casts = [
        'waived_at' => 'datetime',
        'item_id' => 'integer',
    ];

    public function period(): BelongsTo
    {
        return $this->belongsTo(FinancialPeriod::class, 'financial_period_id');
    }

    public function waivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'waived_by');
    }
}
