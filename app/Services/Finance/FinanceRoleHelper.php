<?php

namespace App\Services\Finance;

/**
 * CAT1-03: Single source of truth for Finance module role groupings.
 *
 * Use these constants instead of scattering inline role arrays across
 * controllers. When new roles are added, update here only.
 */
class FinanceRoleHelper
{
    /**
     * A1-01: Roles with full Finance admin access (validate, record payments,
     * run reports, access matching/payment/period-close pages).
     * Includes general_management — previously missing, causing 403 for GM users.
     */
    public const FINANCE_ADMIN_ROLES = ['finance', 'general_management', 'ceo', 'superadmin'];

    /**
     * All roles that may access the Finance module (read-only or above).
     */
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

    /**
     * Executive roles — can co-authorise period close/reopen and accept variances.
     */
    public const FINANCE_EXEC_ROLES = ['general_management', 'ceo', 'superadmin'];

    /**
     * Roles that participate in approval chains.
     */
    public const APPROVAL_ROLES = ['management', 'hr', 'finance', 'general_management', 'ceo', 'superadmin'];

    /**
     * Roles allowed to view Finance reports.
     */
    public const FINANCE_REPORT_ROLES = [
        'finance',
        'ceo',
        'superadmin',
        'management',
        'general_management',
        'hr',
    ];

    /**
     * Return true if the given role is a Finance admin.
     */
    public static function isAdmin(string $role): bool
    {
        return \in_array($role, self::FINANCE_ADMIN_ROLES, true);
    }

    /**
     * Return true if the given role has any Finance access.
     */
    public static function hasAccess(string $role): bool
    {
        return \in_array($role, self::FINANCE_ACCESS_ROLES, true);
    }

    /**
     * Return true if the given role is an executive role.
     */
    public static function isExec(string $role): bool
    {
        return \in_array($role, self::FINANCE_EXEC_ROLES, true);
    }
}
