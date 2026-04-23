export interface DocumentCategory {
    id: number;
    code: string;
    name: string;
    description: string | null;
    requires_signature: boolean;
    is_active: boolean;
    sort_order: number;
}

export interface HrDocument {
    id: number;
    user_id: number;
    category_id: number;
    title: string;
    disk: string;
    file_size: number;
    mime_type: string | null;
    version: number;
    status: 'draft' | 'active' | 'superseded' | 'expired';
    requires_signature: boolean;
    effective_date: string | null;
    expires_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // relations (eager-loaded)
    employee?: { id: number; name: string; employee_id: string };
    category?: { id: number; name: string; code: string };
    uploaded_by?: { id: number; name: string };
    signatures?: DocumentSignature[];
}

export interface DocumentSignature {
    id: number;
    document_id: number;
    signee_id: number;
    status: 'pending' | 'signed' | 'declined';
    signed_at: string | null;
    declined_at: string | null;
    ip_address: string | null;
    decline_reason: string | null;
    created_at: string;
    signee?: { id: number; name: string };
}

/** Shape returned by HrDocumentSelfController to MyDocumentsPage */
export interface MyDocument {
    id: number;
    title: string;
    category: string | null;
    category_code: string | null;
    version: number;
    effective_date: string | null;
    expires_at: string | null;
    requires_signature: boolean;
    signature_status: 'pending' | 'signed' | 'declined' | null;
    signed_at: string | null;
    download_url: string;
}
