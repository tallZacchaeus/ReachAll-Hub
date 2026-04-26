export interface LeaveType {
    id: number;
    name: string;
    code: string;
    days_per_year: number;
    accrual_policy: "none" | "monthly" | "annual";
    carry_over_days: number;
    max_carry_over_days: number;
    requires_documentation: boolean;
    is_active: boolean;
}

export interface LeaveBalance {
    leave_type_id: number;
    leave_type: LeaveType;
    entitled_days: number;
    used_days: number;
    carried_over_days: number;
    remaining: number;
}

export interface PublicHoliday {
    id: number;
    name: string;
    date: string;
    country_code: string;
    is_recurring: boolean;
    is_active: boolean;
}

export interface LeaveRequest {
    id: string;
    staffName: string;
    staffId: string;
    /** Display label (e.g. "Annual Leave") */
    leaveType: string;
    type: string;
    typeKey: string;
    leaveTypeId: number | null;
    startDate: string;
    endDate: string;
    days: number;
    workingDays: number | null;
    reason: string;
    status: "pending" | "approved" | "rejected";
    hrComment: string | null;
    approverName: string | null;
    submittedDate: string | null;
    coverName: string | null;
}

export interface LeaveHistoryItem {
    id: string;
    period: string;
    type: string;
    startDate: string;
    endDate: string;
    days: number;
    workingDays: number | null;
    status: string;
    reason: string;
    approverName: string | null;
    hrComment: string | null;
}

export interface TeamLeaveEntry {
    id: string;
    staffName: string;
    staffId: string;
    leaveType: string;
    typeCode: string;
    startDate: string;
    endDate: string;
    workingDays: number;
}
