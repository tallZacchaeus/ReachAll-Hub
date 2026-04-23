// ── Recruitment / ATS types ───────────────────────────────────────────────────

export type RequisitionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
export type RequisitionPriority = 'low' | 'normal' | 'high' | 'urgent';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';

export type CandidateStatus = 'active' | 'inactive' | 'hired' | 'blacklisted';
export type CandidateSource = string;

export type ApplicationStage =
    | 'new'
    | 'screening'
    | 'interview'
    | 'offer'
    | 'hired'
    | 'rejected'
    | 'withdrawn';

export type InterviewFormat = 'video' | 'phone' | 'in_person';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type Recommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no';

export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'withdrawn';

// ── Entities ─────────────────────────────────────────────────────────────────

export interface JobRequisitionRow {
    id: number;
    title: string;
    department: string;
    headcount: number;
    employment_type: EmploymentType;
    justification: string;
    priority: RequisitionPriority;
    status: RequisitionStatus;
    rejection_reason: string | null;
    requested_by_id: number;
    approved_by_id: number | null;
    approved_at: string | null;
    job_posting_id: number | null;
    created_at: string;
    requested_by: { id: number; name: string } | null;
    approved_by: { id: number; name: string } | null;
    posting: { id: number; title: string } | null;
}

export interface CandidateRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    source: string | null;
    current_company: string | null;
    current_title: string | null;
    linkedin_url: string | null;
    resume_path: string | null;
    status: CandidateStatus;
    notes: string | null;
    added_by_id: number;
    created_at: string;
    added_by: { id: number; name: string } | null;
}

export interface ScorecardRow {
    id: number;
    interview_schedule_id: number;
    evaluator_id: number;
    overall_rating: number;
    technical_rating: number | null;
    communication_rating: number | null;
    culture_fit_rating: number | null;
    strengths: string | null;
    concerns: string | null;
    recommendation: Recommendation;
    notes: string | null;
    evaluator: { id: number; name: string } | null;
}

export interface InterviewRow {
    id: number;
    job_application_id: number;
    interviewer_id: number;
    scheduled_at: string;
    duration_minutes: number;
    format: InterviewFormat;
    location_or_link: string | null;
    status: InterviewStatus;
    notes: string | null;
    interviewer: { id: number; name: string } | null;
    scorecards: ScorecardRow[];
}

export interface OfferLetterRow {
    id: number;
    job_application_id: number;
    offered_salary_kobo: number;
    start_date: string;
    offer_date: string;
    expiry_date: string | null;
    status: OfferStatus;
    document_path: string | null;
    notes: string | null;
    created_by_id: number | null;
    sent_at: string | null;
    responded_at: string | null;
    created_by: { id: number; name: string } | null;
}

export interface ApplicationRow {
    id: number;
    job_posting_id: number;
    user_id: number | null;
    candidate_id: number | null;
    cover_letter: string | null;
    status: string;
    stage: ApplicationStage;
    ats_notes: string | null;
    applied_at: string;
    hired_at: string | null;
    rejected_at: string | null;
    job_posting: { id: number; title: string; department: string } | null;
    applicant: { id: number; name: string; email: string; employee_id?: string } | null;
    candidate: CandidateRow | null;
    interviews: InterviewRow[];
    offer: OfferLetterRow | null;
}
