<?php

namespace App\Models\Finance;

use App\Models\User;
use App\Services\Finance\MoneyHelper;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PettyCashFloat extends Model
{
    protected $fillable = [
        'custodian_id',
        'float_limit_kobo',
        'current_balance_kobo',
        'low_alert_threshold',
        'last_reconciled_at',
        'status',
        'created_by',
    ];

    protected $casts = [
        'float_limit_kobo' => 'integer',
        'current_balance_kobo' => 'integer',
        'low_alert_threshold' => 'integer',
        'last_reconciled_at' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function custodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'custodian_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PettyCashTransaction::class, 'float_id')->orderByDesc('date');
    }

    public function reconciliations(): HasMany
    {
        return $this->hasMany(PettyCashReconciliation::class, 'float_id')->orderByDesc('created_at');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function balancePercentage(): float
    {
        if ($this->float_limit_kobo === 0) {
            return 0;
        }

        return round(($this->current_balance_kobo / $this->float_limit_kobo) * 100, 1);
    }

    public function isLowBalance(): bool
    {
        return $this->balancePercentage() <= $this->low_alert_threshold;
    }

    public function daysSinceReconciliation(): int
    {
        $reference = $this->last_reconciled_at ?? $this->created_at;
        // Explicit parse to date-only strings avoids fractional-day truncation
        $refDate = \Carbon\CarbonImmutable::parse($reference->toDateString())->startOfDay();
        $todayDate = \Carbon\CarbonImmutable::today()->startOfDay();

        return (int) floor(($todayDate->getTimestamp() - $refDate->getTimestamp()) / 86400);
    }

    public function limitFmt(): string
    {
        return MoneyHelper::format($this->float_limit_kobo);
    }

    public function balanceFmt(): string
    {
        return MoneyHelper::format($this->current_balance_kobo);
    }
}
