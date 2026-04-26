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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Target } from "lucide-react";
import type { PipPlan, PipStatus } from "@/types/performance";

interface Employee {
    id:          number;
    name:        string;
    employee_id: string;
    department?: string;
}

interface Props {
    pips:      PipPlan[];
    employees: Employee[];
    canManage: boolean;
    authId:    number;
}

const STATUS_CLASSES: Record<PipStatus, string> = {
    draft:     "bg-muted text-muted-foreground",
    active:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    failed:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

type PipForm = {
    user_id:     string;
    title:       string;
    description: string;
    start_date:  string;
    end_date:    string;
};

const BLANK_PIP: PipForm = {
    user_id:     "",
    title:       "",
    description: "",
    start_date:  "",
    end_date:    "",
};

export default function PipsPage({ pips, employees, canManage, authId }: Props) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<PipForm>(BLANK_PIP);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route("performance.pips.store"), {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    const myPips    = pips.filter((p) => p.user.id === authId);
    const otherPips = pips.filter((p) => p.user.id !== authId);

    return (
        <>
            <Head title="Performance Improvement Plans" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-foreground">Performance Improvement Plans</h1>
                        <p className="text-muted-foreground mt-1">
                            Track structured improvement plans and milestones
                        </p>
                    </div>
                    {canManage && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-brand hover:bg-brand/90 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New PIP
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Create PIP</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submit} className="space-y-4 mt-2">
                                    <div className="space-y-1">
                                        <Label>Employee</Label>
                                        <Select
                                            value={data.user_id}
                                            onValueChange={(v) => setData("user_id", v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employee…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees.map((e) => (
                                                    <SelectItem key={e.id} value={String(e.id)}>
                                                        {e.name}{" "}
                                                        <span className="text-muted-foreground text-xs">
                                                            ({e.employee_id})
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.user_id && (
                                            <p className="text-sm text-destructive">{errors.user_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="pip-title">Title</Label>
                                        <Input
                                            id="pip-title"
                                            value={data.title}
                                            onChange={(e) => setData("title", e.target.value)}
                                            placeholder="e.g. Performance Improvement Plan — Q2 2026"
                                        />
                                        {errors.title && (
                                            <p className="text-sm text-destructive">{errors.title}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="pip-desc">Description (optional)</Label>
                                        <Textarea
                                            id="pip-desc"
                                            value={data.description}
                                            onChange={(e) => setData("description", e.target.value)}
                                            placeholder="Context and goals for this plan…"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="pip-start">Start Date</Label>
                                            <Input
                                                id="pip-start"
                                                type="date"
                                                value={data.start_date}
                                                onChange={(e) => setData("start_date", e.target.value)}
                                            />
                                            {errors.start_date && (
                                                <p className="text-sm text-destructive">{errors.start_date}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="pip-end">End Date</Label>
                                            <Input
                                                id="pip-end"
                                                type="date"
                                                value={data.end_date}
                                                onChange={(e) => setData("end_date", e.target.value)}
                                            />
                                            {errors.end_date && (
                                                <p className="text-sm text-destructive">{errors.end_date}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 bg-brand hover:bg-brand/90 text-white"
                                        >
                                            {processing ? "Creating…" : "Create PIP"}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(["draft", "active", "completed", "failed"] as PipStatus[]).map((s) => {
                        const count = pips.filter((p) => p.status === s).length;
                        return (
                            <Card key={s} className="bg-card shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <Target className="w-7 h-7 text-brand" />
                                    <div>
                                        <p className="text-xl font-semibold text-foreground">{count}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{s}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* My PIPs */}
                {myPips.length > 0 && (
                    <Card className="bg-card shadow-sm border-brand">
                        <CardHeader>
                            <CardTitle className="text-base">My PIPs</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <PipTable pips={myPips} />
                        </CardContent>
                    </Card>
                )}

                {/* All / team PIPs */}
                <Card className="bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">
                            {canManage ? "All PIPs" : "Team PIPs"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <PipTable pips={otherPips.length > 0 ? otherPips : pips} />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function PipTable({ pips }: { pips: PipPlan[] }) {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Milestones</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pips.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                No PIPs found.
                            </TableCell>
                        </TableRow>
                    )}
                    {pips.map((pip) => {
                        const completed = pip.milestones.filter((m) => m.status === "completed").length;
                        return (
                            <TableRow key={pip.id}>
                                <TableCell>
                                    <p className="text-sm font-medium text-foreground">{pip.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{pip.user.employee_id}</p>
                                </TableCell>
                                <TableCell className="text-sm text-foreground max-w-[200px] truncate">
                                    {pip.title}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                    {pip.start_date} — {pip.end_date}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {pip.milestones.length > 0
                                        ? `${completed}/${pip.milestones.length}`
                                        : "—"}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={`text-xs capitalize ${STATUS_CLASSES[pip.status]}`}
                                        variant="outline"
                                    >
                                        {pip.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            router.visit(route("performance.pips.show", pip.id))
                                        }
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

PipsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
