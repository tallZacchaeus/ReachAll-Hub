<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhtLiability extends Model
{
    protected $fillable = [
        'requisition_id',
        'payment_id',
        'vendor_id',
        'amount_kobo',
        'rate_percent',
        'status',
        'financial_period_id',
        'created_by',
    ];

    protected $casts = [
        'amount_kobo'  => 'integer',
        'rate_percent' => 'integer',
    ];

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function financialPeriod(): BelongsTo
    {
        return $this->belongsTo(FinancialPeriod::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
