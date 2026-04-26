import { useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Eye, Download } from "lucide-react";
import type { PayrollRun } from "@/types/payroll";

interface PaginatedRuns {
    data: (PayrollRun & { entries_count: number })[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    runs: PaginatedRuns;
    can_manage?: boolean;
}

const STATUS_COLOURS: Record<string, string> = {
    draft:     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    paid:      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function PayrollRunsPage({ runs, can_manage = false }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [yearReportOpen, setYearReportOpen] = useState(false);
    const [reportYear, setReportYear] = useState(String(new Date().getFullYear() - 1));

    const form = useForm<{
        period_start: string;
        period_end: string;
        is_off_cycle: boolean;
        notes: string;
    }>({
        period_start: "",
        period_end: "",
        is_off_cycle: false,
        notes: "",
    });

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        form.post("/payroll/runs", {
            onSuccess: () => {
                setCreateOpen(false);
                form.reset();
            },
        });
    }

    return (
        <MainLayout activePage="payroll-runs">
            <Head title="Payroll Runs" />

            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Payroll Runs</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage monthly and off-cycle payroll runs
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                    {can_manage && (
                        <Dialog open={yearReportOpen} onOpenChange={setYearReportOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Year-End Tax Report
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Download Year-End PAYE Report</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="report-year">Calendar Year</Label>
                                        <Input
                                            id="report-year"
                                            type="number"
                                            min={2020}
                                            max={new Date().getFullYear()}
                                            value={reportYear}
                                            onChange={(e) => setReportYear(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Exports a CSV with per-employee PAYE, pension, NHF, NSITF, and net pay totals.
                                        </p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setYearReportOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                window.location.href = `/payroll/year-end-report?year=${reportYear}`;
                                                setYearReportOpen(false);
                                            }}
                                        >
                                            <Download className="h-4 w-4 mr-1.5" />
                                            Download CSV
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Run
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create Payroll Run</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Period Start *</Label>
                                        <Input
                                            type="date"
                                            value={form.data.period_start}
                                            onChange={(e) => form.setData("period_start", e.target.value)}
                                        />
                                        {form.errors.period_start && (
                                            <p className="text-xs text-destructive">{form.errors.period_start}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Period End *</Label>
                                        <Input
                                            type="date"
                                            value={form.data.period_end}
                                            onChange={(e) => form.setData("period_end", e.target.value)}
                                        />
                                        {form.errors.period_end && (
                                            <p className="text-xs text-destructive">{form.errors.period_end}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="off_cycle"
                                        checked={form.data.is_off_cycle}
                                        onCheckedChange={(v) => form.setData("is_off_cycle", Boolean(v))}
                                    />
                                    <Label htmlFor="off_cycle">Off-cycle run</Label>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Notes</Label>
                                    <Textarea
                                        rows={2}
                                        value={form.data.notes}
                                        onChange={(e) => form.setData("notes", e.target.value)}
                                        placeholder="Optional notes for this run"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={form.processing}>
                                        {form.processing ? "Creating…" : "Create Run"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead>Total Gross</TableHead>
                                    <TableHead>Total Net</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            No payroll runs yet. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    runs.data.map((run) => (
                                        <TableRow key={run.id}>
                                            <TableCell>
                                                <div className="font-medium">{run.period_label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {run.period_start} → {run.period_end}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {run.is_off_cycle ? (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                        Off-cycle
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Regular</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{run.employee_count}</TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {run.total_gross_kobo
                                                    ? `₦${(run.total_gross_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {run.total_net_kobo
                                                    ? `₦${(run.total_net_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOURS[run.status] ?? ""}`}>
                                                    {run.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5"
                                                    onClick={() => router.visit(`/payroll/runs/${run.id}`)}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {runs.links && runs.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {runs.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? "default" : "outline"}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
