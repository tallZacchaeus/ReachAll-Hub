import { router } from '@inertiajs/react';
import { useState } from 'react';

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
import type { CandidateRow, CandidateStatus } from '@/types/recruitment';

interface Props {
    candidates: {
        data: CandidateRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { status?: string; search?: string };
}

const STATUS_COLORS: Record<CandidateStatus, string> = {
    active:      'bg-green-100 text-green-800',
    inactive:    'bg-zinc-100 text-zinc-600',
    hired:       'bg-blue-100 text-blue-800',
    blacklisted: 'bg-red-100 text-red-800',
};

export default function CandidatesPage({ candidates, filters }: Props) {
    const [addOpen, setAddOpen] = useState(false);
    const [editCandidate, setEditCandidate] = useState<CandidateRow | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');

    const emptyForm = {
        name: '', email: '', phone: '', source: '', current_company: '',
        current_title: '', linkedin_url: '', notes: '', status: 'active' as CandidateStatus,
    };
    const [form, setForm] = useState(emptyForm);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(route('recruitment.candidates.index'), { search, status: filters.status }, { preserveState: true });
    }

    function handleAdd() {
        setSubmitting(true);
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
        if (resumeFile) fd.append('resume', resumeFile);

        router.post(route('recruitment.candidates.store'), fd, {
            forceFormData: true,
            onSuccess: () => { setAddOpen(false); setForm(emptyForm); setResumeFile(null); },
            onFinish: () => setSubmitting(false),
        });
    }

    function handleEdit() {
        if (!editCandidate) return;
        setSubmitting(true);
        router.put(route('recruitment.candidates.update', editCandidate.id), form, {
            onSuccess: () => setEditCandidate(null),
            onFinish: () => setSubmitting(false),
        });
    }

    function openEdit(c: CandidateRow) {
        setEditCandidate(c);
        setForm({
            name: c.name, email: c.email ?? '', phone: c.phone ?? '',
            source: c.source ?? '', current_company: c.current_company ?? '',
            current_title: c.current_title ?? '', linkedin_url: c.linkedin_url ?? '',
            notes: c.notes ?? '', status: c.status,
        });
    }

    const FormFields = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Full Name *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                    <Label>Source</Label>
                    <Input placeholder="LinkedIn, referral…" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Current Company</Label>
                    <Input value={form.current_company} onChange={e => setForm(f => ({ ...f, current_company: e.target.value }))} />
                </div>
                <div className="space-y-1">
                    <Label>Current Title</Label>
                    <Input value={form.current_title} onChange={e => setForm(f => ({ ...f, current_title: e.target.value }))} />
                </div>
            </div>
            <div className="space-y-1">
                <Label>LinkedIn URL</Label>
                <Input type="url" value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} />
            </div>
            {editCandidate && (
                <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as CandidateStatus }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {(['active', 'inactive', 'hired', 'blacklisted'] as CandidateStatus[]).map(s => (
                                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {!editCandidate && (
                <div className="space-y-1">
                    <Label>Resume (PDF / DOC)</Label>
                    <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files?.[0] ?? null)} />
                </div>
            )}
            <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
        </div>
    );

    return (
        <MainLayout title="Candidate Pool">
            <div className="mx-auto max-w-7xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Candidate Pool</h1>
                        <p className="text-sm text-muted-foreground mt-1">External candidates across all requisitions</p>
                    </div>
                    <Dialog open={addOpen} onOpenChange={setAddOpen}>
                        <DialogTrigger asChild>
                            <Button>Add Candidate</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
                            <FormFields />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                                <Button onClick={handleAdd} disabled={submitting || !form.name || !form.email}>
                                    {submitting ? 'Adding…' : 'Add Candidate'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Search name, email, company…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
                    <Button type="submit" variant="outline">Search</Button>
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Candidates ({candidates.data.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Resume</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {candidates.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                                            No candidates yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {candidates.data.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell className="text-sm">{c.email}</TableCell>
                                        <TableCell>{c.current_company ?? '—'}</TableCell>
                                        <TableCell>{c.current_title ?? '—'}</TableCell>
                                        <TableCell>{c.source ?? '—'}</TableCell>
                                        <TableCell>
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[c.status]}`}>
                                                {c.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {c.resume_path ? (
                                                <a
                                                    href={route('recruitment.candidates.resume', c.id)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Download
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Dialog open={editCandidate?.id === c.id} onOpenChange={o => !o && setEditCandidate(null)}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-lg">
                                                    <DialogHeader><DialogTitle>Edit Candidate</DialogTitle></DialogHeader>
                                                    <FormFields />
                                                    <div className="flex justify-end gap-2 pt-2">
                                                        <Button variant="outline" onClick={() => setEditCandidate(null)}>Cancel</Button>
                                                        <Button onClick={handleEdit} disabled={submitting}>
                                                            {submitting ? 'Saving…' : 'Save'}
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
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
