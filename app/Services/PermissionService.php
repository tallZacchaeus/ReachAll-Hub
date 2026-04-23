<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Central permission resolution service.
 *
 * Caches the role → permission map so every request does at most one
 * DB query. Cache is busted whenever role_permissions are modified.
 */
class PermissionService
{
    private const CACHE_KEY    = 'rbac:role_permissions';
    private const CACHE_TTL    = 3600; // 1 hour

    /**
     * Return true if the given role slug has the named permission.
     * Superadmin always returns true before this is called (see User::hasPermission).
     */
    public static function roleHasPermission(string $role, string $permission): bool
    {
        return in_array($permission, self::permissionsForRole($role), true);
    }

    /**
     * Return all permission names for a role slug.
     *
     * @return list<string>
     */
    public static function permissionsForRole(string $role): array
    {
        $map = self::loadMap();

        return $map[$role] ?? [];
    }

    /**
     * Return the full role → permissions map (cached).
     *
     * @return array<string, list<string>>
     */
    public static function loadMap(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $rows = DB::table('role_permissions as rp')
                ->join('permissions as p', 'p.id', '=', 'rp.permission_id')
                ->select('rp.role', 'p.name as permission')
                ->get();

            $map = [];
            foreach ($rows as $row) {
                $map[$row->role][] = $row->permission;
            }

            return $map;
        });
    }

    /** Bust the cache — call after any role_permission insert/delete. */
    public static function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
