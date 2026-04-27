<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'title',
        'description',
        'type',
        'stage_visibility',
        'category',
        'content',
        'duration_minutes',
        'is_published',
    ];

    protected $casts = [
        'stage_visibility' => 'array',
        'is_published' => 'boolean',
        'duration_minutes' => 'integer',
    ];

    /**
     * PROD-01: MySQL 8 disallows DEFAULT on JSON columns. Provide the
     * default at the model layer instead.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'stage_visibility' => '["joiner","performer","leader"]',
    ];

    public function enrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }
}
