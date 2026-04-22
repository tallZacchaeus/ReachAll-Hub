<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChecklistTemplate extends Model
{
    protected $fillable = [
        'title',
        'description',
        'stage',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ChecklistItem::class)->orderBy('sort_order');
    }

    public function userChecklists(): HasMany
    {
        return $this->hasMany(UserChecklist::class);
    }
}
