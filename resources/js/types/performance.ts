export type ReviewCycleType   = 'annual' | 'quarterly' | 'mid_year' | 'probation';
export type ReviewCycleStatus = 'draft' | 'active' | 'closed';
export type ReviewType        = 'self' | 'manager' | 'peer';
export type ReviewStatus      = 'pending' | 'in_progress' | 'submitted' | 'acknowledged';
export type PipStatus         = 'draft' | 'active' | 'completed' | 'failed' | 'cancelled';
export type MilestoneStatus   = 'pending' | 'completed' | 'missed';

export interface ReviewCycle {
    id:             number;
    name:           string;
    type:           ReviewCycleType;
    period_start:   string;
    period_end:     string;
    status:         ReviewCycleStatus;
    description:    string | null;
    created_by_id:  number | null;
    created_by?:    { id: number; name: string; employee_id: string } | null;
    performance_reviews_count?: number;
    created_at:     string;
}

export interface PerformanceReview {
    id:              number;
    review_cycle_id: number;
    reviewee:        { id: number; name: string; employee_id: string; department?: string; position?: string };
    reviewer:        { id: number; name: string; employee_id: string } | null;
    type:            ReviewType;
    status:          ReviewStatus;
    overall_rating:  number | null;
    ratings:         Record<string, number> | null;
    strengths:       string | null;
    improvements:    string | null;
    comments:        string | null;
    submitted_at:    string | null;
    acknowledged_at: string | null;
    review_cycle?:   ReviewCycle;
}

export interface ReviewCompetency {
    id:          number;
    name:        string;
    slug:        string;
    description: string | null;
    sort_order:  number;
}

export interface PipMilestone {
    id:           number;
    pip_plan_id:  number;
    title:        string;
    description:  string | null;
    due_date:     string;
    status:       MilestoneStatus;
    notes:        string | null;
    completed_at: string | null;
}

export interface PipPlan {
    id:                    number;
    user_id:               number;
    user:                  { id: number; name: string; employee_id: string; department?: string; position?: string };
    initiated_by_id:       number | null;
    initiated_by?:         { id: number; name: string } | null;
    performance_review_id: number | null;
    performance_review?:   PerformanceReview | null;
    title:                 string;
    description:           string | null;
    start_date:            string;
    end_date:              string;
    status:                PipStatus;
    outcome:               string | null;
    outcome_date:          string | null;
    milestones:            PipMilestone[];
    created_at:            string;
}
