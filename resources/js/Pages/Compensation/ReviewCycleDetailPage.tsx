import { Head, router, useForm } from "@inertiajs/react";
import { CheckCircle2, XCircle, Edit, Play, Lock } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type { CompensationReviewCycle, ReviewEntryRow, Recommendation } from "@/types/compensation";

interface Props {
    cycle:   CompensationReviewCycle;
    entries: ReviewEntryRow[];
}

const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
    increase:  "Increase",
    no_change: "No Change",
    decrease:  "Decrease",
    promotion: "Promotion",
    offcycle:  "Off-Cycle",
};

const STATUS_COLOURS: Record<string, string> = {
    pending:   "bg-gray-100 text-gray-600",
    submitted: "bg-yellow-100 text-yellow-800",
    approved:  "bg-green-100 text-green-800",
    rejected:  "bg-red-100 text-red-800",
};

export default function ReviewCycleDetailPage({ cycle, entries }: Props) {
    const [editEntry, setEditEntry] = useState<ReviewEntryRow | null>(null);
    const [rejectEntry, setRejectEntry] = useState<ReviewEntryRow | null>(null);

    const editForm = useForm({
        proposed_salary_kobo: 0,
        merit_basis_points:   0,
        recommendation:       "increase" as Recommendation,
        rationale:            "",
    });

    const rejectForm = useForm({ rationale: "" });

    function openEdit(entry: ReviewEntryRow) {
        editForm.setData({
            proposed_salary_kobo: entry.proposed_salary_kobo ?? entry.current_salary_kobo,
            merit_basis_points:   entry.merit_basis_points,
            recommendation:       (entry.recommendation ?? "no_change") as Recommendation,
            rationale:            entry.rationale ?? "",
        });
        setEditEntry(entry);
    }

    function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!editEntry) return;
        editForm.put(`/compensation/review-entries/${editEntry.id}`, {
            onSuccess: () => setEditEntry(null),
        });
    }

    function handleApprove(entry: ReviewEntryRow) {
        if (!confirm(`Approve merit change for ${entry.employee_name}? This will update their salary record.`)) return;
        router.post(`/compensation/review-entries/${entry.id}/approve`, {}, { preserveScroll: true });
    }

    function handleRejectSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!rejectEntry) return;
        rejectForm.post(`/compensation/review-entries/${rejectEntry.id}/reject`, {
            onSuccess: () => setRejectEntry(null),
        });
    }

    const canEdit = ["active", "review"].includes(cycle.status);

    const summary = {
        total:    entries.length,
        approved: entries.filter((e) => e.status === "approved").length,
        pending:  entries.filter((e) => e.status === "pending").length,
    };

    return (
        <MainLayout activePage="compensation-reviews">
            <Head title={`Review: ${cycle.name}`} />

            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{cycle.name}</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {cycle.review_start_date} → {cycle.review_end_date}
                            {" · effective "}{cycle.effective_date}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {cycle.status === "draft" && (
                            <Button size="sm" className="gap-1.5"
                                onClick={() => {
                                    if (!confirm("Activate cycle and populate entries for all active employees?")) return;
                                    router.post(`/compensation/reviews/${cycle.id}/activate`, {}, { preserveScroll: true });
                                }}>
                                <Play className="h-3.5 w-3.5" /> Activate
                            </Button>
                        )}
                        {["active", "review"].includes(cycle.status) && (
                            <Button size="sm" variant="outline" className="gap-1.5"
                                onClick={() => {
                                    if (!confirm("Close this review cycle? No further changes can be made.")) return;
                                    router.post(`/compensation/reviews/${cycle.id}/close`, {}, { preserveScroll: true });
                                }}>
                                <Lock className="h-3.5 w-3.5" /> Close Cycle
                            </Button>
                        )}
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-2xl font-bold">{summary.total}</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Entries</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-2xl font-bold text-green-600">{summary.approved}</p>
                            <p className="text-xs text-muted-foreground mt-1">Approved</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
                            <p className="text-xs text-muted-foreground mt-1">Pending</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Entries table */}
                <div className="rounded-lg border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="text-right">Current Gross</TableHead>
                                <TableHead className="text-right">Proposed</TableHead>
                                <TableHead className="text-right">Merit %</TableHead>
                                <TableHead>Recommendation</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-32" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        No entries yet. Activate the cycle to populate entries.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>
                                            <p className="text-sm font-medium">{entry.employee_name}</p>
                                            <p className="text-xs text-muted-foreground">{entry.department}</p>
                                        </TableCell>
                                        <TableCell className="text-right text-sm">{entry.current_salary}</TableCell>
                                        <TableCell className="text-right text-sm">
                                            {entry.proposed_salary ?? <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {entry.merit_basis_points > 0 ? `${entry.merit_percent}%` : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {entry.recommendation
                                                ? RECOMMENDATION_LABELS[entry.recommendation]
                                                : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${STATUS_COLOURS[entry.status] ?? ""}`}>
                                                {entry.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 justify-end">
                                                {canEdit && entry.status !== "approved" && (
                                                    <Button size="sm" variant="ghost" className="h-7 px-2"
                                                        onClick={() => openEdit(entry)}>
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {entry.status === "submitted" && (
                                                    <>
                                                        <Button size="sm" variant="ghost"
                                                            className="h-7 px-2 text-green-600 hover:text-green-600"
                                                            onClick={() => handleApprove(entry)}>
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost"
                                                            className="h-7 px-2 text-destructive hover:text-destructive"
                                                            onClick={() => setRejectEntry(entry)}>
                                                            <XCircle className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit entry dialog */}
            <Dialog open={editEntry !== null} onOpenChange={(o) => !o && setEditEntry(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Entry — {editEntry?.employee_name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Proposed Gross (₦)</Label>
                            <Input type="number" min="0" step="0.01"
                                value={(editForm.data.proposed_salary_kobo / 100).toFixed(2)}
                                onChange={(e) => editForm.setData("proposed_salary_kobo",
                                    Math.round(parseFloat(e.target.value || "0") * 100))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Merit % (basis points, e.g. 500 = 5.00%)</Label>
                            <Input type="number" min="0" max="50000"
                                value={editForm.data.merit_basis_points}
                                onChange={(e) => editForm.setData("merit_basis_points", Number(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Recommendation</Label>
                            <Select value={editForm.data.recommendation}
                                onValueChange={(v) => editForm.setData("recommendation", v as Recommendation)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(RECOMMENDATION_LABELS).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Rationale</Label>
                            <Textarea rows={3} value={editForm.data.rationale}
                                onChange={(e) => editForm.setData("rationale", e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? "Saving…" : "Save & Submit"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reject dialog */}
            <Dialog open={rejectEntry !== null} onOpenChange={(o) => !o && setRejectEntry(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Reject Entry — {rejectEntry?.employee_name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRejectSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Reason (optional)</Label>
                            <Textarea rows={3} value={rejectForm.data.rationale}
                                onChange={(e) => rejectForm.setData("rationale", e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setRejectEntry(null)}>Cancel</Button>
                            <Button type="submit" variant="destructive" disabled={rejectForm.processing}>
                                {rejectForm.processing ? "Rejecting…" : "Reject Entry"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
