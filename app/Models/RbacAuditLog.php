<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RbacAuditLog extends Model
{
    public const UPDATED_AT = null; // immutable — no updated_at column

    protected $fillable = [
        'actor_id',
        'action',
        'target_type',
        'target_id',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Record a RBAC change. Never throws — a logging failure must not block the operation.
     */
    public static function record(
        int $actorId,
        string $action,
        string $targetType,
        string $targetId,
        mixed $oldValue = null,
        mixed $newValue = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): void {
        try {
            static::create([
                'actor_id'    => $actorId,
                'action'      => $action,
                'target_type' => $targetType,
                'target_id'   => $targetId,
                'old_value'   => $oldValue,
                'new_value'   => $newValue,
                'ip_address'  => $ipAddress,
                'user_agent'  => $userAgent,
            ]);
        } catch (\Throwable) {
            // Silently swallow — audit log failure must not interrupt the primary operation.
        }
    }
}
