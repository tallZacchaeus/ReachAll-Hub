<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class DataSubjectRequest extends Model
{
    protected $fillable = [
        'request_number', 'user_id', 'handled_by_id', 'type',
        'description', 'status', 'response', 'due_at',
        'acknowledged_at', 'completed_at',
    ];

    protected $casts = [
        'due_at'           => 'datetime',
        'acknowledged_at'  => 'datetime',
        'completed_at'     => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (DataSubjectRequest $dsr) {
            if (empty($dsr->request_number)) {
                $dsr->request_number = static::generateRequestNumber();
            }
            if (empty($dsr->due_at)) {
                $dsr->due_at = now()->addDays(30);
            }
        });
    }

    private static function generateRequestNumber(): string
    {
        $year = now()->year;
        $last = DB::table('data_subject_requests')
            ->where('request_number', 'like', "DSR-{$year}-%")
            ->count();

        return sprintf('DSR-%d-%04d', $year, $last + 1);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function handledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by_id');
    }

    public function isOverdue(): bool
    {
        return $this->due_at !== null
            && $this->due_at->isPast()
            && ! in_array($this->status, ['completed', 'rejected', 'withdrawn']);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['pending', 'acknowledged', 'in_progress']);
    }
}
