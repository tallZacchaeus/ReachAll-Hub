<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContentPage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'body',
        'category_id',
        'stage_visibility',
        'is_published',
        'author_id',
        'featured_image',
        'attachments',
        'requires_acknowledgement',
        'acknowledgement_deadline',
        'published_at',
    ];

    protected $casts = [
        'stage_visibility' => 'array',
        'attachments' => 'array',
        'is_published' => 'boolean',
        'requires_acknowledgement' => 'boolean',
        'acknowledgement_deadline' => 'date',
        'published_at' => 'datetime',
    ];

    /**
     * PROD-01: MySQL 8 disallows DEFAULT on JSON columns. Provide the
     * default at the model layer instead so newly-created rows still get
     * the all-stages visibility unless overridden.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'stage_visibility' => '["joiner","performer","leader"]',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ContentCategory::class, 'category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function acknowledgements(): HasMany
    {
        return $this->hasMany(PolicyAcknowledgement::class, 'content_page_id');
    }
}
