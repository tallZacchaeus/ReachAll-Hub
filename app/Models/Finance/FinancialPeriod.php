<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialPeriod extends Model
{
    protected $fillable = [
        'year',
        'month',
        'status',
        'opened_at',
        'closed_at',
        'closed_by',
        'close_initiated_by',
        'close_initiated_at',
        'co_authorized_by',
        'co_authorized_at',
        'close_report_path',
    ];

    protected $casts = [
        'opened_at'          => 'datetime',
        'closed_at'          => 'datetime',
        'close_initiated_at' => 'datetime',
        'co_authorized_at'   => 'datetime',
        'year'               => 'integer',
        'month'              => 'integer',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function closeInitiatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'close_initiated_by');
    }

    public function coAuthorizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'co_authorized_by');
    }

    public function waivers(): HasMany
    {
        return $this->hasMany(PeriodCloseWaiver::class);
    }

    // ── Scopes ───────────────────────────────────────────────────────────────

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    public function isClosing(): bool
    {
        return $this->status === 'closing';
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    public function getLabel(): string
    {
        return date('F Y', mktime(0, 0, 0, $this->month, 1, $this->year));
    }

    /**
     * Returns the FinancialPeriod whose window covers the given date, or null.
     */
    public static function forDate(\DateTimeInterface $date): ?self
    {
        return self::where('year', (int) $date->format('Y'))
            ->where('month', (int) $date->format('n'))
            ->first();
    }
}
