import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/MainLayout';
import type { JobRequisitionRow, RequisitionPriority, EmploymentType } from '@/types/recruitment';

interface Props {
    requisitions: {
        data: JobRequisitionRow[];
        links: { url: string | null; label: string; active: boolean }[];
        meta?: { total: number; from: number; to: number };
    };
    filters: { status?: string };
}

const STATUS_COLORS: Record<string, string> = {
    draft:     'bg-zinc-100 text-zinc-700',
    pending:   'bg-yellow-100 text-yellow-800',
    approved:  'bg-green-100 text-green-800',
    rejected:  'bg-red-100 text-red-800',
    fulfilled: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-zinc-200 text-zinc-500',
};

const PRIORITY_COLORS: Record<string, string> = {
    low:    'bg-zinc-100 text-zinc-600',
    normal: 'bg-blue-100 text-blue-700',
    high:   'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract:  'Contract',
    intern:    'Intern',
};

export default function JobRequisitionsPage({ requisitions, filters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [form, setForm] = useState({
        title: '',
        department: '',
        headcount: '1',
        employment_type: 'full_time' as EmploymentType,
        justification: '',
        priority: 'normal' as RequisitionPriority,
    });
    const [submitting, setSubmitting] = useState(false);

    function handleCreate() {
        setSubmitting(true);
        router.post(
            route('recruitment.requisitions.store'),
            { ...form, headcount: parseInt(form.headcount) },
            {
                onSuccess: () => { setCreateOpen(false); setForm({ title: '', department: '', headcount: '1', employment_type: 'full_time', justification: '', priority: 'normal' }); },
                onFinish: () => setSubmitting(false),
            }
        );
    }

    function handleApprove(id: number) {
        router.post(route('recruitment.requisitions.approve', id), {});
    }

    function handleReject(id: number) {
        if (!rejectReason.trim()) return;
        router.post(route('recruitment.requisitions.reject', id), { rejection_reason: rejectReason }, {
            onSuccess: () => { setRejectOpen(null); setRejectReason(''); },
        });
    }

    return (
        <MainLayout title="Job Requisitions">
            <div className="mx-auto max-w-7xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Job Requisitions</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Approve headcount requests before opening job postings
                        </p>
                    </div>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>New Requisition</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>New Job Requisition</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>Job Title *</Label>
                                        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Department *</Label>
                                        <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label>Headcount *</Label>
                                        <Input type="number" min="1" value={form.headcount} onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Type</Label>
                                        <Select value={form.employment_type} onValueChange={v => setForm(f => ({ ...f, employment_type: v as EmploymentType }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([v, l]) => (
                                                    <SelectItem key={v} value={v}>{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Priority</Label>
                                        <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as RequisitionPriority }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['low', 'normal', 'high', 'urgent'].map(p => (
                                                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Business Justification *</Label>
                                    <Textarea rows={4} value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))} />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreate} disabled={submitting || !form.title || !form.department || !form.justification}>
                                        {submitting ? 'Submitting…' : 'Submit for Approval'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">All Requisitions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>HC</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Requested By</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requisitions.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                                            No requisitions yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {requisitions.data.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.title}</TableCell>
                                        <TableCell>{req.department}</TableCell>
                                        <TableCell>{req.headcount}</TableCell>
                                        <TableCell>{EMPLOYMENT_TYPE_LABELS[req.employment_type] ?? req.employment_type}</TableCell>
                                        <TableCell>
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_COLORS[req.priority]}`}>
                                                {req.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[req.status]}`}>
                                                {req.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{req.requested_by?.name ?? '—'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {req.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleApprove(req.id)}>Approve</Button>
                                                    <Dialog open={rejectOpen === req.id} onOpenChange={o => { setRejectOpen(o ? req.id : null); setRejectReason(''); }}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="destructive">Reject</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader><DialogTitle>Reject Requisition</DialogTitle></DialogHeader>
                                                            <div className="space-y-3">
                                                                <Textarea
                                                                    placeholder="Reason for rejection…"
                                                                    value={rejectReason}
                                                                    onChange={e => setRejectReason(e.target.value)}
                                                                    rows={3}
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <Button variant="outline" onClick={() => setRejectOpen(null)}>Cancel</Button>
                                                                    <Button variant="destructive" onClick={() => handleReject(req.id)} disabled={!rejectReason.trim()}>
                                                                        Confirm Reject
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            )}
                                            {req.status === 'rejected' && req.rejection_reason && (
                                                <span className="text-xs text-muted-foreground">{req.rejection_reason}</span>
                                            )}
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
