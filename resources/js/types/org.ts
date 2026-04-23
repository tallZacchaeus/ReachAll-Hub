// Org Structure types — keep in sync with Phase 2 models and controllers.

export interface Department {
    id: number;
    code: string;
    name: string;
    description: string | null;
    parent_department_id: number | null;
    parent_name: string | null;
    head_user_id: number | null;
    head_name: string | null;
    is_active: boolean;
    employee_count: number;
}

export interface JobLevel {
    id: number;
    code: string;
    name: string;
    sort_order: number;
}

export interface JobPosition {
    id: number;
    code: string;
    title: string;
    department_id: number | null;
    department_name: string | null;
    job_level_id: number | null;
    level_name: string | null;
    level_code: string | null;
    description: string | null;
    is_active: boolean;
    employee_count: number;
}

export interface OfficeLocation {
    id: number;
    code: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string;
    is_active: boolean;
    employee_count: number;
}

export interface EmployeeLifecycleEvent {
    id: number;
    user_id: number;
    event_type: string;
    effective_date: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    notes: string | null;
    recorded_by_id: number | null;
    created_at: string;
}

export interface OrgChartEmployee {
    id: number;
    name: string;
    employee_id: string | null;
    title: string | null;
    department: string | null;
    role: string;
    reports_to_id: number | null;
    avatar: string | null;
}
