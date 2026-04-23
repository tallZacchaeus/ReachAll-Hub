import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, Calendar } from "lucide-react";
import type { BenefitPlan, BenefitEnrollmentWindow } from "@/types/benefits";

interface Props {
    plans: (BenefitPlan & { enrollments_count: number })[];
    windows: BenefitEnrollmentWindow[];
}

const PLAN_TYPE_LABELS: Record<string, string> = {
    hmo:            "HMO",
    pension:        "Pension",
    life_insurance: "Life Insurance",
    disability:     "Disability",
    other:          "Other",
};

const CONTRIBUTION_TYPE_LABELS: Record<string, string> = {
    none:                 "None",
    fixed:                "Fixed (kobo/month)",
    percentage_of_basic:  "% of Basic",
    percentage_of_gross:  "% of Gross",
};

const WINDOW_STATUS_COLOURS: Record<string, string> = {
    upcoming:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    open:       "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    closed:     "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

type PlanForm = {
    type: string; name: string; provider: string; description: string;
    employee_contribution_type: string; employee_contribution_value: string;
    employer_contribution_type: string; employer_contribution_value: string;
    is_waivable: boolean; is_active: boolean; sort_order: string;
};

const BLANK_PLAN: PlanForm = {
    type: "hmo", name: "", provider: "", description: "",
    employee_contribution_type: "none", employee_contribution_value: "0",
    employer_contribution_type: "none", employer_contribution_value: "0",
    is_waivable: true, is_active: true, sort_order: "0",
};

export default function BenefitPlansPage({ plans, windows }: Props) {
    const [planOpen, setPlanOpen]   = useState(false);
    const [editing, setEditing]     = useState<BenefitPlan | null>(null);
    const [windowOpen, setWindowOpen] = useState(false);

    const planForm = useForm<PlanForm>(BLANK_PLAN);

    const windowForm = useForm<{
        name: string; description: string;
        open_date: string; close_date: string; effective_date: string;
    }>({ name: "", description: "", open_date: "", close_date: "", effective_date: "" });

    function openCreate() {
        planForm.setData(BLANK_PLAN);
        setEditing(null);
        setPlanOpen(true);
    }

    function openEdit(plan: BenefitPlan) {
        planForm.setData({
            type: plan.type, name: plan.name, provider: plan.provider ?? "",
            description: plan.description ?? "",
            employee_contribution_type: plan.employee_contribution_type,
            employee_contribution_value: String(plan.employee_contribution_value),
            employer_contribution_type: plan.employer_contribution_type,
            employer_contribution_value: String(plan.employer_contribution_value),
            is_waivable: plan.is_waivable, is_active: plan.is_active,
            sort_order: String(plan.sort_order),
        });
        setEditing(plan);
        setPlanOpen(true);
    }

    function handlePlanSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            planForm.put(`/benefits/plans/${editing.id}`, { onSuccess: () => setPlanOpen(false) });
        } else {
            planForm.post("/benefits/plans", { onSuccess: () => setPlanOpen(false) });
        }
    }

    function handleDelete(plan: BenefitPlan) {
        if (!confirm(`Delete "${plan.name}"?`)) return;
        router.delete(`/benefits/plans/${plan.id}`, { preserveScroll: true });
    }

    function handleWindowSubmit(e: React.FormEvent) {
        e.preventDefault();
        windowForm.post("/benefits/windows", { onSuccess: () => setWindowOpen(false) });
    }

    function handleWindowAction(window: BenefitEnrollmentWindow, action: string) {
        if (action === "open")    router.post(`/benefits/windows/${window.id}/open`,    {}, { preserveScroll: true });
        if (action === "process") {
            if (!confirm("Process all submitted elections and close this window?")) return;
            router.post(`/benefits/windows/${window.id}/process`, {}, { preserveScroll: true });
        }
        if (action === "delete")  router.delete(`/benefits/windows/${window.id}`, { preserveScroll: true });
    }

    return (
        <MainLayout activePage="benefits-plans">
            <Head title="Benefit Plans" />

            <div className="p-6 space-y-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Benefits Administration</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage benefit plans, enrollments, and open enrollment windows</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setWindowOpen(true)} className="gap-2">
                            <Calendar className="h-4 w-4" /> New Window
                        </Button>
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="h-4 w-4" /> Add Plan
                        </Button>
                    </div>
                </div>

                {/* Plan grid */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Benefit Plans</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base">{plan.name}</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5">{plan.provider}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs shrink-0">
                                            {PLAN_TYPE_LABELS[plan.type] ?? plan.type}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {plan.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{plan.enrollments_count} active enrollments</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => openEdit(plan)}>
                                            <Edit className="h-3.5 w-3.5" /> Edit
                                        </Button>
                                        <Button size="sm" variant="ghost"
                                            className="gap-1.5 text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(plan)}>
                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                        </Button>
                                        <Button size="sm" variant="outline" asChild className="ml-auto">
                                            <a href="/benefits/enrollments">Enrollments</a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {plans.length === 0 && (
                            <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">
                                No benefit plans yet. Add one to get started.
                            </p>
                        )}
                    </div>
                </section>

                {/* Enrollment windows */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Enrollment Windows</h2>
                    {windows.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No enrollment windows yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {windows.map((w) => (
                                <Card key={w.id}>
                                    <CardContent className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="font-medium text-sm">{w.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {w.open_date} → {w.close_date} &nbsp;·&nbsp; effective {w.effective_date}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WINDOW_STATUS_COLOURS[w.status] ?? ""}`}>
                                                {w.status}
                                            </span>
                                            {w.status === "upcoming" && (
                                                <Button size="sm" variant="outline" onClick={() => handleWindowAction(w, "open")}>Open</Button>
                                            )}
                                            {w.status === "open" && (
                                                <Button size="sm" onClick={() => handleWindowAction(w, "process")}>Process</Button>
                                            )}
                                            {w.status === "upcoming" && (
                                                <Button size="sm" variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleWindowAction(w, "delete")}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* Plan create/edit dialog */}
                <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editing ? "Edit Benefit Plan" : "Add Benefit Plan"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handlePlanSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Type *</Label>
                                    <Select value={planForm.data.type} onValueChange={(v) => planForm.setData("type", v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PLAN_TYPE_LABELS).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Sort Order</Label>
                                    <Input type="number" min="0" value={planForm.data.sort_order}
                                        onChange={(e) => planForm.setData("sort_order", e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Plan Name *</Label>
                                <Input value={planForm.data.name} onChange={(e) => planForm.setData("name", e.target.value)} />
                                {planForm.errors.name && <p className="text-xs text-destructive">{planForm.errors.name}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Provider</Label>
                                <Input value={planForm.data.provider} onChange={(e) => planForm.setData("provider", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Description</Label>
                                <Textarea rows={2} value={planForm.data.description}
                                    onChange={(e) => planForm.setData("description", e.target.value)} />
                            </div>

                            {/* Contributions */}
                            {(["employee", "employer"] as const).map((side) => (
                                <div key={side} className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="capitalize">{side} Contribution Type</Label>
                                        <Select
                                            value={planForm.data[`${side}_contribution_type`]}
                                            onValueChange={(v) => planForm.setData(`${side}_contribution_type`, v)}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(CONTRIBUTION_TYPE_LABELS).map(([k, v]) => (
                                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="capitalize">{side} Value</Label>
                                        <Input type="number" min="0"
                                            value={planForm.data[`${side}_contribution_value`]}
                                            onChange={(e) => planForm.setData(`${side}_contribution_value`, e.target.value)} />
                                    </div>
                                </div>
                            ))}

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <Checkbox checked={planForm.data.is_waivable}
                                        onCheckedChange={(v) => planForm.setData("is_waivable", Boolean(v))} />
                                    Waivable
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <Checkbox checked={planForm.data.is_active}
                                        onCheckedChange={(v) => planForm.setData("is_active", Boolean(v))} />
                                    Active
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <Button type="button" variant="outline" onClick={() => setPlanOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={planForm.processing}>
                                    {planForm.processing ? "Saving…" : editing ? "Update Plan" : "Create Plan"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Enrollment window dialog */}
                <Dialog open={windowOpen} onOpenChange={setWindowOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create Enrollment Window</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleWindowSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Window Name *</Label>
                                <Input value={windowForm.data.name} onChange={(e) => windowForm.setData("name", e.target.value)}
                                    placeholder="e.g. Annual Open Enrollment 2026" />
                                {windowForm.errors.name && <p className="text-xs text-destructive">{windowForm.errors.name}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Description</Label>
                                <Textarea rows={2} value={windowForm.data.description}
                                    onChange={(e) => windowForm.setData("description", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {([
                                    { key: "open_date",      label: "Opens *" },
                                    { key: "close_date",     label: "Closes *" },
                                    { key: "effective_date", label: "Effective *" },
                                ] as const).map(({ key, label }) => (
                                    <div key={key} className="space-y-1.5">
                                        <Label>{label}</Label>
                                        <Input type="date" value={windowForm.data[key]}
                                            onChange={(e) => windowForm.setData(key, e.target.value)} />
                                        {windowForm.errors[key] && <p className="text-xs text-destructive">{windowForm.errors[key]}</p>}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <Button type="button" variant="outline" onClick={() => setWindowOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={windowForm.processing}>
                                    {windowForm.processing ? "Creating…" : "Create Window"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
