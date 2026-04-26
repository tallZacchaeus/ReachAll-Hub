export type ExpenseCategory =
    | 'travel'
    | 'accommodation'
    | 'meals'
    | 'equipment'
    | 'training'
    | 'communication'
    | 'medical'
    | 'other';

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';

export interface ExpenseClaim {
    id:               number;
    user:             { id: number; name: string; employee_id: string } | null;
    title:            string;
    description:      string | null;
    category:         ExpenseCategory;
    currency:         string;
    amount:           number;
    exchange_rate:    number;
    amount_ngn_kobo:  number;
    /** amount_ngn_kobo / 100 */
    amount_ngn:       number;
    expense_date:     string;
    status:           ExpenseStatus;
    submitted_at:     string | null;
    reviewed_by:      { id: number; name: string } | null;
    reviewed_at:      string | null;
    review_notes:     string | null;
    finance_paid_by?: { id: number; name: string } | null;
    finance_paid_at:  string | null;
    receipts:         ExpenseReceipt[];
    receipts_count?:  number;
}

export interface ExpenseReceipt {
    id:                 number;
    original_filename:  string;
    mime_type:          string | null;
    file_size_bytes:    number | null;
    description:        string | null;
    created_at?:        string | null;
}
