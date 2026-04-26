<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'leave_type_id',
        'year',
        'entitled_days',
        'used_days',
        'carried_over_days',
    ];

    protected function casts(): array
    {
        return [
            'entitled_days' => 'decimal:1',
            'used_days' => 'decimal:1',
            'carried_over_days' => 'decimal:1',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    /**
     * Remaining days available = entitled + carried_over - used (floored at 0).
     */
    public function getRemainingAttribute(): float
    {
        return max(0.0, (float) $this->entitled_days + (float) $this->carried_over_days - (float) $this->used_days);
    }
}
