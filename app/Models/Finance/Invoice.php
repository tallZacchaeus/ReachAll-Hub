<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'requisition_id',
        'vendor_id',
        'invoice_number',
        'amount_kobo',
        'received_at',
        'file_path',
        'match_status',
        'variance_kobo',
        'created_by',
    ];

    protected $casts = [
        'amount_kobo'   => 'integer',
        'variance_kobo' => 'integer',
        'received_at'   => 'date',
    ];

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isMatched(): bool
    {
        return $this->match_status === 'matched';
    }

    public function hasVariance(): bool
    {
        return $this->match_status === 'variance';
    }

    public function isBlocked(): bool
    {
        return $this->match_status === 'blocked';
    }
}
