import { Head, router, useForm } from "@inertiajs/react";
import { Plus, Eye, MessageSquare, Users, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
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
import type { FeedbackRequest, FeedbackType, FeedbackStatus } from "@/types/feedback";

interface Employee {
    id:          number;
    name:        string;
    employee_id: string;
    department?: string;
    position?:   string;
}

interface Props {
    requests:  FeedbackRequest[];
    employees: Employee[];
    canManage: boolean;
}

const TYPE_LABELS: Record<FeedbackType, string> = {
    "360":      "360°",
    peer:       "Peer",
    upward:     "Upward",
    downward:   "Downward",
};

const TYPE_CLASSES: Record<FeedbackType, string> = {
    "360":    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    peer:     "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    upward:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    downward: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const STATUS_CLASSES: Record<FeedbackStatus, string> = {
    pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

type RequestForm = {
    subject_id: string;
    type:       FeedbackType | "";
    due_date:   string;
    message:    string;
};

const BLANK: RequestForm = {
    subject_id: "",
    type:       "",
    due_date:   "",
    message:    "",
};

export default function FeedbackRequestsPage({ requests, employees, canManage }: Props) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<RequestForm>(BLANK);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route("feedback.requests.store"), {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    function handleCancel(id: number) {
        if (!confirm("Cancel this feedback request?")) return;
        router.post(route("feedback.requests.cancel", id));
    }

    return (
        <>
            <Head title="Feedback Requests" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-foreground">360° Feedback</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage peer, upward, and downward feedback requests
                        </p>
                    </div>
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                New Request
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>New Feedback Request</SheetTitle>
                            </SheetHeader>
                            <form onSubmit={submit} className="space-y-5 mt-6">
                                {/* Subject */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="subject_id">Employee to Review</Label>
                                    <Select
                                        value={data.subject_id}
                                        onValueChange={(v) => setData("subject_id", v)}
                                    >
                                        <SelectTrigger id="subject_id">
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
                                    {errors.subject_id && (
                                        <p className="text-sm text-destructive">{errors.subject_id}</p>
                                    )}
                                </div>

                                {/* Type */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="type">Feedback Type</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={(v) => setData("type", v as FeedbackType)}
                                    >
                                        <SelectTrigger id="type">
                                            <SelectValue placeholder="Select type…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="peer">Peer</SelectItem>
                                            <SelectItem value="360">360°</SelectItem>
                                            <SelectItem value="upward">Upward</SelectItem>
                                            <SelectItem value="downward">Downward</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-destructive">{errors.type}</p>
                                    )}
                                </div>

                                {/* Due Date */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="due_date">Due Date (optional)</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData("due_date", e.target.value)}
                                    />
                                    {errors.due_date && (
                                        <p className="text-sm text-destructive">{errors.due_date}</p>
                                    )}
                                </div>

                                {/* Message */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="message">Context / Message (optional)</Label>
                                    <Textarea
                                        id="message"
                                        rows={3}
                                        placeholder="Provide context for the respondent…"
                                        value={data.message}
                                        onChange={(e) => setData("message", e.target.value)}
                                    />
                                    {errors.message && (
                                        <p className="text-sm text-destructive">{errors.message}</p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" disabled={processing} className="flex-1">
                                        {processing ? "Creating…" : "Create Request"}
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
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {(["pending", "completed", "cancelled"] as FeedbackStatus[]).map((s) => {
                        const count = requests.filter((r) => r.status === s).length;
                        return (
                            <Card key={s} className="shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-sm text-muted-foreground capitalize">{s}</p>
                                    <p className="text-2xl font-semibold text-foreground">{count}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-semibold text-foreground">{requests.length}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MessageSquare className="w-4 h-4" />
                            Feedback Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                <Users className="w-10 h-10 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No feedback requests yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create a new request to start gathering 360° feedback.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subject</TableHead>
                                            {canManage && <TableHead>Requester</TableHead>}
                                            <TableHead>Type</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Responses</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">
                                                    {r.subject?.name ?? "—"}
                                                    <span className="ml-1.5 text-xs text-muted-foreground">
                                                        {r.subject?.employee_id}
                                                    </span>
                                                </TableCell>
                                                {canManage && (
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {r.requester?.name ?? "—"}
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <Badge className={TYPE_CLASSES[r.type]}>
                                                        {TYPE_LABELS[r.type]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {r.due_date ?? "—"}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {r.responses_count}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={STATUS_CLASSES[r.status]}>
                                                        {r.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.visit(route("feedback.requests.show", r.id))
                                                        }
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View
                                                    </Button>
                                                    {r.status === "pending" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleCancel(r.id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
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

FeedbackRequestsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
