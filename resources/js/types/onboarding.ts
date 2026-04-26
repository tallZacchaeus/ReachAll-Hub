export type TaskType =
    | 'document_upload'
    | 'policy_ack'
    | 'equipment_request'
    | 'it_access'
    | 'bank_details'
    | 'compliance_doc';

export type TaskStatus = 'pending' | 'completed' | 'waived';

export interface PreboardingTask {
    id: number;
    task_type: TaskType;
    title: string;
    description: string | null;
    status: TaskStatus;
    due_date: string | null;
    completed_at: string | null;
    completed_by: { id: number; name: string } | null;
    notes: string | null;
}

export interface PreboardingOffer {
    id: number;
    candidate: { id: number | null; name: string };
    position_title: string;
    start_date: string | null;
    tasks_total: number;
    tasks_completed: number;
    status: string;
    updated_at?: string;
}

export interface PreboardingDetailOffer {
    id: number;
    candidate: { id: number | null; name: string };
    position_title: string;
    start_date: string | null;
    status: string;
}
