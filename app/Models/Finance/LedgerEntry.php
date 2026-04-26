<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LedgerEntry extends Model
{
    protected $fillable = [
        'requisition_id',
        'payment_id',
        'debit_account',
        'credit_account',
        'amount_kobo',
        'wht_kobo',
        'description',
        'posted_at',
        'created_by',
    ];

    protected $casts = [
        'amount_kobo' => 'integer',
        'wht_kobo' => 'integer',
        'posted_at' => 'datetime',
    ];

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
