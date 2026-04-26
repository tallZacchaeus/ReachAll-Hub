<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseReceipt extends Model
{
    protected $fillable = [
        'expense_claim_id',
        'file_path',
        'disk',
        'original_filename',
        'mime_type',
        'file_size_bytes',
        'description',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function expenseClaim(): BelongsTo
    {
        return $this->belongsTo(ExpenseClaim::class, 'expense_claim_id');
    }
}
