<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentCategory extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'requires_signature',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'requires_signature' => 'boolean',
        'is_active'          => 'boolean',
        'sort_order'         => 'integer',
    ];

    public function documents(): HasMany
    {
        return $this->hasMany(HrDocument::class, 'category_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
