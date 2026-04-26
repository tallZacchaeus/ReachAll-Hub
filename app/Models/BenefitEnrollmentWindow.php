<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BenefitEnrollmentWindow extends Model
{
    protected $fillable = [
        'name',
        'description',
        'open_date',
        'close_date',
        'effective_date',
        'status',
        'created_by_id',
    ];

    protected $casts = [
        'open_date' => 'date',
        'close_date' => 'date',
        'effective_date' => 'date',
    ];

    public function elections(): HasMany
    {
        return $this->hasMany(BenefitEnrollmentElection::class, 'enrollment_window_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    public function isCurrentlyOpen(): bool
    {
        $today = now()->toDateString();

        return $this->status === 'open'
            && $this->open_date->toDateString() <= $today
            && $this->close_date->toDateString() >= $today;
    }
}
