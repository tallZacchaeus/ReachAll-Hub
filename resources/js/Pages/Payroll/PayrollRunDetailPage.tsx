import { Head, router } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Download, FileText, DollarSign } from "lucide-react";
import type { PayrollRun, PayrollEntryRow } from "@/types/payroll";

interface Props {
    run: PayrollRun & {
        total_gross: string;
        total_paye: string;
        total_pension_employee: string;
        total_pension_employer: string;
        total_nhf: string;
        total_nsitf: string;
        total_net: string;
    };
    entries: PayrollEntryRow[];
    can_manage: boolean;
}

const STATUS_COLOURS: Record<string, string> = {
    draft:     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    paid:      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function PayrollRunDetailPage({ run, entries, can_manage }: Props) {
    function post(url: string) {
        router.post(url, {}, { preserveScroll: true });
    }

    return (
        <MainLayout activePage="payroll-runs">
            <Head title={`Payroll — ${run.period_label}`} />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit("/payroll/runs")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Payroll Run — {run.period_label}
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {run.period_start} → {run.period_end} &nbsp;·&nbsp; {run.employee_count} employees
                            </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOURS[run.status] ?? ""}`}>
                            {run.status}
                        </span>
                    </div>

                    {can_manage && (
                        <div className="flex gap-2 flex-wrap">
                            {run.status === "draft" && (
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => post(`/payroll/runs/${run.id}/approve`)}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                </Button>
                            )}
                            {run.status === "approved" && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => post(`/payroll/runs/${run.id}/generate-payslips`)}
                                    >
                                        <FileText className="h-4 w-4" />
                                        Generate Payslips
                                    </Button>
                                    <Button
                                        className="gap-2"
                                        onClick={() => post(`/payroll/runs/${run.id}/mark-paid`)}
                                    >
                                        <DollarSign className="h-4 w-4" />
                                        Mark Paid
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="outline"
                                className="gap-2"
                                asChild
                            >
                                <a href={`/payroll/runs/${run.id}/export-bank`}>
                                    <Download className="h-4 w-4" />
                                    Bank CSV
                                </a>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Gross Payroll", value: run.total_gross },
                        { label: "Total PAYE",    value: run.total_paye },
                        { label: "Pension (Emp)", value: run.total_pension_employee },
                        { label: "Net Payroll",   value: run.total_net },
                    ].map(({ label, value }) => (
                        <Card key={label}>
                            <CardHeader className="pb-1 pt-4 px-4">
                                <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                    {label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4 px-4">
                                <p className="text-lg font-bold font-mono">{value ?? "—"}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Employer costs note */}
                <p className="text-xs text-muted-foreground">
                    Employer costs (not deducted from employees): Pension {run.total_pension_employer} &nbsp;·&nbsp; NSITF {run.total_nsitf} &nbsp;·&nbsp; NHF {run.total_nhf}
                </p>

                {/* Entries table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="text-right">Gross</TableHead>
                                    <TableHead className="text-right">PAYE</TableHead>
                                    <TableHead className="text-right">Pension</TableHead>
                                    <TableHead className="text-right">Other Ded.</TableHead>
                                    <TableHead className="text-right">Net Pay</TableHead>
                                    <TableHead>Payslip</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                            No entries in this run.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <p className="font-medium text-sm">{entry.employee_name}</p>
                                                <p className="text-xs text-muted-foreground">{entry.employee_id}</p>
                                            </TableCell>
                                            <TableCell className="text-sm">{entry.department ?? "—"}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{entry.gross}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-muted-foreground">{entry.paye}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-muted-foreground">{entry.pension_employee}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-muted-foreground">{entry.other_deductions}</TableCell>
                                            <TableCell className="text-right font-mono text-sm font-semibold">{entry.net}</TableCell>
                                            <TableCell>
                                                {entry.payslip_generated ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1 h-7 text-xs"
                                                        asChild
                                                    >
                                                        <a href={`/payroll/payslip/${entry.id}/download`} target="_blank" rel="noreferrer">
                                                            <Download className="h-3 w-3" />
                                                            PDF
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
