import { Head, router, useForm } from "@inertiajs/react";
import { Plus, Eye, CalendarDays, Users } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
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
import type { OneOnOne, OneOnOneStatus } from "@/types/feedback";

interface Employee {
    id:          number;
    name:        string;
    employee_id: string;
    department?: string;
}

interface Props {
    oneOnOnes:   OneOnOne[];
    employees:   Employee[];
    canManage:   boolean;
    authUserId:  number;
}

const STATUS_CLASSES: Record<OneOnOneStatus, string> = {
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

type OneOnOneForm = {
    employee_id:  string;
    scheduled_at: string;
    agenda:       string;
};

const BLANK: OneOnOneForm = {
    employee_id:  "",
    scheduled_at: "",
    agenda:       "",
};

function formatDateTime(iso: string): string {
    try {
        return new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

export default function OneOnOnesPage({ oneOnOnes, employees, canManage, authUserId }: Props) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<OneOnOneForm>(BLANK);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route("feedback.1on1s.store"), {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    const canSchedule = canManage || employees.length > 0;

    return (
        <>
            <Head title="1:1 Meetings" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-foreground">1:1 Meetings</h1>
                        <p className="text-muted-foreground mt-1">
                            Schedule and manage one-on-one check-ins
                        </p>
                    </div>
                    {canSchedule && (
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Schedule 1:1
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Schedule 1:1 Meeting</SheetTitle>
                                </SheetHeader>
                                <form onSubmit={submit} className="space-y-5 mt-6">
                                    {/* Employee */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="employee_id">Employee</Label>
                                        <Select
                                            value={data.employee_id}
                                            onValueChange={(v) => setData("employee_id", v)}
                                        >
                                            <SelectTrigger id="employee_id">
                                                <SelectValue placeholder="Select employee…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees.map((e) => (
                                                    <SelectItem key={e.id} value={String(e.id)}>
                                                        {e.name}
                                                        {e.department ? ` — ${e.department}` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.employee_id && (
                                            <p className="text-sm text-destructive">{errors.employee_id}</p>
                                        )}
                                    </div>

                                    {/* Date & Time */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="scheduled_at">Date & Time</Label>
                                        <Input
                                            id="scheduled_at"
                                            type="datetime-local"
                                            value={data.scheduled_at}
                                            onChange={(e) => setData("scheduled_at", e.target.value)}
                                        />
                                        {errors.scheduled_at && (
                                            <p className="text-sm text-destructive">{errors.scheduled_at}</p>
                                        )}
                                    </div>

                                    {/* Agenda */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="agenda">Agenda (optional)</Label>
                                        <Textarea
                                            id="agenda"
                                            rows={4}
                                            placeholder="Topics to cover in this meeting…"
                                            value={data.agenda}
                                            onChange={(e) => setData("agenda", e.target.value)}
                                        />
                                        {errors.agenda && (
                                            <p className="text-sm text-destructive">{errors.agenda}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button type="submit" disabled={processing} className="flex-1">
                                            {processing ? "Scheduling…" : "Schedule Meeting"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => { reset(); setOpen(false); }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </SheetContent>
                        </Sheet>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {(["scheduled", "completed", "cancelled"] as OneOnOneStatus[]).map((s) => {
                        const count = oneOnOnes.filter((o) => o.status === s).length;
                        return (
                            <Card key={s} className="shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-muted-foreground capitalize">{s}</p>
                                    <p className="text-2xl font-semibold text-foreground">{count}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Table */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarDays className="w-4 h-4" />
                            Meetings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {oneOnOnes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                <Users className="w-10 h-10 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No 1:1 meetings scheduled yet.</p>
                                {canSchedule && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Schedule a meeting with a direct report to get started.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Employee</TableHead>
                                            <TableHead>Manager</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="hidden md:table-cell">Agenda</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {oneOnOnes.map((o) => (
                                            <TableRow key={o.id}>
                                                <TableCell className="font-medium">
                                                    {o.employee?.name ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {o.manager?.name ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {formatDateTime(o.scheduled_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={STATUS_CLASSES[o.status]}>
                                                        {o.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                                                    {o.agenda ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.visit(route("feedback.1on1s.show", o.id))
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OneOnOnesPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
