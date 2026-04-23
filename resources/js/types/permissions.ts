// All named permissions in the system.
// Keep in sync with RolesAndPermissionsSeeder::PERMISSIONS.

export type Permission =
    // Core / HR
    | 'admin.dashboard'
    | 'staff.enroll'
    | 'staff.overview'
    | 'attendance.upload'
    | 'attendance.view-all'
    | 'leave.review'
    | 'requests.review'
    | 'tasks.manage'
    | 'chat.admin'
    | 'profile.review'
    | 'content.manage'
    | 'okr.manage'
    | 'jobs.manage'
    | 'learning.manage'
    | 'checklist.manage'
    | 'reports.view'
    | 'recognition.admin'
    | 'evaluations.admin'
    | 'announcements.manage'
    | 'team.dashboard'
    | 'roles.manage'
    | 'org.manage'
    // Finance
    | 'finance.access'
    | 'finance.admin'
    | 'finance.exec'
    | 'finance.reports'
    | 'finance.period-close'
    | 'finance.go-live';

/** Check whether a permissions array contains a given permission. */
export function can(permissions: string[], permission: Permission): boolean {
    return permissions.includes(permission);
}

/** Check whether a permissions array contains ALL of the listed permissions. */
export function canAll(permissions: string[], required: Permission[]): boolean {
    return required.every((p) => permissions.includes(p));
}

/** Check whether a permissions array contains ANY of the listed permissions. */
export function canAny(permissions: string[], candidates: Permission[]): boolean {
    return candidates.some((p) => permissions.includes(p));
}
