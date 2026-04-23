<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewScorecard extends Model
{
    protected $fillable = [
        'interview_schedule_id',
        'evaluator_id',
        'overall_rating',
        'technical_rating',
        'communication_rating',
        'culture_fit_rating',
        'strengths',
        'concerns',
        'recommendation',
        'notes',
    ];

    protected $casts = [
        'overall_rating'       => 'integer',
        'technical_rating'     => 'integer',
        'communication_rating' => 'integer',
        'culture_fit_rating'   => 'integer',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(InterviewSchedule::class, 'interview_schedule_id');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function isRecommended(): bool
    {
        return in_array($this->recommendation, ['strong_yes', 'yes'], true);
    }
}
