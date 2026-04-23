<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class HrCase extends Model
{
    protected $fillable = [
        'case_number',
        'type',
        'subject',
        'description',
        'status',
        'priority',
        'confidential',
        'reported_by_id',
        'assigned_to_id',
        'outcome',
        'resolved_at',
        'closed_at',
    ];

    protected $casts = [
        'confidential' => 'boolean',
        'resolved_at'  => 'datetime',
        'closed_at'    => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (HrCase $case) {
            if (empty($case->case_number)) {
                $case->case_number = static::generateCaseNumber();
            }
        });
    }

    private static function generateCaseNumber(): string
    {
        $year = now()->year;
        $last = DB::table('hr_cases')
            ->where('case_number', 'like', "ER-{$year}-%")
            ->count();

        return sprintf('ER-%d-%04d', $year, $last + 1);
    }

    public function reportedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by_id');
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    public function parties(): HasMany
    {
        return $this->hasMany(HrCaseParty::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(HrCaseNote::class)->latest();
    }

    public function publicNotes(): HasMany
    {
        return $this->hasMany(HrCaseNote::class)->where('is_internal', false)->latest();
    }

    public function isOpen(): bool
    {
        return !in_array($this->status, ['resolved', 'closed', 'dismissed'], true);
    }

    public function isConfidential(): bool
    {
        return $this->confidential;
    }
}
