export interface AuditLogEntry {
    id: number;
    actor: { id: number; name: string; employee_id: string } | null;
    module: string;
    action: string;
    subject_type: string | null;
    subject_id: number | null;
    created_at: string;
}
