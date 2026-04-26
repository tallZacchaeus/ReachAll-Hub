<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreboardingTask extends Model
{
    protected $fillable = [
        'offer_letter_id',
        'user_id',
        'task_type',
        'title',
        'description',
        'status',
        'due_date',
        'completed_at',
        'completed_by_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function offerLetter(): BelongsTo
    {
        return $this->belongsTo(OfferLetter::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by_id');
    }
}
