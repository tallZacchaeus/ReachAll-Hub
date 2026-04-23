export type DocumentType =
    | 'visa'
    | 'work_permit'
    | 'right_to_work'
    | 'passport'
    | 'national_id'
    | 'residence_permit';

export type DocumentStatus = 'pending' | 'active' | 'rejected' | 'expired';

export type DsrType =
    | 'access'
    | 'rectification'
    | 'erasure'
    | 'restriction'
    | 'portability'
    | 'objection';

export type DsrStatus =
    | 'pending'
    | 'acknowledged'
    | 'in_progress'
    | 'completed'
    | 'rejected'
    | 'withdrawn';

export type TrainingCategory =
    | 'data_protection'
    | 'health_safety'
    | 'anti_bribery'
    | 'code_of_conduct'
    | 'cybersecurity'
    | 'general';

export type AssignmentStatus = 'pending' | 'completed' | 'overdue' | 'waived';

export type PolicyCategory = 'hr' | 'it' | 'finance' | 'safety' | 'ethics' | 'general';

export interface ComplianceDocumentRow {
    id: number;
    user_id: number;
    user: { id: number; name: string; employee_id: string } | null;
    type: DocumentType;
    document_number: string | null;
    country_of_issue: string | null;
    issued_at: string | null;
    expires_at: string | null;
    status: DocumentStatus;
    verified_by: { id: number; name: string } | null;
    verified_at: string | null;
    file_path: string | null;
    notes: string | null;
    created_at: string;
}

export interface DataSubjectRequestRow {
    id: number;
    request_number: string;
    user: { id: number; name: string; employee_id: string } | null;
    handled_by: { id: number; name: string } | null;
    type: DsrType;
    description: string;
    status: DsrStatus;
    response: string | null;
    due_at: string | null;
    acknowledged_at: string | null;
    completed_at: string | null;
    created_at: string;
}

export interface ComplianceTrainingRow {
    id: number;
    title: string;
    description: string | null;
    category: TrainingCategory;
    is_mandatory: boolean;
    duration_minutes: number | null;
    content_url: string | null;
    recurrence_months: number | null;
    is_active: boolean;
    assignments_count?: number;
    created_at: string;
}

export interface TrainingAssignmentRow {
    id: number;
    training: { id: number; title: string; category: TrainingCategory };
    user: { id: number; name: string; employee_id: string } | null;
    due_at: string;
    completed_at: string | null;
    status: AssignmentStatus;
    completion_notes: string | null;
    created_at: string;
}

export interface CompliancePolicyRow {
    id: number;
    title: string;
    slug: string;
    category: PolicyCategory;
    description: string | null;
    current_version: string | null;
    requires_acknowledgement: boolean;
    is_active: boolean;
    published_at: string | null;
    versions_count?: number;
    acknowledged?: boolean;
    created_at: string;
}

export interface PolicyVersionRow {
    id: number;
    policy_id: number;
    version: string;
    content: string;
    published_by: { id: number; name: string } | null;
    published_at: string | null;
    created_at: string;
}
