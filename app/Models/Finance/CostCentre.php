<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CostCentre extends Model
{
    protected $fillable = [
        'code',
        'name',
        'parent_id',
        'head_user_id',
        'budget_kobo',
        'status',
        'created_by',
    ];

    protected $casts = [
        'budget_kobo' => 'integer',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(CostCentre::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(CostCentre::class, 'parent_id');
    }

    public function head(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    /** Depth: 0 = root, 1 = child, 2 = grandchild */
    public function getDepthAttribute(): int
    {
        if (! $this->parent_id) {
            return 0;
        }
        if (! $this->parent?->parent_id) {
            return 1;
        }

        return 2;
    }
}
