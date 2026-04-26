<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeLifecycleEvent extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'event_type', 'effective_date',
        'old_values', 'new_values', 'notes', 'recorded_by_id',
    ];

    protected function casts(): array
    {
        return [
            'effective_date' => 'date',
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_id');
    }

    public static function record(
        int $userId,
        string $eventType,
        \DateTimeInterface|string $effectiveDate,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $notes = null,
        ?int $recordedById = null,
    ): void {
        try {
            static::create([
                'user_id' => $userId,
                'event_type' => $eventType,
                'effective_date' => $effectiveDate,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'notes' => $notes,
                'recorded_by_id' => $recordedById,
            ]);
        } catch (\Throwable) {
            // Never let audit failures cascade to the caller
        }
    }
}
