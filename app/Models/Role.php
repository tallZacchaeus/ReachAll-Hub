<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name', 'label', 'description', 'is_system', 'feature_flags'];

    protected $casts = [
        'is_system' => 'boolean',
        'feature_flags' => 'array',
    ];

    /** Permissions assigned to this role via role_permissions (joined on role slug). */
    public function permissions(): Collection
    {
        return Permission::whereIn('id', function ($q) {
            $q->select('permission_id')
                ->from('role_permissions')
                ->where('role', $this->name);
        })->get();
    }

    /** Scope to non-system (deletable) roles. */
    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }

    public function isDeletable(): bool
    {
        return ! $this->is_system;
    }
}
