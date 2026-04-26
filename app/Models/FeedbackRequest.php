<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeedbackRequest extends Model
{
    protected $fillable = [
        'requester_id',
        'subject_id',
        'review_cycle_id',
        'type',
        'message',
        'due_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subject_id');
    }

    public function reviewCycle(): BelongsTo
    {
        return $this->belongsTo(ReviewCycle::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(FeedbackResponse::class);
    }

    /**
     * Compute average rating per competency slug across all submitted responses.
     * Anonymous responses are included in averages but respondent identity is not exposed.
     *
     * @return array<string, float>
     */
    public function aggregatedRatings(): array
    {
        $submitted = $this->responses()
            ->whereNotNull('submitted_at')
            ->whereNotNull('ratings')
            ->get();

        if ($submitted->isEmpty()) {
            return [];
        }

        $totals = [];
        $counts = [];

        foreach ($submitted as $response) {
            $ratings = $response->ratings ?? [];
            foreach ($ratings as $slug => $value) {
                if (! isset($totals[$slug])) {
                    $totals[$slug] = 0;
                    $counts[$slug] = 0;
                }
                $totals[$slug] += (int) $value;
                $counts[$slug]++;
            }
        }

        $averages = [];
        foreach ($totals as $slug => $total) {
            $averages[$slug] = $counts[$slug] > 0
                ? round($total / $counts[$slug], 2)
                : 0.0;
        }

        return $averages;
    }

    /**
     * Overall average rating across all submitted responses.
     */
    public function overallAverage(): ?float
    {
        $submitted = $this->responses()
            ->whereNotNull('submitted_at')
            ->whereNotNull('overall_rating')
            ->get();

        if ($submitted->isEmpty()) {
            return null;
        }

        return round($submitted->avg('overall_rating'), 2);
    }
}
