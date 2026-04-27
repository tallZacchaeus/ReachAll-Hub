import { Head, router, useForm } from "@inertiajs/react";
import { Plus, Eye, Receipt, Send } from "lucide-react";
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
import type { ExpenseClaim, ExpenseCategory, ExpenseStatus } from "@/types/expenses";

interface PaginatedClaims {
    data:         ExpenseClaim[];
    current_page: number;
    last_page:    number;
    total:        number;
    links:        { url: string | null; label: string; active: boolean }[];
}

interface Props {
    claims: PaginatedClaims;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    travel:        "Travel",
    accommodation: "Accommodation",
    meals:         "Meals",
    equipment:     "Equipment",
    training:      "Training",
    communication: "Communication",
    medical:       "Medical",
    other:         "Other",
};

const STATUS_CLASSES: Record<ExpenseStatus, string> = {
    draft:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    submitted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    paid:      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const STATUS_STEPS: ExpenseStatus[] = ["draft", "submitted", "approved", "paid"];

type ClaimForm = {
    title:         string;
    description:   string;
    category:      ExpenseCategory | "";
    currency:      string;
    amount:        string;
    exchange_rate: string;
    expense_date:  string;
};

const BLANK: ClaimForm = {
    title:         "",
    description:   "",
    category:      "",
    currency:      "NGN",
    amount:        "",
    exchange_rate: "",
    expense_date:  "",
};

function formatNgn(value: number): string {
    return new Intl.NumberFormat("en-NG", {
        style:    "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
    }).format(value);
}

export default function MyExpensesPage({ claims }: Props) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<ClaimForm>(BLANK);

    const showExchangeRate = data.currency !== "NGN" && data.currency !== "";

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route("expenses.store"), {
            onSuccess: () => {
                reset();
                setSheetOpen(false);
            },
        });
    }

    function handleSubmitClaim(id: number) {
        if (!confirm("Submit this expense claim for approval?")) return;
        router.post(route("expenses.submit", id));
    }

    return (
        <>
            <Head title="My Expenses" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-foreground">My Expense Claims</h1>
                        <p className="text-muted-foreground mt-1">
                            Create, upload receipts, and track your expense reimbursements
                        </p>
                    </div>
                    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                New Expense
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>New Expense Claim</SheetTitle>
                            </SheetHeader>
                            <form onSubmit={submit} className="space-y-5 mt-6">
                                {/* Title */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData("title", e.target.value)}
                                        placeholder="e.g. Lagos–Abuja flight for client visit"
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-destructive">{errors.title}</p>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(v) => setData("category", v as ExpenseCategory)}
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select category…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]).map(
                                                ([val, label]) => (
                                                    <SelectItem key={val} value={val}>{label}</SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-sm text-destructive">{errors.category}</p>
                                    )}
                                </div>

                                {/* Currency + Amount */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select
                                            value={data.currency}
                                            onValueChange={(v) => {
                                                setData("currency", v);
                                                if (v === "NGN") setData("exchange_rate", "");
                                            }}
                                        >
                                            <SelectTrigger id="currency">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NGN">NGN</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="GBP">GBP</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="amount">Amount</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={data.amount}
                                            onChange={(e) => setData("amount", e.target.value)}
                                            placeholder="0.00"
                                        />
                                        {errors.amount && (
                                            <p className="text-sm text-destructive">{errors.amount}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Exchange Rate (only when non-NGN) */}
                                {showExchangeRate && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="exchange_rate">
                                            Exchange Rate to NGN
                                        </Label>
                                        <Input
                                            id="exchange_rate"
                                            type="number"
                                            step="0.000001"
                                            min="0.000001"
                                            value={data.exchange_rate}
                                            onChange={(e) => setData("exchange_rate", e.target.value)}
                                            placeholder="e.g. 1600.00 for 1 USD = ₦1,600"
                                        />
                                        {errors.exchange_rate && (
                                            <p className="text-sm text-destructive">{errors.exchange_rate}</p>
                                        )}
                                    </div>
                                )}

                                {/* Expense Date */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="expense_date">Expense Date</Label>
                                    <Input
                                        id="expense_date"
                                        type="date"
                                        value={data.expense_date}
                                        onChange={(e) => setData("expense_date", e.target.value)}
                                    />
                                    {errors.expense_date && (
                                        <p className="text-sm text-destructive">{errors.expense_date}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Textarea
                                        id="description"
                                        rows={3}
                                        value={data.description}
                                        onChange={(e) => setData("description", e.target.value)}
                                        placeholder="Provide context or business justification…"
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    )}
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    You can add receipts after creating the draft.
                                </p>

                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" disabled={processing} className="flex-1">
                                        {processing ? "Saving…" : "Save Draft"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => { reset(); setSheetOpen(false); }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Claims table */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Receipt className="w-4 h-4" />
                            My Claims ({claims.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {claims.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                <Receipt className="w-10 h-10 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No expense claims yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Click "New Expense" to create your first claim.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Progress</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {claims.data.map((c) => {
                                            const stepIndex = STATUS_STEPS.indexOf(
                                                c.status === "rejected" ? "submitted" : c.status,
                                            );
                                            return (
                                                <TableRow key={c.id}>
                                                    <TableCell className="font-medium max-w-[180px] truncate">
                                                        {c.title}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {CATEGORY_LABELS[c.category]}
                                                    </TableCell>
                                                    <TableCell className="text-sm tabular-nums">
                                                        {c.currency !== "NGN" && `${c.currency} `}
                                                        {Number(c.amount).toLocaleString("en-NG", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                        {c.currency !== "NGN" && (
                                                            <span className="ml-1 text-xs text-muted-foreground">
                                                                ({formatNgn(c.amount_ngn)})
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {c.expense_date}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={STATUS_CLASSES[c.status]}>
                                                            {c.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {c.status !== "rejected" ? (
                                                            <div className="flex items-center gap-1 min-w-[120px]">
                                                                {STATUS_STEPS.map((step, i) => (
                                                                    <div
                                                                        key={step}
                                                                        className={[
                                                                            "h-1.5 flex-1 rounded-full transition-colors",
                                                                            i <= stepIndex
                                                                                ? "bg-primary"
                                                                                : "bg-muted",
                                                                        ].join(" ")}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-destructive">Rejected</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    router.visit(route("expenses.show", c.id))
                                                                }
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View
                                                            </Button>
                                                            {c.status === "draft" && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-primary"
                                                                    onClick={() => handleSubmitClaim(c.id)}
                                                                >
                                                                    <Send className="w-4 h-4 mr-1" />
                                                                    Submit
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {claims.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        {claims.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? "default" : "outline"}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

MyExpensesPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
