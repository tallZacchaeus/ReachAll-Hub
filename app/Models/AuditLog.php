<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class AuditLog extends Model
{
    /** This table is append-only — no updated_at. */
    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $fillable = [
        'actor_id',
        'module',
        'action',
        'subject_type',
        'subject_id',
        'old_json',
        'new_json',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_json' => 'array',
        'new_json' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::updating(function (): never {
            throw new LogicException('Audit log entries are immutable and cannot be updated.');
        });

        static::deleting(function (): never {
            throw new LogicException('Audit log entries are immutable and cannot be deleted.');
        });
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
