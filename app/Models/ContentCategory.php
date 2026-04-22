<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContentCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'icon',
        'parent_id',
        'sort_order',
    ];

    public function pages(): HasMany
    {
        return $this->hasMany(ContentPage::class, 'category_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ContentCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ContentCategory::class, 'parent_id');
    }
}
