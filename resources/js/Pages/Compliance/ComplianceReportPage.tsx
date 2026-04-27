import { router } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import MainLayout from '@/layouts/MainLayout';
import type { TrainingAssignmentRow, AssignmentStatus } from '@/types/compliance';

interface TrainingOption {
    id: number;
    title: string;
}

interface Stats {
    total_employees: number;
    total_assigned: number;
    completed: number;
    overdue: number;
    pending: number;
}

interface Props {
    assignments: {
        data: TrainingAssignmentRow[];
        links: { url: string | null; label: string; active: boolean }[];
        total: number;
    };
    stats: Stats;
    trainings: TrainingOption[];
    filters: { status?: string; training_id?: string };
}

const STATUS_COLORS: Record<AssignmentStatus | 'all', string> = {
    all:       'bg-muted text-muted-foreground',
    pending:   'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    overdue:   'bg-red-100 text-red-800',
    waived:    'bg-zinc-100 text-zinc-500',
};

const STATUS_OPTIONS = [
    { value: 'all',         label: 'All Statuses' },
    { value: 'pending',     label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed',   label: 'Completed' },
    { value: 'overdue',     label: 'Overdue' },
    { value: 'waived',      label: 'Waived' },
];

function statusBadgeClass(status: string): string {
    return STATUS_COLORS[status as AssignmentStatus] ?? 'bg-muted text-muted-foreground';
}

export default function ComplianceReportPage({ assignments, stats, trainings, filters }: Props) {
    function applyFilter(key: string, value: string) {
        router.get(route('compliance.training-report'), { ...filters, [key]: value }, { preserveState: true, replace: true });
    }

    const completedPct = stats.total_assigned > 0
        ? Math.round((stats.completed / stats.total_assigned) * 100)
        : 0;

    return (
        <MainLayout title="Training Compliance Report">
            <div className="mx-auto max-w-7xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Training Compliance Report</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Organisation-wide view of training assignment status
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <a href={route('compliance.trainings.index')}>Back to Trainings</a>
                        </Button>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Employees</p>
                            <p className="mt-1 text-2xl font-bold">{stats.total_employees.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Assigned</p>
                            <p className="mt-1 text-2xl font-bold">{stats.total_assigned.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Completed</p>
                            <p className="mt-1 text-2xl font-bold text-green-700">
                                {stats.completed.toLocaleString()}
                                <span className="ml-1 text-sm font-normal text-muted-foreground">({completedPct}%)</span>
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Overdue</p>
                            <p className="mt-1 text-2xl font-bold text-red-700">{stats.overdue.toLocaleString()}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={v => applyFilter('status', v)}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.training_id ?? 'all'}
                        onValueChange={v => applyFilter('training_id', v === 'all' ? '' : v)}
                    >
                        <SelectTrigger className="w-56">
                            <SelectValue placeholder="All Trainings" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Trainings</SelectItem>
                            {trainings.map(t => (
                                <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Assignments table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Assignments
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({assignments.total?.toLocaleString() ?? assignments.data.length} total)
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr className="text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Employee</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Training</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Due</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">Completed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {assignments.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                                                No assignments match the selected filters.
                                            </td>
                                        </tr>
                                    )}
                                    {assignments.data.map(a => (
                                        <tr key={a.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{a.user?.name ?? '—'}</div>
                                                <div className="text-xs text-muted-foreground">{a.user?.employee_id}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>{a.training?.title ?? '—'}</div>
                                                <div className="text-xs text-muted-foreground capitalize">
                                                    {a.training?.category?.replace(/_/g, ' ')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(a.status)}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {a.due_at ? new Date(a.due_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {assignments.links && assignments.links.length > 3 && (
                            <div className="flex items-center justify-center gap-1 border-t px-4 py-3">
                                {assignments.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`rounded px-3 py-1 text-xs transition-colors ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : link.url
                                                    ? 'hover:bg-muted text-foreground'
                                                    : 'text-muted-foreground cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
