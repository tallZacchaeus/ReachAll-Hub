<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplianceDocument extends Model
{
    protected $fillable = [
        'user_id', 'type', 'document_number', 'country_of_issue',
        'issued_at', 'expires_at', 'status', 'verified_by_id',
        'verified_at', 'file_path', 'file_disk', 'notes',
    ];

    protected $casts = [
        'issued_at' => 'date',
        'expires_at' => 'date',
        'verified_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isExpiringSoon(int $days = 60): bool
    {
        return $this->expires_at !== null
            && ! $this->isExpired()
            && now()->diffInDays($this->expires_at) <= $days;
    }

    public function isVerified(): bool
    {
        return $this->status === 'active';
    }
}
