<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Payment extends Model
{
    protected $fillable = [
        'requisition_id',
        'amount_kobo',
        'method',
        'reference',
        'paid_at',
        'paid_by',
        'proof_path',
        // T10-01: void columns
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected $casts = [
        'amount_kobo' => 'integer',
        'paid_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function ledgerEntry(): HasOne
    {
        return $this->hasOne(LedgerEntry::class);
    }

    public function whtLiability(): HasOne
    {
        return $this->hasOne(WhtLiability::class);
    }

    /** Credit account name based on payment method. */
    public function creditAccount(): string
    {
        return match ($this->method) {
            'cash' => 'CASH',
            'cheque' => 'CHEQUE',
            default => 'BANK',
        };
    }
}
