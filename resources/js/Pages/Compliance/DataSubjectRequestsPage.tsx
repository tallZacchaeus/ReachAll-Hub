import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/MainLayout';
import type { DataSubjectRequestRow, DsrStatus, DsrType } from '@/types/compliance';

interface Props {
    dsrs: {
        data: DataSubjectRequestRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { status?: string; type?: string };
}

const STATUS_COLORS: Record<DsrStatus, string> = {
    pending:      'bg-yellow-100 text-yellow-800',
    acknowledged: 'bg-blue-100 text-blue-800',
    in_progress:  'bg-orange-100 text-orange-800',
    completed:    'bg-green-100 text-green-800',
    rejected:     'bg-red-100 text-red-800',
    withdrawn:    'bg-zinc-100 text-zinc-500',
};

const DSR_TYPES: { value: DsrType; label: string }[] = [
    { value: 'access', label: 'Data Access' },
    { value: 'rectification', label: 'Rectification' },
    { value: 'erasure', label: 'Erasure (Right to be Forgotten)' },
    { value: 'restriction', label: 'Restriction of Processing' },
    { value: 'portability', label: 'Data Portability' },
    { value: 'objection', label: 'Objection to Processing' },
];

export default function DataSubjectRequestsPage({ dsrs, filters }: Props) {
    const [updateOpen, setUpdateOpen] = useState<number | null>(null);
    const [updateStatus, setUpdateStatus] = useState<string>('in_progress');
    const [updateResponse, setUpdateResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function applyFilter(key: string, value: string) {
        router.get(route('compliance.dsr.index'), { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    function handleUpdate(dsrId: number) {
        setSubmitting(true);
        router.put(route('compliance.dsr.update', dsrId), { status: updateStatus, response: updateResponse }, {
            onSuccess: () => setUpdateOpen(null),
            onFinish: () => setSubmitting(false),
        });
    }

    function openUpdate(dsr: DataSubjectRequestRow) {
        setUpdateOpen(dsr.id);
        setUpdateStatus(dsr.status === 'pending' ? 'acknowledged' : dsr.status);
        setUpdateResponse(dsr.response ?? '');
    }

    return (
        <MainLayout title="Data Subject Requests">
            <div className="mx-auto max-w-5xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Data Subject Requests</h1>
                        <p className="text-sm text-muted-foreground mt-1">GDPR/NDPR data subject requests from employees</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Select value={filters.status ?? ''} onValueChange={v => applyFilter('status', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All statuses</SelectItem>
                            {(['pending', 'acknowledged', 'in_progress', 'completed', 'rejected', 'withdrawn'] as DsrStatus[]).map(s => (
                                <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.type ?? ''} onValueChange={v => applyFilter('type', v)}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="All types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All types</SelectItem>
                            {DSR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr className="text-left">
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Reference</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Employee</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Due</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {dsrs.data.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No requests found.</td></tr>
                                )}
                                {dsrs.data.map(dsr => {
                                    const isOverdue = dsr.due_at && new Date(dsr.due_at) < new Date()
                                        && !['completed', 'rejected', 'withdrawn'].includes(dsr.status);
                                    return (
                                        <tr key={dsr.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono text-xs">{dsr.request_number}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{dsr.user?.name ?? '—'}</div>
                                                <div className="text-xs text-muted-foreground">{dsr.user?.employee_id}</div>
                                            </td>
                                            <td className="px-4 py-3 capitalize">{dsr.type.replace('_', ' ')}</td>
                                            <td className="px-4 py-3">
                                                {dsr.due_at
                                                    ? <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{new Date(dsr.due_at).toLocaleDateString()}</span>
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[dsr.status]}`}>
                                                    {dsr.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    {dsr.status === 'pending' && (
                                                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs"
                                                            onClick={() => router.post(route('compliance.dsr.acknowledge', dsr.id))}>
                                                            Acknowledge
                                                        </Button>
                                                    )}
                                                    {!['completed', 'rejected', 'withdrawn'].includes(dsr.status) && (
                                                        <Dialog open={updateOpen === dsr.id} onOpenChange={v => v ? openUpdate(dsr) : setUpdateOpen(null)}>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">Update</Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader><DialogTitle>Update DSR {dsr.request_number}</DialogTitle></DialogHeader>
                                                                <div className="space-y-3">
                                                                    <div className="space-y-1">
                                                                        <Label>Status</Label>
                                                                        <Select value={updateStatus} onValueChange={setUpdateStatus}>
                                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {(['acknowledged', 'in_progress', 'completed', 'rejected'] as const).map(s => (
                                                                                    <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label>Response to Employee</Label>
                                                                        <Textarea rows={4} value={updateResponse} onChange={e => setUpdateResponse(e.target.value)} />
                                                                    </div>
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button variant="outline" onClick={() => setUpdateOpen(null)}>Cancel</Button>
                                                                        <Button onClick={() => handleUpdate(dsr.id)} disabled={submitting}>
                                                                            {submitting ? 'Saving…' : 'Save'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
