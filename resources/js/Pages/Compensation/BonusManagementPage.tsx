import { Head, router, useForm } from "@inertiajs/react";
import { Plus, CheckCircle2, DollarSign, Trash2 } from "lucide-react";
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
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type { BonusPlanRow, BonusType } from "@/types/compensation";

interface Employee {
    id: number;
    name: string;
    employee_id: string;
    department: string | null;
}

interface AwardRow {
    id: number;
    employee_name: string;
    department: string | null;
    amount: string;
    amount_kobo: number;
    rationale: string | null;
    status: string;
    approved_at: string | null;
}

interface BonusPlanDetail extends BonusPlanRow {
    awards?: AwardRow[];
}

interface Props {
    plans:     BonusPlanDetail[];
    employees: Employee[];
}

const BONUS_TYPE_LABELS: Record<BonusType, string> = {
    annual:      "Annual",
    performance: "Performance",
    spot:        "Spot",
    referral:    "Referral",
    retention:   "Retention",
    signing:     "Signing",
    other:       "Other",
};

const STATUS_COLOURS: Record<string, string> = {
    draft:  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    closed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    paid:   "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const AWARD_COLOURS: Record<string, string> = {
    draft:    "bg-gray-100 text-gray-600",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    paid:     "bg-purple-100 text-purple-800",
};

type PlanForm = {
    name: string; bonus_type: string; period_label: string;
    total_budget_kobo: string; payout_date: string; description: string;
};

const BLANK_PLAN: PlanForm = {
    name: "", bonus_type: "annual", period_label: "",
    total_budget_kobo: "0", payout_date: "", description: "",
};

export default function BonusManagementPage({ plans, employees }: Props) {
    const [planOpen, setPlanOpen] = useState(false);
    const [awardPlan, setAwardPlan] = useState<BonusPlanDetail | null>(null);

    const planForm = useForm<PlanForm>(BLANK_PLAN);
    const awardForm = useForm({
        user_id: "",
        amount_kobo: "0",
        rationale: "",
    });

    function handlePlanSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.post("/compensation/bonus", {
            ...planForm.data,
            total_budget_kobo: Math.round(parseFloat(planForm.data.total_budget_kobo || "0") * 100),
        }, {
            onSuccess: () => { setPlanOpen(false); planForm.setData(BLANK_PLAN); },
            onError: (errs) => planForm.setError(errs as any),
        });
    }

    function handleAwardSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!awardPlan) return;
        router.post(`/compensation/bonus/${awardPlan.id}/awards`, {
            ...awardForm.data,
            amount_kobo: Math.round(parseFloat(awardForm.data.amount_kobo || "0") * 100),
        }, {
            onSuccess: () => awardForm.setData({ user_id: "", amount_kobo: "0", rationale: "" }),
            onError: (errs) => awardForm.setError(errs as any),
        });
    }

    return (
        <MainLayout activePage="compensation-bonus">
            <Head title="Bonus Management" />

            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Bonus Management</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create bonus plans, award individual bonuses, and track approvals.
                        </p>
                    </div>
                    <Button onClick={() => setPlanOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> New Plan
                    </Button>
                </div>

                {plans.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No bonus plans yet.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {plans.map((plan) => (
                            <Card key={plan.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div>
                                            <CardTitle className="text-base">{plan.name}</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {BONUS_TYPE_LABELS[plan.bonus_type]}
                                                {plan.period_label ? ` · ${plan.period_label}` : ""}
                                                {plan.payout_date ? ` · payout ${plan.payout_date}` : ""}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOURS[plan.status] ?? ""}`}>
                                                {plan.status}
                                            </span>
                                            {plan.status === "draft" && (
                                                <Button size="sm" variant="outline"
                                                    onClick={() => router.post(`/compensation/bonus/${plan.id}/activate`, {}, { preserveScroll: true })}>
                                                    Activate
                                                </Button>
                                            )}
                                            {plan.status === "active" && (
                                                <>
                                                    <Button size="sm" variant="outline" className="gap-1.5"
                                                        onClick={() => setAwardPlan(plan)}>
                                                        <Plus className="h-3.5 w-3.5" /> Add Award
                                                    </Button>
                                                    <Button size="sm" variant="outline"
                                                        onClick={() => {
                                                            if (!confirm("Close this bonus plan?")) return;
                                                            router.post(`/compensation/bonus/${plan.id}/close`, {}, { preserveScroll: true });
                                                        }}>
                                                        Close
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Budget bar */}
                                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>Budget: <strong className="text-foreground">{plan.total_budget}</strong></span>
                                        <span>Committed: <strong className="text-foreground">{plan.committed}</strong></span>
                                        <span>Remaining: <strong className="text-green-700 dark:text-green-400">{plan.remaining}</strong></span>
                                    </div>
                                </CardHeader>

                                {plan.awards && plan.awards.length > 0 && (
                                    <CardContent className="pt-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Employee</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="w-28" />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {plan.awards.map((award) => (
                                                    <TableRow key={award.id}>
                                                        <TableCell>
                                                            <p className="text-sm">{award.employee_name}</p>
                                                            <p className="text-xs text-muted-foreground">{award.department}</p>
                                                        </TableCell>
                                                        <TableCell className="text-right text-sm font-medium">
                                                            {award.amount}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${AWARD_COLOURS[award.status] ?? ""}`}>
                                                                {award.status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-end gap-1">
                                                                {award.status === "draft" && (
                                                                    <>
                                                                        <Button size="sm" variant="ghost"
                                                                            className="h-7 px-2 text-green-600 hover:text-green-600"
                                                                            onClick={() => router.post(`/compensation/bonus-awards/${award.id}/approve`, {}, { preserveScroll: true })}>
                                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost"
                                                                            className="h-7 px-2 text-destructive hover:text-destructive"
                                                                            onClick={() => router.delete(`/compensation/bonus-awards/${award.id}`, { preserveScroll: true })}>
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {award.status === "approved" && (
                                                                    <Button size="sm" variant="ghost"
                                                                        className="h-7 px-2 gap-1 text-xs"
                                                                        onClick={() => router.post(`/compensation/bonus-awards/${award.id}/mark-paid`, {}, { preserveScroll: true })}>
                                                                        <DollarSign className="h-3 w-3" /> Paid
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create bonus plan dialog */}
            <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Create Bonus Plan</DialogTitle></DialogHeader>
                    <form onSubmit={handlePlanSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Plan Name *</Label>
                            <Input placeholder="e.g. Q4 2026 Performance Bonus" value={planForm.data.name}
                                onChange={(e) => planForm.setData("name", e.target.value)} />
                            {planForm.errors.name && <p className="text-xs text-destructive">{planForm.errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Type *</Label>
                                <Select value={planForm.data.bonus_type}
                                    onValueChange={(v) => planForm.setData("bonus_type", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(BONUS_TYPE_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Period</Label>
                                <Input placeholder="e.g. FY2026" value={planForm.data.period_label}
                                    onChange={(e) => planForm.setData("period_label", e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Total Budget (₦)</Label>
                                <Input type="number" min="0" step="0.01" value={planForm.data.total_budget_kobo}
                                    onChange={(e) => planForm.setData("total_budget_kobo", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Payout Date</Label>
                                <Input type="date" value={planForm.data.payout_date}
                                    onChange={(e) => planForm.setData("payout_date", e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea rows={2} value={planForm.data.description}
                                onChange={(e) => planForm.setData("description", e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setPlanOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={planForm.processing}>
                                {planForm.processing ? "Creating…" : "Create Plan"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add award dialog */}
            <Dialog open={awardPlan !== null} onOpenChange={(o) => !o && setAwardPlan(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add Award — {awardPlan?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAwardSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Employee *</Label>
                            <Select value={awardForm.data.user_id}
                                onValueChange={(v) => awardForm.setData("user_id", v)}>
                                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)}>
                                            {emp.name} ({emp.employee_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Amount (₦) *</Label>
                            <Input type="number" min="0" step="0.01" value={awardForm.data.amount_kobo}
                                onChange={(e) => awardForm.setData("amount_kobo", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Rationale</Label>
                            <Textarea rows={2} value={awardForm.data.rationale}
                                onChange={(e) => awardForm.setData("rationale", e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setAwardPlan(null)}>Cancel</Button>
                            <Button type="submit" disabled={awardForm.processing}>
                                {awardForm.processing ? "Saving…" : "Save Award"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
