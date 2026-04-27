import { Head, router, useForm } from "@inertiajs/react";
import { Plus, Eye, Calendar, BarChart2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type { ReviewCycle, ReviewCycleType } from "@/types/performance";

interface Props {
    cycles:    ReviewCycle[];
    canManage: boolean;
}

const TYPE_LABELS: Record<ReviewCycleType, string> = {
    annual:    "Annual",
    quarterly: "Quarterly",
    mid_year:  "Mid-Year",
    probation: "Probation",
};

const STATUS_CLASSES: Record<string, string> = {
    draft:  "bg-muted text-muted-foreground",
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    closed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const TYPE_CLASSES: Record<ReviewCycleType, string> = {
    annual:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    quarterly: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    mid_year:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    probation: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

type CycleForm = {
    name: string;
    type: ReviewCycleType | "";
    period_start: string;
    period_end: string;
    description: string;
};

const BLANK: CycleForm = {
    name: "",
    type: "",
    period_start: "",
    period_end: "",
    description: "",
};

export default function ReviewCyclesPage({ cycles, canManage }: Props) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<CycleForm>(BLANK);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route("performance.cycles.store"), {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    return (
        <>
            <Head title="Performance Review Cycles" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-foreground">Performance Reviews</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage review cycles, competency assessments, and PIPs
                        </p>
                    </div>
                    {canManage && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-brand hover:bg-brand/90 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Cycle
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Create Review Cycle</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submit} className="space-y-4 mt-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="name">Cycle Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData("name", e.target.value)}
                                            placeholder="e.g. Annual Review 2026"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label>Type</Label>
                                        <Select
                                            value={data.type}
                                            onValueChange={(v) => setData("type", v as ReviewCycleType)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(Object.entries(TYPE_LABELS) as [ReviewCycleType, string][]).map(
                                                    ([v, l]) => (
                                                        <SelectItem key={v} value={v}>
                                                            {l}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.type && (
                                            <p className="text-sm text-destructive">{errors.type}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="period_start">Period Start</Label>
                                            <Input
                                                id="period_start"
                                                type="date"
                                                value={data.period_start}
                                                onChange={(e) => setData("period_start", e.target.value)}
                                            />
                                            {errors.period_start && (
                                                <p className="text-sm text-destructive">{errors.period_start}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="period_end">Period End</Label>
                                            <Input
                                                id="period_end"
                                                type="date"
                                                value={data.period_end}
                                                onChange={(e) => setData("period_end", e.target.value)}
                                            />
                                            {errors.period_end && (
                                                <p className="text-sm text-destructive">{errors.period_end}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="description">Description (optional)</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData("description", e.target.value)}
                                            placeholder="Describe the purpose or scope of this review cycle…"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 bg-brand hover:bg-brand/90 text-white"
                                        >
                                            {processing ? "Creating…" : "Create Cycle"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setOpen(false)}
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

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(["draft", "active", "closed"] as const).map((s) => {
                        const count = cycles.filter((c) => c.status === s).length;
                        return (
                            <Card key={s} className="bg-card shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <BarChart2 className="w-8 h-8 text-brand" />
                                    <div>
                                        <p className="text-2xl font-semibold text-foreground">{count}</p>
                                        <p className="text-sm text-muted-foreground capitalize">{s} cycles</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Table */}
                <Card className="bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle>All Cycles</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Reviews</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cycles.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                                No review cycles yet.{" "}
                                                {canManage && "Create one to get started."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {cycles.map((cycle) => (
                                        <TableRow key={cycle.id}>
                                            <TableCell className="font-medium text-foreground">
                                                {cycle.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`text-xs ${TYPE_CLASSES[cycle.type]}`}
                                                    variant="outline"
                                                >
                                                    {TYPE_LABELS[cycle.type]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {cycle.period_start} — {cycle.period_end}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {cycle.performance_reviews_count ?? 0}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`text-xs capitalize ${STATUS_CLASSES[cycle.status]}`}
                                                    variant="outline"
                                                >
                                                    {cycle.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.visit(
                                                            route("performance.cycles.show", cycle.id),
                                                        )
                                                    }
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ReviewCyclesPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
