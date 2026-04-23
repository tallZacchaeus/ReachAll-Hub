import { Head } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck, Banknote, Award, TrendingUp, Users,
} from "lucide-react";
import type {
    SalarySummary, BenefitSummaryRow, BonusSummaryRow, BandSummary,
} from "@/types/compensation";

interface Props {
    salary:                   SalarySummary | null;
    benefits:                 BenefitSummaryRow[];
    total_employer_benefits:  string;
    bonuses:                  BonusSummaryRow[];
    band:                     BandSummary | null;
}

const PLAN_TYPE_LABELS: Record<string, string> = {
    hmo:            "HMO",
    pension:        "Pension",
    life_insurance: "Life Insurance",
    disability:     "Disability",
    other:          "Other",
};

const BONUS_TYPE_LABELS: Record<string, string> = {
    annual: "Annual", performance: "Performance", spot: "Spot",
    referral: "Referral", retention: "Retention", signing: "Signing", other: "Other",
};

export default function TotalRewardsPage({
    salary, benefits, total_employer_benefits, bonuses, band,
}: Props) {
    return (
        <MainLayout activePage="my-rewards">
            <Head title="My Total Rewards" />

            <div className="p-6 space-y-8 max-w-3xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Total Rewards</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        A summary of your full compensation package — pay, benefits, and bonuses.
                    </p>
                </div>

                {/* Base Salary */}
                <section className="space-y-3">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Banknote className="h-4 w-4" /> Base Salary
                    </h2>
                    {salary ? (
                        <Card>
                            <CardContent className="pt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    {[
                                        { label: "Basic",            value: salary.basic },
                                        { label: "Housing",          value: salary.housing },
                                        { label: "Transport",        value: salary.transport },
                                        { label: "Other Allowances", value: salary.other_allowances },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between">
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t pt-3 flex justify-between text-sm font-semibold">
                                    <span>Gross Monthly</span>
                                    <span className="text-lg">{salary.gross}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Effective from {salary.effective_date}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <p className="text-sm text-muted-foreground py-2">
                            No salary record found. Contact HR to set up your salary.
                        </p>
                    )}
                </section>

                {/* Salary Band Position */}
                {band && (
                    <section className="space-y-3">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Pay Band Position
                        </h2>
                        <Card>
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{band.grade}</Badge>
                                    <span className="text-sm font-medium">{band.title}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-xs text-center text-muted-foreground">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{band.min}</p>
                                        <p>Min</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{band.midpoint}</p>
                                        <p>Midpoint</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{band.max}</p>
                                        <p>Max</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 text-xs text-muted-foreground">
                                    <span>Compa-ratio: <strong className="text-foreground">{band.comparatio}</strong></span>
                                    <span>Range position: <strong className="text-foreground">{band.range_position}</strong></span>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Benefits */}
                <section className="space-y-3">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Benefits
                    </h2>
                    {benefits.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No active benefit enrollments.</p>
                    ) : (
                        <div className="space-y-2">
                            {benefits.map((b, i) => (
                                <Card key={i}>
                                    <CardContent className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-medium">{b.plan_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {PLAN_TYPE_LABELS[b.plan_type] ?? b.plan_type}
                                                {b.provider ? ` · ${b.provider}` : ""}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground space-y-0.5">
                                            {b.employee_contribution !== "₦0.00" && (
                                                <p>Your contribution: <strong>{b.employee_contribution}/mo</strong></p>
                                            )}
                                            {b.employer_contribution !== "₦0.00" && (
                                                <p>Employer contribution: <strong>{b.employer_contribution}/mo</strong></p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <p className="text-xs text-muted-foreground text-right">
                                Total employer benefit cost: <strong>{total_employer_benefits}/mo</strong>
                            </p>
                        </div>
                    )}
                </section>

                {/* Bonuses */}
                <section className="space-y-3">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4" /> Bonuses
                    </h2>
                    {bonuses.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No approved bonuses on record.</p>
                    ) : (
                        <div className="space-y-2">
                            {bonuses.map((b, i) => (
                                <Card key={i}>
                                    <CardContent className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-medium">{b.plan_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {BONUS_TYPE_LABELS[b.bonus_type] ?? b.bonus_type}
                                                {b.period ? ` · ${b.period}` : ""}
                                                {b.approved_at ? ` · approved ${b.approved_at}` : ""}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold">{b.amount}</p>
                                            <Badge
                                                variant={b.status === "paid" ? "default" : "outline"}
                                                className="text-xs">
                                                {b.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </MainLayout>
    );
}
