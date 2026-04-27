import { Head, router, useForm } from "@inertiajs/react";
import { Search, Plus, Edit } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import type { PayGrade } from "@/types/payroll";

interface EmployeeRow {
    id: number;
    name: string;
    employee_id: string;
    department: string | null;
    role: string;
    salary_id: number | null;
    gross: string | null;
    basic: string | null;
    effective_date: string | null;
}

interface Props {
    employees: EmployeeRow[];
    payGrades: PayGrade[];
    filters: { search?: string };
}

export default function SalaryManagementPage({ employees, payGrades, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [editEmployee, setEditEmployee] = useState<EmployeeRow | null>(null);

    const form = useForm<{
        user_id: number | null;
        pay_grade_id: number | null;
        basic_naira: string;
        housing_naira: string;
        transport_naira: string;
        other_allowances_naira: string;
        nhf_enrolled: boolean;
        effective_date: string;
        notes: string;
    }>({
        user_id: null,
        pay_grade_id: null,
        basic_naira: "",
        housing_naira: "",
        transport_naira: "",
        other_allowances_naira: "0",
        nhf_enrolled: false,
        effective_date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    function openEdit(emp: EmployeeRow) {
        setEditEmployee(emp);
        form.setData("user_id", emp.id);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get("/payroll/salaries", { search: search || undefined }, { preserveState: true, replace: true });
    }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        form.post("/payroll/salaries", {
            onSuccess: () => setEditEmployee(null),
        });
    }

    return (
        <MainLayout activePage="payroll-salaries">
            <Head title="Salary Management" />

            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Salary Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Set monthly salary components for each employee. All amounts in Naira.
                    </p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Search by name or employee ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-72"
                    />
                    <Button type="submit" variant="outline" size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Monthly Gross</TableHead>
                                    <TableHead>Effective From</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            No employees found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((emp) => (
                                        <TableRow key={emp.id}>
                                            <TableCell>
                                                <p className="font-medium text-sm">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground">{emp.employee_id}</p>
                                            </TableCell>
                                            <TableCell className="text-sm">{emp.department ?? "—"}</TableCell>
                                            <TableCell>
                                                <span className="text-xs capitalize text-muted-foreground">{emp.role}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {emp.gross ?? (
                                                    <span className="text-amber-600 dark:text-amber-400 text-xs">Not set</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">{emp.effective_date ?? "—"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5"
                                                    onClick={() => openEdit(emp)}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                    {emp.salary_id ? "Update" : "Set Salary"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Edit/Set salary dialog */}
                <Dialog open={editEmployee !== null} onOpenChange={(o) => !o && setEditEmployee(null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editEmployee?.salary_id ? "Update Salary" : "Set Salary"} — {editEmployee?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Pay grade */}
                            <div className="space-y-1.5">
                                <Label>Pay Grade (optional)</Label>
                                <Select
                                    value={form.data.pay_grade_id != null ? String(form.data.pay_grade_id) : "none"}
                                    onValueChange={(v) => form.setData("pay_grade_id", v === "none" ? null : Number(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="No grade assigned" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No grade</SelectItem>
                                        {payGrades.map((g) => (
                                            <SelectItem key={g.id} value={String(g.id)}>
                                                {g.code} — {g.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Salary components */}
                            <div className="grid grid-cols-2 gap-3">
                                {(
                                    [
                                        { key: "basic_naira",            label: "Basic Salary (₦/month) *" },
                                        { key: "housing_naira",          label: "Housing Allowance (₦/month) *" },
                                        { key: "transport_naira",        label: "Transport Allowance (₦/month) *" },
                                        { key: "other_allowances_naira", label: "Other Allowances (₦/month)" },
                                    ] as const
                                ).map(({ key, label }) => (
                                    <div key={key} className="space-y-1.5">
                                        <Label>{label}</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={form.data[key]}
                                            onChange={(e) => form.setData(key, e.target.value)}
                                            placeholder="0.00"
                                        />
                                        {form.errors[key] && (
                                            <p className="text-xs text-destructive">{form.errors[key]}</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="nhf"
                                    checked={form.data.nhf_enrolled}
                                    onCheckedChange={(v) => form.setData("nhf_enrolled", Boolean(v))}
                                />
                                <Label htmlFor="nhf">NHF enrolled (2.5% of basic deducted)</Label>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Effective Date *</Label>
                                <Input
                                    type="date"
                                    value={form.data.effective_date}
                                    onChange={(e) => form.setData("effective_date", e.target.value)}
                                />
                                {form.errors.effective_date && (
                                    <p className="text-xs text-destructive">{form.errors.effective_date}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Notes</Label>
                                <Textarea
                                    rows={2}
                                    value={form.data.notes}
                                    onChange={(e) => form.setData("notes", e.target.value)}
                                    placeholder="Optional — e.g. Promotion effective April 2026"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <Button type="button" variant="outline" onClick={() => setEditEmployee(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? "Saving…" : "Save Salary"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
