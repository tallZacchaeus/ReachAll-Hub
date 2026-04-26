<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackResponse extends Model
{
    protected $fillable = [
        'feedback_request_id',
        'respondent_id',
        'is_anonymous',
        'ratings',
        'strengths',
        'improvements',
        'overall_rating',
        'submitted_at',
    ];

    protected $casts = [
        'ratings'      => 'array',
        'submitted_at' => 'datetime',
        'is_anonymous' => 'boolean',
    ];

    public function feedbackRequest(): BelongsTo
    {
        return $this->belongsTo(FeedbackRequest::class);
    }

    public function respondent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'respondent_id');
    }

    /**
     * Override toArray to strip respondent identity when is_anonymous = true.
     * CRITICAL privacy rule: anonymous respondents must never be exposed in
     * serialised output, including Inertia props.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = parent::toArray();

        if ($this->is_anonymous) {
            $data['respondent_id'] = null;
            unset($data['respondent']);
        }

        return $data;
    }
}
