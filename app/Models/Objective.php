<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Objective extends Model
{
    protected $fillable = [
        'title',
        'description',
        'owner_user_id',
        'department',
        'period',
        'status',
        'progress',
        'parent_id',
    ];

    public function keyResults(): HasMany
    {
        return $this->hasMany(KeyResult::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Objective::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Objective::class, 'parent_id');
    }

    public function recalculateProgress(): void
    {
        $krs = $this->keyResults()->get();

        if ($krs->isEmpty()) {
            return;
        }

        $totalProgress = $krs->sum(function (KeyResult $kr): float {
            if ($kr->target_value == 0) {
                return 0;
            }

            return min(100, ($kr->current_value / $kr->target_value) * 100);
        });

        $this->update(['progress' => (int) round($totalProgress / $krs->count())]);
    }
}
