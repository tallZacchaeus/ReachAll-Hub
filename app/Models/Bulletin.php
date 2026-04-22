<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bulletin extends Model
{
    protected $fillable = [
        'title',
        'body',
        'priority',
        'author_id',
        'is_pinned',
        'expires_at',
        'is_published',
        'published_at',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_published' => 'boolean',
        'expires_at' => 'date',
        'published_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** Scope: active bulletins visible to staff */
    public function scopeActive($query)
    {
        return $query
            ->where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now()->toDateString());
            });
    }

    /** Order: pinned first, then urgent > important > info, then newest */
    public function scopeOrdered($query)
    {
        return $query
            ->orderByDesc('is_pinned')
            ->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'important' THEN 2 ELSE 3 END")
            ->orderByDesc('created_at');
    }
}
