<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComplianceTraining extends Model
{
    protected $fillable = [
        'title', 'description', 'category', 'is_mandatory',
        'duration_minutes', 'content_url', 'recurrence_months', 'is_active',
    ];

    protected $casts = [
        'is_mandatory'       => 'boolean',
        'is_active'          => 'boolean',
        'duration_minutes'   => 'integer',
        'recurrence_months'  => 'integer',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(ComplianceTrainingAssignment::class, 'training_id');
    }

    public function isRecurring(): bool
    {
        return $this->recurrence_months !== null;
    }
}
