<?php

namespace App\Models\Finance;

use App\Models\User;
use App\Services\Finance\MoneyHelper;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PettyCashTransaction extends Model
{
    protected $fillable = [
        'float_id',
        'amount_kobo',
        'type',
        'description',
        'receipt_path',
        'account_code_id',
        'date',
        'status',
        'reconciliation_id',
        'created_by',
    ];

    protected $casts = [
        'amount_kobo' => 'integer',
        'date' => 'date',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function float(): BelongsTo
    {
        return $this->belongsTo(PettyCashFloat::class, 'float_id');
    }

    public function accountCode(): BelongsTo
    {
        return $this->belongsTo(AccountCode::class, 'account_code_id');
    }

    public function reconciliation(): BelongsTo
    {
        return $this->belongsTo(PettyCashReconciliation::class, 'reconciliation_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function amountFmt(): string
    {
        return MoneyHelper::format($this->amount_kobo);
    }

    public function isPendingRecon(): bool
    {
        return $this->status === 'pending_recon';
    }
}
