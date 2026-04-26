export type FeedbackType   = '360' | 'peer' | 'upward' | 'downward';
export type FeedbackStatus = 'pending' | 'completed' | 'cancelled';
export type OneOnOneStatus = 'scheduled' | 'completed' | 'cancelled';

export interface FeedbackRequest {
    id:              number;
    subject:         { id: number; name: string; employee_id: string } | null;
    requester:       { id: number; name: string } | null;
    type:            FeedbackType;
    message:         string | null;
    due_date:        string | null;
    status:          FeedbackStatus;
    responses_count: number;
}

export interface FeedbackResponse {
    id:             number;
    /** null when is_anonymous = true — respondent identity is never exposed for anonymous responses */
    respondent:     { id: number; name: string } | null;
    is_anonymous:   boolean;
    ratings:        Record<string, number> | null;
    overall_rating: number | null;
    strengths:      string | null;
    improvements:   string | null;
    submitted_at:   string | null;
}

export interface AggregatedFeedback {
    competency_averages: Record<string, number>;
    overall_average:     number | null;
    response_count:      number;
}

export interface ActionItem {
    text:     string;
    done:     boolean;
    due_date: string | null;
}

export interface OneOnOne {
    id:           number;
    manager:      { id: number; name: string; employee_id?: string };
    employee:     { id: number; name: string; employee_id: string };
    scheduled_at: string;
    status:       OneOnOneStatus;
    agenda:       string | null;
    notes:        string | null;
    action_items: ActionItem[] | null;
}
