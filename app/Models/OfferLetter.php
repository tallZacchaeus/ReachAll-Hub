<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OfferLetter extends Model
{
    protected $fillable = [
        'job_application_id',
        'offered_salary_kobo',
        'start_date',
        'offer_date',
        'expiry_date',
        'status',
        'document_path',
        'document_disk',
        'notes',
        'created_by_id',
        'sent_at',
        'responded_at',
    ];

    protected $casts = [
        'offered_salary_kobo' => 'integer',
        'start_date'          => 'date',
        'offer_date'          => 'date',
        'expiry_date'         => 'date',
        'sent_at'             => 'datetime',
        'responded_at'        => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function preboarding_tasks(): HasMany
    {
        return $this->hasMany(PreboardingTask::class, 'offer_letter_id')->orderBy('due_date');
    }

    public function offeredSalaryNaira(): float
    {
        return $this->offered_salary_kobo / 100;
    }

    public function isPending(): bool
    {
        return in_array($this->status, ['draft', 'sent'], true);
    }

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }
}
