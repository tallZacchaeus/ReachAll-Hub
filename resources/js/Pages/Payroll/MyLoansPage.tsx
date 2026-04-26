import { Head } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PayrollLoan } from "@/types/payroll";

interface Props {
    loans: PayrollLoan[];
}

const STATUS_COLOURS: Record<string, string> = {
    pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    active:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const TYPE_LABELS: Record<string, string> = {
    loan:    "Loan",
    advance: "Salary Advance",
};

function formatNgn(kobo: number): string {
    return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function repaidPercent(loan: PayrollLoan): number {
    if (loan.principal_kobo === 0) return 100;
    const repaid = loan.principal_kobo - loan.remaining_kobo;
    return Math.min(100, Math.round((repaid / loan.principal_kobo) * 100));
}

export default function MyLoansPage({ loans }: Props) {
    const active    = loans.filter((l) => l.status === "active");
    const pending   = loans.filter((l) => l.status === "pending");
    const completed = loans.filter((l) => l.status === "completed");
    const cancelled = loans.filter((l) => l.status === "cancelled");

    const sections: { label: string; items: PayrollLoan[] }[] = [
        { label: "Active", items: active },
        { label: "Pending Approval", items: pending },
        { label: "Completed", items: completed },
        { label: "Cancelled", items: cancelled },
    ];

    return (
        <MainLayout activePage="my-loans">
            <Head title="My Loans & Advances" />

            <div className="p-6 space-y-8 max-w-3xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Loans &amp; Advances</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View the status and repayment progress of your salary loans and advances.
                    </p>
                </div>

                {loans.length === 0 && (
                    <Card>
                        <CardContent className="py-16 text-center text-muted-foreground">
                            You have no loan or advance records.
                        </CardContent>
                    </Card>
                )}

                {sections.map(({ label, items }) =>
                    items.length === 0 ? null : (
                        <section key={label} className="space-y-3">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                {label}
                            </h2>
                            <div className="space-y-3">
                                {items.map((loan) => {
                                    const pct      = repaidPercent(loan);
                                    const repaid   = loan.principal_kobo - loan.remaining_kobo;

                                    return (
                                        <Card key={loan.id}>
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-0.5">
                                                        <CardTitle className="text-base">
                                                            {TYPE_LABELS[loan.type] ?? loan.type}
                                                        </CardTitle>
                                                        {loan.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {loan.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${STATUS_COLOURS[loan.status] ?? ""}`}
                                                    >
                                                        {loan.status}
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Summary grid */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Principal</p>
                                                        <p className="font-mono font-medium">{formatNgn(loan.principal_kobo)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Remaining</p>
                                                        <p className="font-mono font-medium">{formatNgn(loan.remaining_kobo)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Monthly</p>
                                                        <p className="font-mono font-medium">{formatNgn(loan.monthly_instalment_kobo)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Repaid</p>
                                                        <p className="font-mono font-medium">{formatNgn(repaid)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Start Date</p>
                                                        <p className="font-medium">{loan.start_date}</p>
                                                    </div>
                                                    {loan.approved_by && (
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Approved By</p>
                                                            <p className="font-medium">{loan.approved_by.name}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Repayment progress bar */}
                                                {loan.status !== "cancelled" && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>Repayment progress</span>
                                                            <span>{pct}%</span>
                                                        </div>
                                                        <Progress value={pct} className="h-2" />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </section>
                    )
                )}
            </div>
        </MainLayout>
    );
}
