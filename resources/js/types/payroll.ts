export interface PayGrade {
    id: number;
    code: string;
    name: string;
    min_salary_kobo: number;
    max_salary_kobo: number;
    is_active: boolean;
}

export interface EmployeeSalary {
    id: number;
    user_id: number;
    pay_grade_id: number | null;
    basic_kobo: number;
    housing_kobo: number;
    transport_kobo: number;
    other_allowances_kobo: number;
    nhf_enrolled: boolean;
    effective_date: string;
    end_date: string | null;
    notes: string | null;
}

export interface PayrollRun {
    id: number;
    period_label: string;
    period_start: string;
    period_end: string;
    status: 'draft' | 'approved' | 'paid' | 'cancelled';
    is_off_cycle: boolean;
    total_gross_kobo: number;
    total_paye_kobo: number;
    total_pension_employee_kobo: number;
    total_pension_employer_kobo: number;
    total_nhf_kobo: number;
    total_nsitf_kobo: number;
    total_net_kobo: number;
    employee_count: number;
    // formatted strings from controller
    total_gross?: string;
    total_paye?: string;
    total_pension_employee?: string;
    total_pension_employer?: string;
    total_nhf?: string;
    total_nsitf?: string;
    total_net?: string;
    entries_count?: number;
    approved_at: string | null;
    paid_at: string | null;
    notes: string | null;
}

export interface PayrollEntryRow {
    id: number;
    employee_id: string | null;
    employee_name: string | null;
    department: string | null;
    gross: string;
    paye: string;
    pension_employee: string;
    nhf: string;
    other_deductions: string;
    net: string;
    gross_kobo: number;
    net_kobo: number;
    payslip_generated: boolean;
}

export interface PayrollLoan {
    id: number;
    user: { id: number; name: string; employee_id: string };
    type: 'loan' | 'advance';
    description: string | null;
    principal_kobo: number;
    remaining_kobo: number;
    monthly_instalment_kobo: number;
    start_date: string;
    end_date: string | null;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    approved_by: { id: number; name: string } | null;
    approved_at: string | null;
    notes: string | null;
}

export interface MyPayslip {
    id: number;
    period_label: string;
    period_start: string;
    status: string;
    gross: string;
    net: string;
    paye: string;
    pension: string;
    payslip_generated: boolean;
    download_url: string;
}
