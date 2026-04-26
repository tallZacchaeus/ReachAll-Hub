import { Link, router } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ClipboardList, UserMinus } from 'lucide-react';
import type { OffboardingChecklistSummary, OffboardingStatus } from '@/types/offboarding';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedChecklists {
    data: OffboardingChecklistSummary[];
    current_page: number;
    last_page: number;
    links: PaginationLink[];
}

interface Stats {
    initiated: number;
    in_progress: number;
    completed: number;
}

interface Props {
    checklists: PaginatedChecklists;
    stats: Stats;
    filters: { status: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OffboardingStatus, string> = {
    initiated:   'Initiated',
    in_progress: 'In Progress',
    completed:   'Completed',
};

const STATUS_VARIANTS: Record<OffboardingStatus, 'default' | 'secondary' | 'outline'> = {
    initiated:   'secondary',
    in_progress: 'default',
    completed:   'outline',
};

const ALL_VALUE = '__all__';

function ProgressBar({ pct }: { pct: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
        </div>
    );
}

function formatDate(date: string | null): string {
    if (!date) return '—';
    try {
        return new Date(date).toLocaleDateString('en-GB', {
            day:   '2-digit',
            month: 'short',
            year:  'numeric',
        });
    } catch {
        return date;
    }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function OffboardingPage({ checklists, stats, filters }: Props) {
    const statusFilter = filters.status || ALL_VALUE;

    function applyFilter(value: string) {
        router.get(
            '/admin/offboarding',
            { status: value === ALL_VALUE ? '' : value },
            { preserveState: true, replace: true },
        );
    }

    return (
        <MainLayout title="Offboarding">
            <div className="mx-auto max-w-7xl space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Offboarding</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage exit checklists and clearance for departing employees.
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Initiated',   count: stats.initiated,   status: 'initiated'   as OffboardingStatus },
                        { label: 'In Progress', count: stats.in_progress, status: 'in_progress' as OffboardingStatus },
                        { label: 'Completed',   count: stats.completed,   status: 'completed'   as OffboardingStatus },
                    ].map(({ label, count, status }) => (
                        <Card key={status} className="cursor-pointer hover:bg-muted/40 transition-colors"
                              onClick={() => applyFilter(status)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{count}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <Select value={statusFilter} onValueChange={applyFilter}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
                            <SelectItem value="initiated">Initiated</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                {checklists.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                            <UserMinus className="h-10 w-10 text-muted-foreground" />
                            <p className="text-muted-foreground">No offboarding checklists found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ClipboardList className="h-4 w-4" />
                                Checklists ({checklists.data.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Termination Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Progress</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {checklists.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{row.user.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {row.user.employee_id}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {row.user.department ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(row.termination_date)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={STATUS_VARIANTS[row.status]}>
                                                    {STATUS_LABELS[row.status]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <ProgressBar pct={row.completion_percentage} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={route('admin.offboarding.show', row.id)}>
                                                        View
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {checklists.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {checklists.links.map((link, i) => (
                            <Button
                                key={i}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
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
