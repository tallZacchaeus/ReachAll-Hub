<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'source',
        'current_company',
        'current_title',
        'linkedin_url',
        'resume_path',
        'resume_disk',
        'status',
        'notes',
        'added_by_id',
    ];

    public function addedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
