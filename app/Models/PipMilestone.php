<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PipMilestone extends Model
{
    protected $fillable = [
        'pip_plan_id',
        'title',
        'description',
        'due_date',
        'status',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'completed_at' => 'datetime',
    ];

    public function pipPlan(): BelongsTo
    {
        return $this->belongsTo(PipPlan::class);
    }
}
