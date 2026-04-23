// ── Employee Relations / Case Management types ────────────────────────────────

export type CaseType =
    | 'helpdesk'
    | 'grievance'
    | 'whistleblower'
    | 'disciplinary'
    | 'investigation';

export type CaseStatus =
    | 'open'
    | 'under_review'
    | 'investigating'
    | 'pending_action'
    | 'resolved'
    | 'closed'
    | 'dismissed';

export type CasePriority = 'low' | 'normal' | 'high' | 'urgent';

export type PartyRole = 'complainant' | 'respondent' | 'witness' | 'investigator';

// ── Entities ─────────────────────────────────────────────────────────────────

export interface CasePartyRow {
    id: number;
    hr_case_id: number;
    user_id: number;
    role: PartyRole;
    user: { id: number; name: string; email: string } | null;
}

export interface CaseNoteRow {
    id: number;
    hr_case_id: number;
    author_id: number | null;
    content: string;
    is_internal: boolean;
    created_at: string;
    author: { id: number; name: string } | null;
}

export interface HrCaseRow {
    id: number;
    case_number: string;
    type: CaseType;
    subject: string;
    description: string;
    status: CaseStatus;
    priority: CasePriority;
    confidential: boolean;
    reported_by_id: number | null;
    assigned_to_id: number | null;
    outcome: string | null;
    resolved_at: string | null;
    closed_at: string | null;
    created_at: string;
    reported_by: { id: number; name: string } | null;
    assigned_to: { id: number; name: string } | null;
    parties: CasePartyRow[];
    notes: CaseNoteRow[];
}
