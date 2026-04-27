import { Head, Link, router, useForm } from "@inertiajs/react";
import { Plus, ArrowRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type { CompensationReviewCycle, CycleType } from "@/types/compensation";

interface Props {
    cycles: CompensationReviewCycle[];
}

const CYCLE_TYPE_LABELS: Record<CycleType, string> = {
    annual:    "Annual",
    mid_year:  "Mid-Year",
    off_cycle: "Off-Cycle",
    promotion: "Promotion",
};

const STATUS_COLOURS: Record<string, string> = {
    draft:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    active:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    review:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    approved: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    closed:   "bg-gray-100 text-gray-500 dark:bg-gray-900/50 dark:text-gray-500",
};

type CycleForm = {
    name: string; cycle_type: string;
    review_start_date: string; review_end_date: string; effective_date: string;
    budget_kobo: string; notes: string;
};

const BLANK: CycleForm = {
    name: "", cycle_type: "annual",
    review_start_date: "", review_end_date: "", effective_date: "",
    budget_kobo: "0", notes: "",
};

export default function CompensationReviewPage({ cycles }: Props) {
    const [open, setOpen] = useState(false);
    const form = useForm<CycleForm>(BLANK);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.post("/compensation/reviews", {
            ...form.data,
            budget_kobo: Math.round(parseFloat(form.data.budget_kobo || "0") * 100),
        }, {
            onSuccess: () => { setOpen(false); form.setData(BLANK); },
            onError: (errs) => form.setError(errs as any),
        });
    }

    return (
        <MainLayout activePage="compensation-reviews">
            <Head title="Compensation Review Cycles" />

            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Compensation Review Cycles</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage merit review, promotion, and off-cycle compensation changes.
                        </p>
                    </div>
                    <Button onClick={() => setOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> New Cycle
                    </Button>
                </div>

                {cycles.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No review cycles yet. Create one to begin a compensation review.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {cycles.map((cycle) => (
                            <Card key={cycle.id}>
                                <CardContent className="flex items-center gap-4 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{cycle.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {CYCLE_TYPE_LABELS[cycle.cycle_type]}
                                            {" · "}{cycle.review_start_date} → {cycle.review_end_date}
                                            {" · effective "}{cycle.effective_date}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground hidden md:block">
                                        {cycle.entries_count ?? 0} entries
                                    </p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOURS[cycle.status] ?? ""}`}>
                                        {cycle.status}
                                    </span>
                                    <Button size="sm" variant="outline" asChild className="gap-1.5 shrink-0">
                                        <Link href={`/compensation/reviews/${cycle.id}`}>
                                            View <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Create Review Cycle</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Cycle Name *</Label>
                            <Input placeholder="e.g. Annual Review FY2026" value={form.data.name}
                                onChange={(e) => form.setData("name", e.target.value)} />
                            {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Type *</Label>
                            <Select value={form.data.cycle_type}
                                onValueChange={(v) => form.setData("cycle_type", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CYCLE_TYPE_LABELS).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { key: "review_start_date" as const, label: "Starts *" },
                                { key: "review_end_date"   as const, label: "Ends *"   },
                                { key: "effective_date"    as const, label: "Effective *" },
                            ]).map(({ key, label }) => (
                                <div key={key} className="space-y-1.5">
                                    <Label>{label}</Label>
                                    <Input type="date" value={form.data[key]}
                                        onChange={(e) => form.setData(key, e.target.value)} />
                                    {form.errors[key] && <p className="text-xs text-destructive">{form.errors[key]}</p>}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Merit Budget (₦)</Label>
                            <Input type="number" min="0" step="0.01" value={form.data.budget_kobo}
                                onChange={(e) => form.setData("budget_kobo", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea rows={2} value={form.data.notes}
                                onChange={(e) => form.setData("notes", e.target.value)} />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? "Creating…" : "Create Cycle"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
