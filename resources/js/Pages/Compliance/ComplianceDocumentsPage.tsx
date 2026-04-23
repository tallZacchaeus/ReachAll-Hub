import { useState } from 'react';
import { router } from '@inertiajs/react';
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
import type { ComplianceDocumentRow, DocumentStatus } from '@/types/compliance';

interface StaffUser {
    id: number;
    name: string;
    employee_id: string;
}

interface Props {
    docs: {
        data: ComplianceDocumentRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    staff_list: StaffUser[];
    filters: { type?: string; status?: string; user_id?: string };
}

const STATUS_COLORS: Record<DocumentStatus, string> = {
    pending:  'bg-yellow-100 text-yellow-800',
    active:   'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired:  'bg-zinc-100 text-zinc-500',
};

const DOC_TYPES = [
    { value: 'visa', label: 'Visa' },
    { value: 'work_permit', label: 'Work Permit' },
    { value: 'right_to_work', label: 'Right to Work' },
    { value: 'passport', label: 'Passport' },
    { value: 'national_id', label: 'National ID' },
    { value: 'residence_permit', label: 'Residence Permit' },
];

export default function ComplianceDocumentsPage({ docs, staff_list, filters }: Props) {
    const [addOpen, setAddOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState<number | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [form, setForm] = useState({
        user_id: '',
        type: 'passport',
        document_number: '',
        country_of_issue: '',
        issued_at: '',
        expires_at: '',
        notes: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function handleAdd() {
        setSubmitting(true);
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) data.append(k, v); });
        if (file) data.append('file', file);
        router.post(route('compliance.documents.store'), data, {
            onSuccess: () => { setAddOpen(false); setFile(null); setForm({ user_id: '', type: 'passport', document_number: '', country_of_issue: '', issued_at: '', expires_at: '', notes: '' }); },
            onFinish: () => setSubmitting(false),
        });
    }

    function handleReject(docId: number) {
        setSubmitting(true);
        router.post(route('compliance.documents.reject', docId), { notes: rejectNotes }, {
            onSuccess: () => { setRejectOpen(null); setRejectNotes(''); },
            onFinish: () => setSubmitting(false),
        });
    }

    function applyFilter(key: string, value: string) {
        router.get(route('compliance.documents.index'), { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    return (
        <MainLayout title="Compliance Documents">
            <div className="mx-auto max-w-6xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Compliance Documents</h1>
                        <p className="text-sm text-muted-foreground mt-1">Visa, work permits, right-to-work, and identity documents</p>
                    </div>
                    <Dialog open={addOpen} onOpenChange={setAddOpen}>
                        <DialogTrigger asChild><Button>Add Document</Button></DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Add Compliance Document</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label>Employee *</Label>
                                    <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}>
                                        <SelectTrigger><SelectValue placeholder="Select employee…" /></SelectTrigger>
                                        <SelectContent>
                                            {staff_list.map(u => (
                                                <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.employee_id})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Document Type *</Label>
                                        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Document Number</Label>
                                        <Input value={form.document_number} onChange={e => setForm(f => ({ ...f, document_number: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Country of Issue</Label>
                                    <Input value={form.country_of_issue} onChange={e => setForm(f => ({ ...f, country_of_issue: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Issue Date</Label>
                                        <Input type="date" value={form.issued_at} onChange={e => setForm(f => ({ ...f, issued_at: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Expiry Date</Label>
                                        <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Notes</Label>
                                    <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Upload Document (PDF/Image)</Label>
                                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAdd} disabled={submitting || !form.user_id}>
                                        {submitting ? 'Saving…' : 'Add Document'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    <Select value={filters.type ?? ''} onValueChange={v => applyFilter('type', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All types</SelectItem>
                            {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.status ?? ''} onValueChange={v => applyFilter('status', v)}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All statuses</SelectItem>
                            {(['pending', 'active', 'rejected', 'expired'] as DocumentStatus[]).map(s => (
                                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr className="text-left">
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Employee</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Number</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Expires</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {docs.data.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No documents found.</td></tr>
                                )}
                                {docs.data.map(doc => (
                                    <tr key={doc.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{doc.user?.name ?? '—'}</div>
                                            <div className="text-xs text-muted-foreground">{doc.user?.employee_id}</div>
                                        </td>
                                        <td className="px-4 py-3 capitalize">{doc.type.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{doc.document_number ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            {doc.expires_at
                                                ? <span className={new Date(doc.expires_at) < new Date() ? 'text-red-600 font-medium' : ''}>{new Date(doc.expires_at).toLocaleDateString()}</span>
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {doc.file_path && (
                                                    <a href={route('compliance.documents.download', doc.id)} className="text-xs text-blue-600 hover:underline">
                                                        Download
                                                    </a>
                                                )}
                                                {doc.status === 'pending' && (
                                                    <>
                                                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-green-700"
                                                            onClick={() => router.post(route('compliance.documents.verify', doc.id))}>
                                                            Verify
                                                        </Button>
                                                        <Dialog open={rejectOpen === doc.id} onOpenChange={v => { setRejectOpen(v ? doc.id : null); setRejectNotes(''); }}>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-red-600">Reject</Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader><DialogTitle>Reject Document</DialogTitle></DialogHeader>
                                                                <Textarea placeholder="Reason for rejection…" rows={3} value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} />
                                                                <div className="flex justify-end gap-2">
                                                                    <Button variant="outline" onClick={() => setRejectOpen(null)}>Cancel</Button>
                                                                    <Button variant="destructive" onClick={() => handleReject(doc.id)} disabled={!rejectNotes.trim() || submitting}>
                                                                        Reject
                                                                    </Button>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
