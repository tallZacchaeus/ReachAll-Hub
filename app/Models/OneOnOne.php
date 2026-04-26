<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OneOnOne extends Model
{
    protected $fillable = [
        'manager_id',
        'employee_id',
        'scheduled_at',
        'status',
        'agenda',
        'notes',
        'action_items',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'action_items' => 'array',
    ];

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}
