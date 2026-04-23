<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompliancePolicyVersion extends Model
{
    protected $fillable = [
        'policy_id', 'version', 'content', 'published_by_id', 'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(CompliancePolicy::class);
    }

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by_id');
    }

    public function acknowledgements(): HasMany
    {
        return $this->hasMany(CompliancePolicyAcknowledgement::class, 'policy_version_id');
    }
}
