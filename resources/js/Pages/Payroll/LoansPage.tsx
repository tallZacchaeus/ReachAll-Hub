import { Head, router, useForm } from "@inertiajs/react";
import { Plus, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { PayrollLoan } from "@/types/payroll";

interface Employee {
    id: number;
    name: string;
    employee_id: string;
}

interface PaginatedLoans {
    data: PayrollLoan[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    loans: PaginatedLoans;
    employees: Employee[];
}

const STATUS_COLOURS: Record<string, string> = {
    pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    active:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const TYPE_COLOURS: Record<string, string> = {
    loan:    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    advance: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

function formatNgn(kobo: number): string {
    return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export default function LoansPage({ loans, employees }: Props) {
    const [sheetOpen, setSheetOpen] = useState(false);

    const form = useForm<{
        user_id: string;
        type: "loan" | "advance";
        description: string;
        principal_kobo: string;
        monthly_instalment_kobo: string;
        start_date: string;
        notes: string;
    }>({
        user_id: "",
        type: "loan",
        description: "",
        principal_kobo: "",
        monthly_instalment_kobo: "",
        start_date: "",
        notes: "",
    });

    function handleStore(e: React.FormEvent) {
        e.preventDefault();
        form.post("/payroll/loans", {
            onSuccess: () => {
                setSheetOpen(false);
                form.reset();
            },
        });
    }

    function handleApprove(loan: PayrollLoan) {
        router.post(`/payroll/loans/${loan.id}/approve`);
    }

    function handleCancel(loan: PayrollLoan) {
        if (!window.confirm(`Cancel this ${loan.type} for ${loan.user?.name}?`)) return;
        router.post(`/payroll/loans/${loan.id}/cancel`);
    }

    return (
        <MainLayout activePage="payroll-loans">
            <Head title="Loans & Advances" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Loans &amp; Advances</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage employee salary loans and advances
                        </p>
                    </div>

                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Loan / Advance
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Create Loan / Advance</SheetTitle>
                            </SheetHeader>

                            <form onSubmit={handleStore} className="mt-6 space-y-4">
                                {/* Employee */}
                                <div className="space-y-1.5">
                                    <Label>Employee *</Label>
                                    <Select
                                        value={form.data.user_id}
                                        onValueChange={(v) => form.setData("user_id", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={String(emp.id)}>
                                                    {emp.name} ({emp.employee_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.user_id && (
                                        <p className="text-xs text-destructive">{form.errors.user_id}</p>
                                    )}
                                </div>

                                {/* Type */}
                                <div className="space-y-1.5">
                                    <Label>Type *</Label>
                                    <Select
                                        value={form.data.type}
                                        onValueChange={(v) => form.setData("type", v as "loan" | "advance")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="loan">Loan</SelectItem>
                                            <SelectItem value="advance">Salary Advance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {form.errors.type && (
                                        <p className="text-xs text-destructive">{form.errors.type}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <Label>Description</Label>
                                    <Input
                                        value={form.data.description}
                                        onChange={(e) => form.setData("description", e.target.value)}
                                        placeholder="e.g. Emergency medical loan"
                                        maxLength={300}
                                    />
                                    {form.errors.description && (
                                        <p className="text-xs text-destructive">{form.errors.description}</p>
                                    )}
                                </div>

                                {/* Principal (kobo) */}
                                <div className="space-y-1.5">
                                    <Label>Principal Amount (kobo) *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.data.principal_kobo}
                                        onChange={(e) => form.setData("principal_kobo", e.target.value)}
                                        placeholder="e.g. 500000 = ₦5,000"
                                    />
                                    {form.data.principal_kobo && (
                                        <p className="text-xs text-muted-foreground">
                                            = {formatNgn(Number(form.data.principal_kobo))}
                                        </p>
                                    )}
                                    {form.errors.principal_kobo && (
                                        <p className="text-xs text-destructive">{form.errors.principal_kobo}</p>
                                    )}
                                </div>

                                {/* Monthly instalment (kobo) */}
                                <div className="space-y-1.5">
                                    <Label>Monthly Instalment (kobo) *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={form.data.monthly_instalment_kobo}
                                        onChange={(e) => form.setData("monthly_instalment_kobo", e.target.value)}
                                        placeholder="e.g. 100000 = ₦1,000/month"
                                    />
                                    {form.data.monthly_instalment_kobo && (
                                        <p className="text-xs text-muted-foreground">
                                            = {formatNgn(Number(form.data.monthly_instalment_kobo))} per month
                                        </p>
                                    )}
                                    {form.errors.monthly_instalment_kobo && (
                                        <p className="text-xs text-destructive">{form.errors.monthly_instalment_kobo}</p>
                                    )}
                                </div>

                                {/* Start date */}
                                <div className="space-y-1.5">
                                    <Label>Deduction Start Date *</Label>
                                    <Input
                                        type="date"
                                        value={form.data.start_date}
                                        onChange={(e) => form.setData("start_date", e.target.value)}
                                    />
                                    {form.errors.start_date && (
                                        <p className="text-xs text-destructive">{form.errors.start_date}</p>
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="space-y-1.5">
                                    <Label>Notes</Label>
                                    <Textarea
                                        rows={3}
                                        value={form.data.notes}
                                        onChange={(e) => form.setData("notes", e.target.value)}
                                        placeholder="Internal notes (optional)"
                                    />
                                    {form.errors.notes && (
                                        <p className="text-xs text-destructive">{form.errors.notes}</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={form.processing}>
                                        {form.processing ? "Creating…" : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Principal</TableHead>
                                        <TableHead>Remaining</TableHead>
                                        <TableHead>Monthly</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loans.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                                No loans or advances recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        loans.data.map((loan) => (
                                            <TableRow key={loan.id}>
                                                <TableCell>
                                                    <div className="font-medium">{loan.user?.name}</div>
                                                    <div className="text-xs text-muted-foreground">{loan.user?.employee_id}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_COLOURS[loan.type] ?? ""}`}>
                                                        {loan.type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {formatNgn(loan.principal_kobo)}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {formatNgn(loan.remaining_kobo)}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {formatNgn(loan.monthly_instalment_kobo)}
                                                </TableCell>
                                                <TableCell className="text-sm">{loan.start_date}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOURS[loan.status] ?? ""}`}>
                                                        {loan.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {loan.status === "pending" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="gap-1 text-green-700 hover:text-green-800"
                                                                onClick={() => handleApprove(loan)}
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                                Approve
                                                            </Button>
                                                        )}
                                                        {(loan.status === "pending" || loan.status === "active") && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="gap-1 text-destructive hover:text-destructive"
                                                                onClick={() => handleCancel(loan)}
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />
                                                                Cancel
                                                            </Button>
                                                        )}
                                                        {(loan.status === "completed" || loan.status === "cancelled") && (
                                                            <span className="text-xs text-muted-foreground px-2">—</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {loans.links && loans.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {loans.links.map((link, i) => (
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
