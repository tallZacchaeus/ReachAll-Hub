import { Head, router, useForm } from "@inertiajs/react";
import {
    ShieldCheck, Users, AlertCircle, CheckCircle2, Plus, Edit, Trash2, Send,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type {
    BenefitEnrollmentRow, BenefitPlan, EmployeeDependent, OpenWindow,
} from "@/types/benefits";

interface Props {
    enrollments:     BenefitEnrollmentRow[];
    dependents:      EmployeeDependent[];
    open_window:     OpenWindow | null;
    available_plans: BenefitPlan[];
}

const PLAN_TYPE_LABELS: Record<string, string> = {
    hmo: "HMO", pension: "Pension", life_insurance: "Life Insurance",
    disability: "Disability", other: "Other",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
    spouse: "Spouse", child: "Child", parent: "Parent", sibling: "Sibling", other: "Other",
};

function DependentForm({
    initial, onSubmit, onCancel, processing,
}: {
    initial?: Partial<EmployeeDependent>;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    processing: boolean;
}) {
    const form = useForm({
        name: initial?.name ?? "",
        relationship: initial?.relationship ?? "spouse",
        date_of_birth: initial?.date_of_birth ?? "",
        gender: initial?.gender ?? "",
        notes: initial?.notes ?? "",
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form.data); }} className="space-y-4">
            <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input value={form.data.name} onChange={(e) => form.setData("name", e.target.value)} />
                {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Relationship *</Label>
                    <Select value={form.data.relationship} onValueChange={(v) => form.setData("relationship", v as EmployeeDependent["relationship"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <Select value={form.data.gender || "none"} onValueChange={(v) => form.setData("gender", v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.data.date_of_birth}
                    onChange={(e) => form.setData("date_of_birth", e.target.value)} />
            </div>
            <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.data.notes}
                    onChange={(e) => form.setData("notes", e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={processing}>
                    {processing ? "Saving…" : "Save Dependent"}
                </Button>
            </div>
        </form>
    );
}

export default function MyBenefitsPage({ enrollments, dependents, open_window, available_plans }: Props) {
    const [depOpen, setDepOpen] = useState(false);
    const [editDep, setEditDep] = useState<EmployeeDependent | null>(null);
    const [depProcessing, setDepProcessing] = useState(false);

    function handleAddDependent(data: any) {
        setDepProcessing(true);
        router.post("/benefits/my-benefits/dependents", data, {
            onFinish: () => { setDepProcessing(false); setDepOpen(false); },
        });
    }

    function handleEditDependent(dep: EmployeeDependent, data: any) {
        setDepProcessing(true);
        router.put(`/benefits/my-benefits/dependents/${dep.id}`, data, {
            onFinish: () => { setDepProcessing(false); setEditDep(null); },
        });
    }

    function handleRemoveDependent(dep: EmployeeDependent) {
        if (!confirm(`Remove ${dep.name} as a dependent?`)) return;
        router.delete(`/benefits/my-benefits/dependents/${dep.id}`, { preserveScroll: true });
    }

    function handleElection(windowId: number, planId: number, election: "enroll" | "waive") {
        router.post("/benefits/my-benefits/election", {
            enrollment_window_id: windowId,
            benefit_plan_id: planId,
            election,
        }, { preserveScroll: true });
    }

    function handleSubmitElections(windowId: number) {
        if (!confirm("Submit all your elections? You won't be able to change them after submission.")) return;
        router.post("/benefits/my-benefits/submit", { enrollment_window_id: windowId }, { preserveScroll: true });
    }

    const myElectionMap = Object.fromEntries(
        (open_window?.my_elections ?? []).map((el) => [el.plan_id, el])
    );
    const allSubmitted = open_window !== null &&
        (open_window.my_elections?.length ?? 0) > 0 &&
        open_window.my_elections.every((el) => el.status !== "draft");

    return (
        <MainLayout activePage="my-benefits">
            <Head title="My Benefits" />

            <div className="p-6 space-y-8 max-w-3xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Benefits</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your active benefit enrollments and registered dependents.
                    </p>
                </div>

                {/* Open enrollment window */}
                {open_window && (
                    <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                Open Enrollment — {open_window.name}
                            </CardTitle>
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Window closes {open_window.close_date} &nbsp;·&nbsp; Elections effective {open_window.effective_date}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {open_window.description && (
                                <p className="text-sm text-muted-foreground">{open_window.description}</p>
                            )}

                            <div className="space-y-2">
                                {available_plans.map((plan) => {
                                    const el = myElectionMap[plan.id];
                                    const submitted = el && el.status !== "draft";
                                    return (
                                        <div key={plan.id}
                                            className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5">
                                            <div>
                                                <p className="text-sm font-medium">{plan.name}</p>
                                                <p className="text-xs text-muted-foreground">{plan.provider}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {el && (
                                                    <Badge variant={el.election === "enroll" ? "default" : "outline"}
                                                        className="text-xs">
                                                        {el.election === "enroll" ? "Enroll" : "Waive"} — {el.status}
                                                    </Badge>
                                                )}
                                                {!submitted && (
                                                    <>
                                                        <Button size="sm" variant={el?.election === "enroll" ? "default" : "outline"}
                                                            className="h-7 text-xs"
                                                            onClick={() => handleElection(open_window.id, plan.id, "enroll")}>
                                                            Enroll
                                                        </Button>
                                                        {plan.is_waivable && (
                                                            <Button size="sm" variant={el?.election === "waive" ? "destructive" : "outline"}
                                                                className="h-7 text-xs"
                                                                onClick={() => handleElection(open_window.id, plan.id, "waive")}>
                                                                Waive
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {!allSubmitted && (
                                <Button
                                    className="gap-2 w-full"
                                    disabled={open_window.my_elections.length === 0}
                                    onClick={() => handleSubmitElections(open_window.id)}
                                >
                                    <Send className="h-4 w-4" />
                                    Submit My Elections
                                </Button>
                            )}

                            {allSubmitted && (
                                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Your elections have been submitted for processing.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Active enrollments */}
                <section className="space-y-3">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Active Benefits
                    </h2>
                    {enrollments.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                            No active benefit enrollments. Enroll during an open enrollment window or contact HR.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {enrollments.map((e) => (
                                <Card key={e.id}>
                                    <CardContent className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="font-medium text-sm">{e.plan_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {PLAN_TYPE_LABELS[e.plan_type] ?? e.plan_type}
                                                {e.provider ? ` · ${e.provider}` : ""}
                                                {" · since "}{e.effective_date}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            {e.employee_contribution !== "₦0.00" && (
                                                <p>Your contribution: <strong>{e.employee_contribution}/mo</strong></p>
                                            )}
                                            {e.member_id && <p>ID: {e.member_id}</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* Dependents */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4" /> Dependents
                        </h2>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDepOpen(true)}>
                            <Plus className="h-3.5 w-3.5" /> Add Dependent
                        </Button>
                    </div>

                    {dependents.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                            No dependents registered yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {dependents.map((dep) => (
                                <Card key={dep.id}>
                                    <CardContent className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="font-medium text-sm">{dep.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {RELATIONSHIP_LABELS[dep.relationship] ?? dep.relationship}
                                                {dep.date_of_birth ? ` · DOB ${dep.date_of_birth}` : ""}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="ghost" className="gap-1"
                                                onClick={() => setEditDep(dep)}>
                                                <Edit className="h-3.5 w-3.5" /> Edit
                                            </Button>
                                            <Button size="sm" variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveDependent(dep)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Add dependent dialog */}
            <Dialog open={depOpen} onOpenChange={setDepOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Dependent</DialogTitle></DialogHeader>
                    <DependentForm
                        onSubmit={handleAddDependent}
                        onCancel={() => setDepOpen(false)}
                        processing={depProcessing}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit dependent dialog */}
            <Dialog open={editDep !== null} onOpenChange={(o) => !o && setEditDep(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Edit Dependent — {editDep?.name}</DialogTitle></DialogHeader>
                    {editDep && (
                        <DependentForm
                            initial={editDep}
                            onSubmit={(data) => handleEditDependent(editDep, data)}
                            onCancel={() => setEditDep(null)}
                            processing={depProcessing}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
