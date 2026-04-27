<?php

namespace App\Services\Finance;

use App\Models\User;

/**
 * SEC-01: Thin wrapper around the dynamic permission system.
 *
 * Pre-SEC-01 this class held hardcoded role-string arrays
 * (FINANCE_ADMIN_ROLES, FINANCE_EXEC_ROLES, etc.) and was the source of
 * truth for who could do what in Finance. That made the dynamic
 * permission system not actually dynamic — a new role created via the
 * role-management UI got no Finance access until a developer edited
 * the constants here.
 *
 * The class now resolves every check through User::hasPermission(),
 * which reads the cached role→permission map from PermissionService.
 * Adding `finance.admin` / `finance.exec` to a new role via
 * /admin/roles is enough to grant access. Constants are retained
 * (same names, same values) only to keep external consumers — most
 * notably tests/Feature/Sprint4RegressionTest.php — passing through
 * one release; a follow-up PR will delete them entirely.
 *
 * @deprecated Use $user->hasPermission('finance.admin' | 'finance.exec' |
 *             'finance.access' | 'finance.reports') directly. This shim
 *             will be removed in a follow-up PR.
 */
class FinanceRoleHelper
{
    /** @deprecated kept for one-release backward compatibility */
    public const FINANCE_ADMIN_ROLES = ['finance', 'general_management', 'ceo', 'superadmin'];

    /** @deprecated kept for one-release backward compatibility */
    public const FINANCE_ACCESS_ROLES = [
        'finance',
        'general_management',
        'ceo',
        'superadmin',
        'management',
        'dept_head',
        'staff',
        'hr',
    ];

    /** @deprecated kept for one-release backward compatibility */
    public const FINANCE_EXEC_ROLES = ['general_management', 'ceo', 'superadmin'];

    /** @deprecated kept for one-release backward compatibility */
    public const APPROVAL_ROLES = ['management', 'hr', 'finance', 'general_management', 'ceo', 'superadmin'];

    /** @deprecated kept for one-release backward compatibility */
    public const FINANCE_REPORT_ROLES = [
        'finance',
        'ceo',
        'superadmin',
        'management',
        'general_management',
        'hr',
    ];

    /**
     * True if the user can perform Finance admin actions
     * (validate payments, run reconciliations, manage matching).
     *
     * Resolves via permission `finance.admin`.
     */
    public static function isAdmin(User|string|null $user): bool
    {
        return self::resolve($user, 'finance.admin', self::FINANCE_ADMIN_ROLES);
    }

    /**
     * True if the user has any Finance module access (read or write).
     *
     * Resolves via permission `finance.access`.
     */
    public static function hasAccess(User|string|null $user): bool
    {
        return self::resolve($user, 'finance.access', self::FINANCE_ACCESS_ROLES);
    }

    /**
     * True if the user holds executive-tier Finance authority
     * (co-authorise period close, accept variances).
     *
     * Resolves via permission `finance.exec`.
     */
    public static function isExec(User|string|null $user): bool
    {
        return self::resolve($user, 'finance.exec', self::FINANCE_EXEC_ROLES);
    }

    /**
     * Hybrid resolver. If a User is supplied we go through the dynamic
     * permission system. If only a role string is supplied (legacy call
     * sites in tests / outside HTTP context) we fall back to the
     * frozen role-array list — this keeps Sprint4RegressionTest green
     * without sacrificing the dynamic behaviour for live requests.
     */
    private static function resolve(User|string|null $user, string $permission, array $fallbackRoles): bool
    {
        if ($user instanceof User) {
            return $user->hasPermission($permission);
        }

        if (is_string($user)) {
            return \in_array($user, $fallbackRoles, true);
        }

        return false;
    }
}
