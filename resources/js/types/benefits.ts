export type ContributionType = 'none' | 'fixed' | 'percentage_of_basic' | 'percentage_of_gross';
export type BenefitPlanType  = 'hmo' | 'pension' | 'life_insurance' | 'disability' | 'other';

export interface BenefitPlan {
    id: number;
    type: BenefitPlanType;
    name: string;
    provider: string | null;
    description: string | null;
    employee_contribution_type: ContributionType;
    employee_contribution_value: number;
    employer_contribution_type: ContributionType;
    employer_contribution_value: number;
    is_waivable: boolean;
    is_active: boolean;
    sort_order: number;
    enrollments_count?: number;
}

export interface EmployeeDependent {
    id: number;
    user_id: number;
    name: string;
    relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
    date_of_birth: string | null;
    gender: 'male' | 'female' | 'other' | null;
    is_active: boolean;
    notes: string | null;
}

export interface BenefitEnrollmentRow {
    id: number;
    plan_name: string;
    plan_type: BenefitPlanType;
    provider: string | null;
    effective_date: string;
    employee_contribution: string;
    employer_contribution: string;
    member_id: string | null;
}

export interface BenefitEnrollmentWindow {
    id: number;
    name: string;
    description: string | null;
    open_date: string;
    close_date: string;
    effective_date: string;
    status: 'upcoming' | 'open' | 'processing' | 'closed';
}

export interface MyElection {
    id: number;
    plan_id: number;
    plan_name: string;
    election: 'enroll' | 'waive';
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface OpenWindow {
    id: number;
    name: string;
    description: string | null;
    close_date: string;
    effective_date: string;
    my_elections: MyElection[];
}
