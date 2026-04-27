<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Newsletter extends Model
{
    protected $fillable = [
        'title',
        'body',
        'featured_image',
        'author_id',
        'target_audience',
        'status',
        'published_at',
    ];

    protected $casts = [
        'target_audience' => 'array',
        'published_at' => 'datetime',
    ];

    /**
     * PROD-01: MySQL 8 disallows DEFAULT on JSON columns. Provide the
     * default at the model layer instead.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'target_audience' => '{"type":"all","value":"all"}',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
