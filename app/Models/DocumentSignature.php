<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentSignature extends Model
{
    // Immutable audit record — no updated_at
    public const UPDATED_AT = null;

    protected $fillable = [
        'document_id',
        'signee_id',
        'status',
        'signed_at',
        'declined_at',
        'ip_address',
        'user_agent',
        'decline_reason',
    ];

    protected $casts = [
        'signed_at'   => 'datetime',
        'declined_at' => 'datetime',
        'created_at'  => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(HrDocument::class, 'document_id');
    }

    public function signee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signee_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isSigned(): bool
    {
        return $this->status === 'signed';
    }
}
