<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class JobApplication extends Model
{
    protected $fillable = [
        'job_posting_id',
        'user_id',
        'candidate_id',
        'cover_letter',
        'status',
        'stage',
        'ats_notes',
        'applied_at',
        'hired_at',
        'rejected_at',
    ];

    protected $casts = [
        'applied_at' => 'datetime',
        'hired_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function jobPosting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class);
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function interviews(): HasMany
    {
        return $this->hasMany(InterviewSchedule::class);
    }

    public function offer(): HasOne
    {
        return $this->hasOne(OfferLetter::class);
    }

    public function applicantName(): string
    {
        return $this->candidate?->name ?? $this->applicant?->name ?? 'Unknown';
    }

    public function applicantEmail(): string
    {
        return $this->candidate?->email ?? $this->applicant?->email ?? '';
    }
}
