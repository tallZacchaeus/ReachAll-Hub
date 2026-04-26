import { useState, useRef } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    CheckCircle,
    XCircle,
    CreditCard,
    Download,
    Upload,
    FileText,
    Send,
    Clock,
    User,
} from "lucide-react";
import type { ExpenseClaim, ExpenseStatus, ExpenseCategory } from "@/types/expenses";

interface Props {
    claim:      ExpenseClaim;
    canApprove: boolean;
    canFinance: boolean;
    isOwner:    boolean;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    travel:        "Travel",
    accommodation: "Accommodation",
    meals:         "Meals",
    equipment:     "Equipment",
    training:      "Training",
    communication: "Communication",
    medical:       "Medical",
    other:         "Other",
};

const STATUS_CLASSES: Record<ExpenseStatus, string> = {
    draft:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    submitted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    paid:      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

function formatNgn(value: number): string {
    return new Intl.NumberFormat("en-NG", {
        style:    "currency",
        currency: "NGN",
        maximumFractionDigits: 2,
    }).format(value);
}

function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-NG", {
        day:   "numeric",
        month: "short",
        year:  "numeric",
        hour:  "2-digit",
        minute: "2-digit",
    });
}

function formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExpenseClaimPage({ claim, canApprove, canFinance, isOwner }: Props) {
    const [approveNotes, setApproveNotes] = useState("");
    const [rejectNotes,  setRejectNotes]  = useState("");
    const [processing,   setProcessing]   = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const receiptForm = useForm<{ receipt: File | null; description: string }>({
        receipt:     null,
        description: "",
    });

    function handleApprove() {
        setProcessing(true);
        router.post(
            route("expenses.approve", claim.id),
            { review_notes: approveNotes },
            { onFinish: () => setProcessing(false) },
        );
    }

    function handleReject() {
        if (!rejectNotes.trim()) return;
        setProcessing(true);
        router.post(
            route("expenses.reject", claim.id),
            { review_notes: rejectNotes },
            { onFinish: () => setProcessing(false) },
        );
    }

    function handleMarkPaid() {
        if (!confirm("Mark this expense claim as paid?")) return;
        setProcessing(true);
        router.post(
            route("expenses.mark-paid", claim.id),
            {},
            { onFinish: () => setProcessing(false) },
        );
    }

    function handleSubmit() {
        if (!confirm("Submit this claim for approval?")) return;
        router.post(route("expenses.submit", claim.id));
    }

    function handleReceiptUpload(e: React.FormEvent) {
        e.preventDefault();
        if (!receiptForm.data.receipt) return;

        const fd = new FormData();
        fd.append("receipt",     receiptForm.data.receipt);
        fd.append("description", receiptForm.data.description);

        router.post(route("expenses.receipts.store", claim.id), fd as unknown as Record<string, unknown>, {
            forceFormData: true,
            onSuccess: () => {
                receiptForm.reset();
                if (fileInputRef.current) fileInputRef.current.value = "";
            },
        });
    }

    return (
        <>
            <Head title={`Expense: ${claim.title}`} />
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Back */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => history.back()}
                >
                    ← Back
                </Button>

                {/* Claim Header */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="text-xl">{claim.title}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {claim.user?.name}
                                    {claim.user?.employee_id && (
                                        <span className="ml-1.5">({claim.user.employee_id})</span>
                                    )}
                                </p>
                            </div>
                            <Badge className={`${STATUS_CLASSES[claim.status]} shrink-0`}>
                                {claim.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                            <div>
                                <dt className="text-muted-foreground">Category</dt>
                                <dd className="font-medium">{CATEGORY_LABELS[claim.category]}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Expense Date</dt>
                                <dd className="font-medium">{claim.expense_date}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Amount</dt>
                                <dd className="font-medium tabular-nums">
                                    {claim.currency !== "NGN" && `${claim.currency} `}
                                    {Number(claim.amount).toLocaleString("en-NG", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </dd>
                            </div>
                            {claim.currency !== "NGN" && (
                                <>
                                    <div>
                                        <dt className="text-muted-foreground">Exchange Rate</dt>
                                        <dd className="font-medium tabular-nums">
                                            1 {claim.currency} = {Number(claim.exchange_rate).toLocaleString()} NGN
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">NGN Equivalent</dt>
                                        <dd className="font-medium tabular-nums">
                                            {formatNgn(claim.amount_ngn)}
                                        </dd>
                                    </div>
                                </>
                            )}
                            {claim.currency === "NGN" && (
                                <div>
                                    <dt className="text-muted-foreground">NGN Amount</dt>
                                    <dd className="font-medium tabular-nums">
                                        {formatNgn(claim.amount_ngn)}
                                    </dd>
                                </div>
                            )}
                        </dl>
                        {claim.description && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="text-sm whitespace-pre-wrap">{claim.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Owner actions */}
                {isOwner && claim.status === "draft" && (
                    <Card className="shadow-sm border-primary/20">
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-3">
                                Add any receipts below, then submit for approval when ready.
                            </p>
                            <Button onClick={handleSubmit}>
                                <Send className="w-4 h-4 mr-2" />
                                Submit for Approval
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Receipts */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="w-4 h-4" />
                            Receipts ({claim.receipts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {claim.receipts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No receipts uploaded yet.</p>
                        ) : (
                            <ul className="divide-y">
                                {claim.receipts.map((r) => (
                                    <li key={r.id} className="flex items-start justify-between py-3 gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{r.original_filename}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {r.mime_type}
                                                {r.file_size_bytes && ` · ${formatFileSize(r.file_size_bytes)}`}
                                                {r.description && ` · ${r.description}`}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={route("expenses.receipts.download", r.id)}
                                                download
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                Download
                                            </a>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Upload form — owner only on draft/submitted */}
                        {isOwner && (claim.status === "draft" || claim.status === "submitted") && (
                            <form onSubmit={handleReceiptUpload} className="pt-3 border-t space-y-3">
                                <p className="text-sm font-medium">Upload Receipt</p>
                                <div className="space-y-1.5">
                                    <Label htmlFor="receipt">File (PDF / JPG / PNG, max 10 MB)</Label>
                                    <Input
                                        id="receipt"
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        onChange={(e) =>
                                            receiptForm.setData("receipt", e.target.files?.[0] ?? null)
                                        }
                                    />
                                    {receiptForm.errors.receipt && (
                                        <p className="text-sm text-destructive">{receiptForm.errors.receipt}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="receipt_desc">Description (optional)</Label>
                                    <Input
                                        id="receipt_desc"
                                        value={receiptForm.data.description}
                                        onChange={(e) =>
                                            receiptForm.setData("description", e.target.value)
                                        }
                                        placeholder="e.g. Airline e-ticket"
                                        maxLength={300}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!receiptForm.data.receipt || receiptForm.processing}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {receiptForm.processing ? "Uploading…" : "Upload"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Approval section */}
                {(canApprove || canFinance || claim.review_notes) && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Approval</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Existing review notes */}
                            {claim.review_notes && (
                                <div className="rounded-md bg-muted p-3 text-sm">
                                    <p className="font-medium text-muted-foreground mb-1">Review Notes</p>
                                    <p>{claim.review_notes}</p>
                                </div>
                            )}

                            {/* Approve / Reject actions */}
                            {canApprove && claim.status === "submitted" && (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="approve_notes">Notes (optional)</Label>
                                        <Textarea
                                            id="approve_notes"
                                            rows={2}
                                            value={approveNotes}
                                            onChange={(e) => setApproveNotes(e.target.value)}
                                            placeholder="Optional comment for the employee…"
                                        />
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="text-white bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={processing || !rejectNotes.trim()}
                                            onClick={handleReject}
                                            className="border-destructive text-destructive hover:bg-destructive/10"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="reject_notes" className="text-destructive text-xs">
                                            Rejection reason (required to reject)
                                        </Label>
                                        <Textarea
                                            id="reject_notes"
                                            rows={2}
                                            value={rejectNotes}
                                            onChange={(e) => setRejectNotes(e.target.value)}
                                            placeholder="Explain why this claim is being rejected…"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Mark paid */}
                            {canFinance && claim.status === "approved" && (
                                <Button
                                    onClick={handleMarkPaid}
                                    disabled={processing}
                                    className="text-white bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Mark as Paid
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Timeline */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium">Created</p>
                                    <p className="text-muted-foreground">
                                        {claim.user?.name ?? "Unknown"}
                                    </p>
                                </div>
                            </li>
                            {claim.submitted_at && (
                                <li className="flex items-start gap-3">
                                    <Send className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">Submitted</p>
                                        <p className="text-muted-foreground">
                                            {formatDate(claim.submitted_at)}
                                        </p>
                                    </div>
                                </li>
                            )}
                            {claim.reviewed_at && (
                                <li className="flex items-start gap-3">
                                    {claim.status === "rejected" ? (
                                        <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                    )}
                                    <div>
                                        <p className="font-medium capitalize">
                                            {claim.status === "rejected" ? "Rejected" : "Approved"}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {claim.reviewed_by?.name ?? "Unknown"} &mdash;{" "}
                                            {formatDate(claim.reviewed_at)}
                                        </p>
                                    </div>
                                </li>
                            )}
                            {claim.finance_paid_at && (
                                <li className="flex items-start gap-3">
                                    <CreditCard className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">Paid</p>
                                        <p className="text-muted-foreground">
                                            {claim.finance_paid_by?.name ?? "Finance"} &mdash;{" "}
                                            {formatDate(claim.finance_paid_at)}
                                        </p>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ExpenseClaimPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
