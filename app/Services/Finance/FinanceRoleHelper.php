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
     * Roles with full Finance admin access (validate, record payments, run reports).
     */
    public const FINANCE_ADMIN_ROLES = ['finance', 'superadmin'];

    /**
     * All roles that may access the Finance module (read-only or above).
     */
    public const FINANCE_ACCESS_ROLES = [
        'finance',
        'superadmin',
        'ceo',
        'general_management',
        'management',
        'dept_head',
        'staff',
        'hr',
    ];

    /**
     * Executive roles — can see org-wide dashboards and override budgets.
     */
    public const FINANCE_EXEC_ROLES = ['ceo', 'general_management', 'management'];

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
