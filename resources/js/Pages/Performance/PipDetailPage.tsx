import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import type { PipPlan, PipMilestone, PipStatus, MilestoneStatus } from "@/types/performance";

interface Props {
    pip:       PipPlan;
    canManage: boolean;
    authId:    number;
}

const PIP_STATUS_CLASSES: Record<PipStatus, string> = {
    draft:     "bg-muted text-muted-foreground",
    active:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    failed:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const MILESTONE_STATUS_CLASSES: Record<MilestoneStatus, string> = {
    pending:   "bg-muted text-muted-foreground",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    missed:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const MILESTONE_ICONS: Record<MilestoneStatus, React.ReactNode> = {
    pending:   <Clock className="w-4 h-4 text-muted-foreground" />,
    completed: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />,
    missed:    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
};

type MilestoneForm = { title: string; description: string; due_date: string; notes: string };
const BLANK_MS: MilestoneForm = { title: "", description: "", due_date: "", notes: "" };

type PipUpdateForm = { status: PipStatus; outcome: string; outcome_date: string };

export default function PipDetailPage({ pip, canManage, authId }: Props) {
    const [addOpen, setAddOpen] = useState(false);
    const [updateOpen, setUpdateOpen] = useState(false);

    const msForm = useForm<MilestoneForm>(BLANK_MS);
    const pipForm = useForm<PipUpdateForm>({
        status:       pip.status,
        outcome:      pip.outcome ?? "",
        outcome_date: pip.outcome_date ?? "",
    });

    function addMilestone(e: React.FormEvent) {
        e.preventDefault();
        msForm.post(route("performance.pips.milestones.store", pip.id), {
            onSuccess: () => {
                msForm.reset();
                setAddOpen(false);
            },
        });
    }

    function updatePip(e: React.FormEvent) {
        e.preventDefault();
        pipForm.put(route("performance.pips.update", pip.id), {
            onSuccess: () => setUpdateOpen(false),
        });
    }

    function markMilestone(milestone: PipMilestone, status: MilestoneStatus) {
        router.put(
            route("performance.pips.milestones.update", { pipPlan: pip.id, pipMilestone: milestone.id }),
            { status, notes: milestone.notes ?? "" },
        );
    }

    const completedCount = pip.milestones.filter((m) => m.status === "completed").length;
    const totalCount     = pip.milestones.length;

    return (
        <>
            <Head title={pip.title} />
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Back */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 text-muted-foreground"
                    onClick={() => router.visit(route("performance.pips.index"))}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    All PIPs
                </Button>

                {/* PIP Header */}
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-semibold text-foreground">{pip.title}</h2>
                                    <Badge
                                        className={`text-xs capitalize ${PIP_STATUS_CLASSES[pip.status]}`}
                                        variant="outline"
                                    >
                                        {pip.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Employee:{" "}
                                    <span className="text-foreground font-medium">{pip.user.name}</span>{" "}
                                    <span className="text-muted-foreground">({pip.user.employee_id})</span>
                                </p>
                                {pip.initiated_by && (
                                    <p className="text-sm text-muted-foreground">
                                        Initiated by:{" "}
                                        <span className="text-foreground">{pip.initiated_by.name}</span>
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Period: {pip.start_date} — {pip.end_date}
                                </p>
                            </div>

                            {canManage && (
                                <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            Update Status
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Update PIP</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={updatePip} className="space-y-4 mt-2">
                                            <div className="space-y-1">
                                                <Label>Status</Label>
                                                <Select
                                                    value={pipForm.data.status}
                                                    onValueChange={(v) =>
                                                        pipForm.setData("status", v as PipStatus)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(["draft", "active", "completed", "failed", "cancelled"] as PipStatus[]).map(
                                                            (s) => (
                                                                <SelectItem key={s} value={s} className="capitalize">
                                                                    {s}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="pip-outcome">Outcome</Label>
                                                <Textarea
                                                    id="pip-outcome"
                                                    value={pipForm.data.outcome}
                                                    onChange={(e) =>
                                                        pipForm.setData("outcome", e.target.value)
                                                    }
                                                    placeholder="Describe the outcome…"
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="pip-outcome-date">Outcome Date</Label>
                                                <Input
                                                    id="pip-outcome-date"
                                                    type="date"
                                                    value={pipForm.data.outcome_date}
                                                    onChange={(e) =>
                                                        pipForm.setData("outcome_date", e.target.value)
                                                    }
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    type="submit"
                                                    disabled={pipForm.processing}
                                                    className="flex-1 bg-brand hover:bg-brand/90 text-white"
                                                >
                                                    {pipForm.processing ? "Saving…" : "Save"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setUpdateOpen(false)}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        {pip.description && (
                            <p className="text-sm text-muted-foreground">{pip.description}</p>
                        )}

                        {pip.outcome && (
                            <div className="p-3 rounded-lg bg-muted border border-border">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Outcome</p>
                                <p className="text-sm text-foreground">{pip.outcome}</p>
                                {pip.outcome_date && (
                                    <p className="text-xs text-muted-foreground mt-1">{pip.outcome_date}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Milestones */}
                <Card className="bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base">Milestones</CardTitle>
                            {totalCount > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {completedCount} of {totalCount} completed
                                </p>
                            )}
                        </div>
                        {canManage && (
                            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Milestone
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Add Milestone</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={addMilestone} className="space-y-4 mt-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="ms-title">Title</Label>
                                            <Input
                                                id="ms-title"
                                                value={msForm.data.title}
                                                onChange={(e) => msForm.setData("title", e.target.value)}
                                                placeholder="Milestone title…"
                                            />
                                            {msForm.errors.title && (
                                                <p className="text-sm text-destructive">{msForm.errors.title}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="ms-desc">Description (optional)</Label>
                                            <Textarea
                                                id="ms-desc"
                                                value={msForm.data.description}
                                                onChange={(e) => msForm.setData("description", e.target.value)}
                                                placeholder="What needs to be achieved…"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="ms-due">Due Date</Label>
                                            <Input
                                                id="ms-due"
                                                type="date"
                                                value={msForm.data.due_date}
                                                onChange={(e) => msForm.setData("due_date", e.target.value)}
                                            />
                                            {msForm.errors.due_date && (
                                                <p className="text-sm text-destructive">{msForm.errors.due_date}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="ms-notes">Notes (optional)</Label>
                                            <Textarea
                                                id="ms-notes"
                                                value={msForm.data.notes}
                                                onChange={(e) => msForm.setData("notes", e.target.value)}
                                                placeholder="Additional notes…"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                type="submit"
                                                disabled={msForm.processing}
                                                className="flex-1 bg-brand hover:bg-brand/90 text-white"
                                            >
                                                {msForm.processing ? "Adding…" : "Add Milestone"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setAddOpen(false)}
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {pip.milestones.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                No milestones yet.{" "}
                                {canManage && "Add one to start tracking progress."}
                            </p>
                        )}
                        {pip.milestones.map((milestone) => (
                            <div
                                key={milestone.id}
                                className="p-4 rounded-lg border border-border bg-muted/30 space-y-2"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <span className="mt-0.5 shrink-0">
                                            {MILESTONE_ICONS[milestone.status]}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                                {milestone.title}
                                            </p>
                                            {milestone.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {milestone.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Due: {milestone.due_date}
                                                {milestone.completed_at && (
                                                    <> · Completed: {milestone.completed_at}</>
                                                )}
                                            </p>
                                            {milestone.notes && (
                                                <p className="text-xs text-muted-foreground mt-1 italic">
                                                    {milestone.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge
                                            className={`text-xs capitalize ${MILESTONE_STATUS_CLASSES[milestone.status]}`}
                                            variant="outline"
                                        >
                                            {milestone.status}
                                        </Badge>
                                        {canManage && milestone.status === "pending" && (
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                    onClick={() => markMilestone(milestone, "completed")}
                                                    title="Mark completed"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={() => markMilestone(milestone, "missed")}
                                                    title="Mark missed"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PipDetailPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
