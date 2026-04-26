<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CompliancePolicy extends Model
{
    protected $fillable = [
        'title', 'slug', 'category', 'description',
        'current_version', 'requires_acknowledgement', 'is_active', 'published_at',
    ];

    protected $casts = [
        'requires_acknowledgement' => 'boolean',
        'is_active' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function versions(): HasMany
    {
        return $this->hasMany(CompliancePolicyVersion::class, 'policy_id');
    }

    public function acknowledgements(): HasMany
    {
        return $this->hasMany(CompliancePolicyAcknowledgement::class, 'policy_id');
    }

    public function currentVersionRecord(): HasOne
    {
        return $this->hasOne(CompliancePolicyVersion::class, 'policy_id')
            ->where('version', $this->current_version ?? '');
    }

    public function isAcknowledgedBy(User $user): bool
    {
        if (! $this->current_version) {
            return true;
        }

        return $this->acknowledgements()
            ->whereHas('policyVersion', fn ($q) => $q->where('version', $this->current_version))
            ->where('user_id', $user->id)
            ->exists();
    }
}
