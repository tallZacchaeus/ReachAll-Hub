import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import type { HrCaseRow, CaseType, CasePriority, CaseStatus } from '@/types/employee-relations';

interface Props {
    cases: {
        data: HrCaseRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { type?: string; status?: string };
}

const TYPE_LABELS: Record<CaseType, string> = {
    helpdesk:      'Helpdesk',
    grievance:     'Grievance',
    whistleblower: 'Whistleblower',
    disciplinary:  'Disciplinary',
    investigation: 'Investigation',
};

const STATUS_COLORS: Record<CaseStatus, string> = {
    open:           'bg-blue-100 text-blue-800',
    under_review:   'bg-yellow-100 text-yellow-800',
    investigating:  'bg-orange-100 text-orange-800',
    pending_action: 'bg-purple-100 text-purple-800',
    resolved:       'bg-green-100 text-green-800',
    closed:         'bg-zinc-200 text-zinc-600',
    dismissed:      'bg-zinc-100 text-zinc-500',
};

const PRIORITY_COLORS: Record<CasePriority, string> = {
    low:    'bg-zinc-100 text-zinc-600',
    normal: 'bg-blue-100 text-blue-700',
    high:   'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
};

export default function CaseManagementPage({ cases, filters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filterType, setFilterType] = useState(filters.type ?? '');
    const [filterStatus, setFilterStatus] = useState(filters.status ?? '');

    const [form, setForm] = useState({
        type: 'helpdesk' as CaseType,
        subject: '',
        description: '',
        priority: 'normal' as CasePriority,
        confidential: false,
        reported_by_id: '',
    });

    function applyFilters() {
        router.get(route('er.cases.index'), {
            type: filterType || undefined,
            status: filterStatus || undefined,
        }, { preserveState: true });
    }

    function handleCreate() {
        setSubmitting(true);
        router.post(route('er.cases.store'), {
            ...form,
            reported_by_id: form.reported_by_id || null,
        }, {
            onSuccess: () => setCreateOpen(false),
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <MainLayout title="ER Case Management">
            <div className="mx-auto max-w-7xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Employee Relations</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage helpdesk tickets, grievances, disciplinary cases, and investigations
                        </p>
                    </div>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>Open Case</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Open New Case</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>Case Type *</Label>
                                        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as CaseType }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {(Object.entries(TYPE_LABELS) as [CaseType, string][]).map(([v, l]) => (
                                                    <SelectItem key={v} value={v}>{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Priority *</Label>
                                        <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as CasePriority }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {(['low', 'normal', 'high', 'urgent'] as CasePriority[]).map(p => (
                                                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Subject *</Label>
                                    <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Description *</Label>
                                    <Textarea rows={5} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Reported By (User ID, leave blank for anonymous)</Label>
                                    <Input
                                        type="number"
                                        placeholder="User ID"
                                        value={form.reported_by_id}
                                        onChange={e => setForm(f => ({ ...f, reported_by_id: e.target.value }))}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="confidential"
                                        checked={form.confidential || form.type === 'whistleblower'}
                                        onChange={e => setForm(f => ({ ...f, confidential: e.target.checked }))}
                                        className="rounded"
                                    />
                                    <Label htmlFor="confidential">Confidential</Label>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreate} disabled={submitting || !form.subject || !form.description}>
                                        {submitting ? 'Opening…' : 'Open Case'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Types</SelectItem>
                            {(Object.entries(TYPE_LABELS) as [CaseType, string][]).map(([v, l]) => (
                                <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Statuses</SelectItem>
                            {(Object.keys(STATUS_COLORS) as CaseStatus[]).map(s => (
                                <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={applyFilters}>Filter</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Cases</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Case #</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reporter</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Opened</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cases.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                                            No cases found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {cases.data.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-mono text-xs">{c.case_number}</TableCell>
                                        <TableCell>{TYPE_LABELS[c.type]}</TableCell>
                                        <TableCell className="max-w-[220px] truncate">
                                            {c.confidential && (
                                                <span className="mr-1 text-xs text-orange-600">🔒</span>
                                            )}
                                            {c.subject}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_COLORS[c.priority]}`}>
                                                {c.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                                                {c.status.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {c.reported_by?.name ?? <span className="text-muted-foreground italic">Anonymous</span>}
                                        </TableCell>
                                        <TableCell className="text-sm">{c.assigned_to?.name ?? '—'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={route('er.cases.show', c.id)}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                View
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
