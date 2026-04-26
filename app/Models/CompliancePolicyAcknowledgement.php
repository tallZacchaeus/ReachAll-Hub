<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompliancePolicyAcknowledgement extends Model
{
    protected $fillable = [
        'policy_id', 'policy_version_id', 'user_id', 'acknowledged_at', 'ip_address', 'reminded_at',
    ];

    protected $casts = [
        'acknowledged_at' => 'datetime',
        'reminded_at'     => 'datetime',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(CompliancePolicy::class);
    }

    public function policyVersion(): BelongsTo
    {
        return $this->belongsTo(CompliancePolicyVersion::class, 'policy_version_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
