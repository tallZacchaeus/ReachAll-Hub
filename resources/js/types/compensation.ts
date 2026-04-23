export type BandCategory = 'individual_contributor' | 'manager' | 'executive';
export type CycleType    = 'annual' | 'mid_year' | 'off_cycle' | 'promotion';
export type CycleStatus  = 'draft' | 'active' | 'review' | 'approved' | 'closed';
export type EntryStatus  = 'pending' | 'submitted' | 'approved' | 'rejected';
export type Recommendation = 'increase' | 'no_change' | 'decrease' | 'promotion' | 'offcycle';
export type BonusType    = 'annual' | 'performance' | 'spot' | 'referral' | 'retention' | 'signing' | 'other';
export type BonusStatus  = 'draft' | 'active' | 'closed' | 'paid';
export type AwardStatus  = 'draft' | 'approved' | 'rejected' | 'paid';

export interface CompensationBand {
    id: number;
    grade: string;
    title: string;
    category: BandCategory;
    min_kobo: number;
    midpoint_kobo: number;
    max_kobo: number;
    effective_date: string;
    is_active: boolean;
    notes: string | null;
}

export interface CompensationReviewCycle {
    id: number;
    name: string;
    cycle_type: CycleType;
    review_start_date: string;
    review_end_date: string;
    effective_date: string;
    status: CycleStatus;
    budget_kobo: number;
    notes: string | null;
    entries_count?: number;
}

export interface ReviewEntryRow {
    id: number;
    user_id: number;
    employee_name: string;
    employee_id: string;
    department: string | null;
    current_salary: string;
    current_salary_kobo: number;
    proposed_salary: string | null;
    proposed_salary_kobo: number | null;
    merit_basis_points: number;
    merit_percent: string;
    increase: string;
    recommendation: Recommendation | null;
    rationale: string | null;
    status: EntryStatus;
    approved_at: string | null;
}

export interface BonusPlanRow {
    id: number;
    name: string;
    bonus_type: BonusType;
    period_label: string | null;
    total_budget: string;
    committed: string;
    remaining: string;
    status: BonusStatus;
    payout_date: string | null;
    awards_count: number;
}

export interface BonusAwardRow {
    id: number;
    bonus_plan_id: number;
    user_id: number;
    employee_name: string;
    employee_id: string;
    department: string | null;
    amount: string;
    amount_kobo: number;
    rationale: string | null;
    status: AwardStatus;
    approved_at: string | null;
}

// ── Total Rewards ──────────────────────────────────────────────────────────

export interface SalarySummary {
    basic: string;
    housing: string;
    transport: string;
    other_allowances: string;
    gross: string;
    effective_date: string;
}

export interface BenefitSummaryRow {
    plan_name: string;
    plan_type: string;
    provider: string | null;
    employee_contribution: string;
    employer_contribution: string;
}

export interface BonusSummaryRow {
    plan_name: string;
    bonus_type: BonusType;
    period: string | null;
    amount: string;
    status: AwardStatus;
    approved_at: string | null;
}

export interface BandSummary {
    grade: string;
    title: string;
    min: string;
    midpoint: string;
    max: string;
    comparatio: string;
    range_position: string;
}
