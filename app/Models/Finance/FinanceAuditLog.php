<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceAuditLog extends Model
{
    // Append-only — no updates, no deletes
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'model_type',
        'model_id',
        'action',
        'before_json',
        'after_json',
        'logged_at',
    ];

    protected $casts = [
        'before_json' => 'array',
        'after_json'  => 'array',
        'logged_at'   => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Block updates and deletes — this model is append-only */
    public static function boot(): void
    {
        parent::boot();

        static::updating(function () {
            throw new \LogicException('Audit log entries are immutable and cannot be updated.');
        });

        static::deleting(function () {
            throw new \LogicException('Audit log entries are immutable and cannot be deleted.');
        });
    }
}
