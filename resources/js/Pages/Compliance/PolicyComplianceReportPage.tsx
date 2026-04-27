import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/layouts/MainLayout';
import type { PolicyCategory } from '@/types/compliance';

interface OutstandingUser {
    id: number;
    name: string;
    employee_id: string;
}

interface PolicyReportRow {
    id: number;
    title: string;
    category: PolicyCategory;
    current_version: string;
    published_at: string | null;
    total_employees: number;
    acknowledged_count: number;
    outstanding_count: number;
    acknowledgement_pct: number;
    outstanding_users: OutstandingUser[];
}

interface Props {
    report: PolicyReportRow[];
}

function ProgressBar({ pct }: { pct: number }) {
    const clamped = Math.min(100, Math.max(0, pct));
    const colorClass =
        clamped >= 80 ? 'bg-green-500' :
        clamped >= 50 ? 'bg-yellow-500' :
        'bg-red-500';

    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 overflow-hidden rounded-full bg-muted h-2">
                <div
                    className={`h-2 rounded-full transition-all ${colorClass}`}
                    style={{ width: `${clamped}%` }}
                />
            </div>
            <span className="w-12 text-right text-sm font-medium">{clamped}%</span>
        </div>
    );
}

function PolicyCard({ row }: { row: PolicyReportRow }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-base">{row.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {row.category} &middot; Version {row.current_version}
                            {row.published_at && (
                                <> &middot; Published {new Date(row.published_at).toLocaleDateString()}</>
                            )}
                        </p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                            {row.acknowledged_count} / {row.total_employees}
                        </p>
                        <p className="text-xs text-muted-foreground">acknowledged</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <ProgressBar pct={row.acknowledgement_pct} />

                {row.outstanding_count > 0 && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setExpanded(v => !v)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <span>{expanded ? '▲' : '▼'}</span>
                            <span>
                                {row.outstanding_count} employee{row.outstanding_count !== 1 ? 's' : ''} outstanding
                            </span>
                        </button>

                        {expanded && (
                            <div className="mt-2 rounded border bg-muted/30 divide-y max-h-64 overflow-y-auto">
                                {row.outstanding_users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                        <span>{u.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono">{u.employee_id}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {row.outstanding_count === 0 && (
                    <p className="text-xs text-green-700 font-medium">All active employees have acknowledged this version.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function PolicyComplianceReportPage({ report }: Props) {
    const totalPolicies    = report.length;
    const fullyAcked       = report.filter(r => r.outstanding_count === 0).length;
    const totalOutstanding = report.reduce((sum, r) => sum + r.outstanding_count, 0);

    return (
        <MainLayout title="Policy Compliance Report">
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Policy Compliance Report</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Acknowledgement status for all active policy versions
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => router.get(route('compliance.policies.index'))}>
                        Back to Policies
                    </Button>
                </div>

                {/* Summary strip */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Policies</p>
                            <p className="mt-1 text-2xl font-bold">{totalPolicies}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Fully Acknowledged</p>
                            <p className="mt-1 text-2xl font-bold text-green-700">{fullyAcked}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Outstanding ACKs</p>
                            <p className="mt-1 text-2xl font-bold text-amber-600">{totalOutstanding}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Per-policy breakdown */}
                {report.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No active policies with published versions found.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {report.map(row => (
                            <PolicyCard key={row.id} row={row} />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
