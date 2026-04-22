<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KeyResult extends Model
{
    protected $fillable = [
        'objective_id',
        'title',
        'target_value',
        'current_value',
        'unit',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'target_value' => 'float',
            'current_value' => 'float',
        ];
    }

    public function objective(): BelongsTo
    {
        return $this->belongsTo(Objective::class);
    }
}
