import { Head } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Receipt } from "lucide-react";
import type { MyPayslip } from "@/types/payroll";

interface Props {
    payslips: MyPayslip[];
}

const STATUS_COLOUR: Record<string, string> = {
    approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    paid:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

function formatPeriod(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

export default function MyPayslipsPage({ payslips }: Props) {
    return (
        <MainLayout activePage="my-payslips">
            <Head title="My Payslips" />

            <div className="p-6 space-y-6 max-w-3xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Payslips</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your salary statements from approved payroll runs.
                    </p>
                </div>

                {payslips.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No payslips yet</p>
                        <p className="text-sm mt-1">
                            Payslips will appear here once a payroll run is approved.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payslips.map((p) => (
                            <Card key={p.id}>
                                <CardContent className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {formatPeriod(p.period_start)}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLOUR[p.status] ?? ""}`}>
                                                    {p.status}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Net: <strong>{p.net}</strong>
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Gross: {p.gross}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {p.payslip_generated ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 shrink-0"
                                            asChild
                                        >
                                            <a href={p.download_url} target="_blank" rel="noreferrer">
                                                <Download className="h-3.5 w-3.5" />
                                                Download PDF
                                            </a>
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground shrink-0">PDF pending</span>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
