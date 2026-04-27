import { usePage } from '@inertiajs/react';

import type { SharedData } from '@/types';
import { can, canAll, canAny, type Permission } from '@/types/permissions';

/**
 * Returns permission helpers for the currently authenticated user.
 *
 * Usage:
 *   const { can } = usePermissions();
 *   if (can('staff.enroll')) { ... }
 */
export function usePermissions() {
    const { auth } = usePage<SharedData>().props;
    const permissions: string[] = auth?.user?.permissions ?? [];

    return {
        permissions,
        can: (permission: Permission) => can(permissions, permission),
        canAll: (required: Permission[]) => canAll(permissions, required),
        canAny: (candidates: Permission[]) => canAny(permissions, candidates),
    };
}
