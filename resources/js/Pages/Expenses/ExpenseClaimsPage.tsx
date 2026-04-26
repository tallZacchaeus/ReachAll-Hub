import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Eye,
    FileText,
    CheckCircle,
    XCircle,
    CreditCard,
    Receipt,
} from "lucide-react";
import type { ExpenseClaim, ExpenseCategory, ExpenseStatus } from "@/types/expenses";

interface Stats {
    pending_count:    number;
    pending_ngn:      number;
    approved_count:   number;
    approved_ngn:     number;
    paid_month_count: number;
    paid_month_ngn:   number;
}

interface PaginatedClaims {
    data:          ExpenseClaim[];
    current_page:  number;
    last_page:     number;
    per_page:      number;
    total:         number;
    links:         { url: string | null; label: string; active: boolean }[];
}

interface Props {
    claims:      PaginatedClaims;
    stats:       Stats | null;
    isAdminView: boolean;
    filters:     { status?: string; category?: string; date_from?: string; date_to?: string };
    canApprove:  boolean;
    canFinance:  boolean;
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

const CATEGORY_CLASSES: Record<ExpenseCategory, string> = {
    travel:        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    accommodation: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    meals:         "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    equipment:     "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    training:      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    communication: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    medical:       "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    other:         "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
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
        maximumFractionDigits: 0,
    }).format(value);
}

export default function ExpenseClaimsPage({
    claims,
    stats,
    isAdminView,
    filters,
    canApprove,
    canFinance,
}: Props) {
    const [filterStatus,   setFilterStatus]   = useState(filters.status   ?? "");
    const [filterCategory, setFilterCategory] = useState(filters.category ?? "");
    const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from ?? "");
    const [filterDateTo,   setFilterDateTo]   = useState(filters.date_to   ?? "");

    // Action dialogs state
    const [actionClaim,  setActionClaim]  = useState<ExpenseClaim | null>(null);
    const [actionType,   setActionType]   = useState<"approve" | "reject" | "pay" | null>(null);
    const [reviewNotes,  setReviewNotes]  = useState("");
    const [processing,   setProcessing]   = useState(false);

    function applyFilters() {
        router.get(
            route("expenses.index"),
            {
                ...(filterStatus   ? { status:    filterStatus }   : {}),
                ...(filterCategory ? { category:  filterCategory } : {}),
                ...(filterDateFrom ? { date_from: filterDateFrom } : {}),
                ...(filterDateTo   ? { date_to:   filterDateTo }   : {}),
            },
            { preserveState: true, replace: true },
        );
    }

    function clearFilters() {
        setFilterStatus("");
        setFilterCategory("");
        setFilterDateFrom("");
        setFilterDateTo("");
        router.get(route("expenses.index"), {}, { replace: true });
    }

    function openActionDialog(claim: ExpenseClaim, type: "approve" | "reject" | "pay") {
        setActionClaim(claim);
        setActionType(type);
        setReviewNotes("");
    }

    function closeActionDialog() {
        setActionClaim(null);
        setActionType(null);
        setReviewNotes("");
    }

    function submitAction() {
        if (!actionClaim || !actionType) return;
        setProcessing(true);

        const routeMap = {
            approve: route("expenses.approve", actionClaim.id),
            reject:  route("expenses.reject",  actionClaim.id),
            pay:     route("expenses.mark-paid", actionClaim.id),
        };

        router.post(
            routeMap[actionType],
            { review_notes: reviewNotes },
            {
                onFinish: () => {
                    setProcessing(false);
                    closeActionDialog();
                },
            },
        );
    }

    const hasFilters = filterStatus || filterCategory || filterDateFrom || filterDateTo;

    return (
        <>
            <Head title="Expense Claims" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-foreground">
                            {isAdminView ? "Expense Claims" : "My Expense Claims"}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {isAdminView
                                ? "Review, approve, and process employee expense claims"
                                : "Track and manage your submitted expense claims"}
                        </p>
                    </div>
                    <Button onClick={() => router.visit(route("expenses.my"))}>
                        <Receipt className="w-4 h-4 mr-2" />
                        My Expenses
                    </Button>
                </div>

                {/* Stats (admin only) */}
                {stats && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Card className="shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Pending Approval</p>
                                <p className="text-2xl font-semibold text-foreground">{stats.pending_count}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatNgn(stats.pending_ngn)} total
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Approved</p>
                                <p className="text-2xl font-semibold text-foreground">{stats.approved_count}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatNgn(stats.approved_ngn)} pending payment
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Paid This Month</p>
                                <p className="text-2xl font-semibold text-foreground">{stats.paid_month_count}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatNgn(stats.paid_month_ngn)} disbursed
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All statuses</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="submitted">Submitted</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Category</Label>
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All categories</SelectItem>
                                        {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                                            <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Date From</Label>
                                <Input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Date To</Label>
                                <Input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Button size="sm" onClick={applyFilters}>Apply</Button>
                            {hasFilters && (
                                <Button size="sm" variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="w-4 h-4" />
                            Claims ({claims.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {claims.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                <Receipt className="w-10 h-10 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No expense claims found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {isAdminView && <TableHead>Employee</TableHead>}
                                            <TableHead>Title</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>NGN Equiv.</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Receipts</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {claims.data.map((c) => (
                                            <TableRow key={c.id}>
                                                {isAdminView && (
                                                    <TableCell className="text-sm">
                                                        <span className="font-medium">{c.user?.name ?? "—"}</span>
                                                        {c.user?.employee_id && (
                                                            <span className="ml-1.5 text-xs text-muted-foreground">
                                                                {c.user.employee_id}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                )}
                                                <TableCell className="font-medium max-w-[180px] truncate">
                                                    {c.title}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={CATEGORY_CLASSES[c.category]}>
                                                        {CATEGORY_LABELS[c.category]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm tabular-nums">
                                                    {c.currency !== "NGN" && `${c.currency} `}
                                                    {Number(c.amount).toLocaleString("en-NG", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-sm tabular-nums text-muted-foreground">
                                                    {formatNgn(c.amount_ngn)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {c.expense_date}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={STATUS_CLASSES[c.status]}>
                                                        {c.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-center">
                                                    {c.receipts_count ?? 0}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1 flex-wrap">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.visit(route("expenses.show", c.id))
                                                            }
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            View
                                                        </Button>
                                                        {canApprove && c.status === "submitted" && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-green-600 hover:text-green-700"
                                                                    onClick={() => openActionDialog(c, "approve")}
                                                                >
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() => openActionDialog(c, "reject")}
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {canFinance && c.status === "approved" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-emerald-600 hover:text-emerald-700"
                                                                onClick={() => openActionDialog(c, "pay")}
                                                            >
                                                                <CreditCard className="w-4 h-4 mr-1" />
                                                                Mark Paid
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {claims.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {claims.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? "default" : "outline"}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Action Dialog */}
            <Dialog open={!!actionClaim} onOpenChange={(open) => { if (!open) closeActionDialog(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === "approve" && "Approve Expense Claim"}
                            {actionType === "reject"  && "Reject Expense Claim"}
                            {actionType === "pay"     && "Mark Expense as Paid"}
                        </DialogTitle>
                    </DialogHeader>
                    {actionClaim && (
                        <div className="space-y-4 mt-2">
                            <div className="rounded-md bg-muted px-4 py-3 text-sm">
                                <p className="font-medium">{actionClaim.title}</p>
                                <p className="text-muted-foreground mt-0.5">
                                    {actionClaim.user?.name} &mdash;{" "}
                                    {actionClaim.currency !== "NGN" && `${actionClaim.currency} `}
                                    {Number(actionClaim.amount).toLocaleString()}
                                    {actionClaim.currency !== "NGN" && (
                                        <span className="ml-1 text-muted-foreground">
                                            ({formatNgn(actionClaim.amount_ngn)})
                                        </span>
                                    )}
                                </p>
                            </div>
                            {(actionType === "approve" || actionType === "reject") && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="review_notes">
                                        Review Notes{actionType === "reject" ? " (required)" : " (optional)"}
                                    </Label>
                                    <Textarea
                                        id="review_notes"
                                        rows={3}
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add a note for the employee…"
                                    />
                                </div>
                            )}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={submitAction}
                                    disabled={processing || (actionType === "reject" && !reviewNotes.trim())}
                                    className="flex-1"
                                    variant={actionType === "reject" ? "destructive" : "default"}
                                >
                                    {processing
                                        ? "Processing…"
                                        : actionType === "approve"
                                        ? "Approve"
                                        : actionType === "reject"
                                        ? "Reject"
                                        : "Mark Paid"}
                                </Button>
                                <Button variant="outline" onClick={closeActionDialog} disabled={processing}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

ExpenseClaimsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
