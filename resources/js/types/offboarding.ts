export type OffboardingTaskType =
    | 'exit_interview'
    | 'equipment_return'
    | 'access_revocation'
    | 'final_payroll'
    | 'document_handover'
    | 'clearance_form'
    | 'hr_clearance'
    | 'finance_clearance';

export type OffboardingTaskStatus = 'pending' | 'completed' | 'waived';
export type OffboardingStatus = 'initiated' | 'in_progress' | 'completed';

export interface OffboardingTaskUser {
    id: number;
    name: string;
}

export interface OffboardingTask {
    id: number;
    task_type: OffboardingTaskType;
    title: string;
    description: string | null;
    status: OffboardingTaskStatus;
    completed_at: string | null;
    notes: string | null;
    sort_order: number;
    completed_by: OffboardingTaskUser | null;
    assigned_to: OffboardingTaskUser | null;
}

export interface OffboardingChecklistUser {
    id: number;
    name: string;
    employee_id: string;
    department?: string;
    position?: string;
}

export interface OffboardingChecklist {
    id: number;
    user: OffboardingChecklistUser;
    initiated_by: OffboardingTaskUser | null;
    termination_date: string | null;
    reason: string | null;
    status: OffboardingStatus;
    exit_interview_completed_at: string | null;
    clearance_signed_at: string | null;
    notes: string | null;
    tasks: OffboardingTask[];
    completion_percentage: number;
}

export interface OffboardingChecklistSummary {
    id: number;
    status: OffboardingStatus;
    termination_date: string | null;
    completion_percentage: number;
    tasks_count: number;
    completed_tasks_count: number;
    user: OffboardingChecklistUser;
}
