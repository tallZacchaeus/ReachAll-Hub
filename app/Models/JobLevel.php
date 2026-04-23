<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobLevel extends Model
{
    protected $fillable = ['code', 'name', 'description', 'sort_order'];

    public function positions(): HasMany
    {
        return $this->hasMany(JobPosition::class, 'job_level_id');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
