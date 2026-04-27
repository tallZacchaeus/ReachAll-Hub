import { router } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
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
import { Input } from '@/components/ui/input';
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
import type { CompliancePolicyRow } from '@/types/compliance';

interface Props {
    policies: {
        data: CompliancePolicyRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    can_manage: boolean;
    can_report?: boolean;
    filters: { category?: string };
}

const CATEGORIES = [
    { value: 'hr', label: 'HR' },
    { value: 'it', label: 'IT' },
    { value: 'finance', label: 'Finance' },
    { value: 'safety', label: 'Safety' },
    { value: 'ethics', label: 'Ethics' },
    { value: 'general', label: 'General' },
];

export default function CompliancePoliciesPage({ policies, can_manage, can_report, filters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [publishOpen, setPublishOpen] = useState<number | null>(null);
    const [publishVersion, setPublishVersion] = useState('');
    const [publishContent, setPublishContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '', category: 'general', description: '', requires_acknowledgement: true,
    });

    function handleCreate() {
        setSubmitting(true);
        router.post(route('compliance.policies.store'), form, {
            onSuccess: () => { setCreateOpen(false); setForm({ title: '', category: 'general', description: '', requires_acknowledgement: true }); },
            onFinish: () => setSubmitting(false),
        });
    }

    function handlePublish(policyId: number) {
        setSubmitting(true);
        router.post(route('compliance.policies.versions.store', policyId), { version: publishVersion, content: publishContent }, {
            onSuccess: () => { setPublishOpen(null); setPublishVersion(''); setPublishContent(''); },
            onFinish: () => setSubmitting(false),
        });
    }

    function handleAcknowledge(policyId: number) {
        router.post(route('compliance.policies.acknowledge', policyId));
    }

    return (
        <MainLayout title="Compliance Policies">
            <div className="mx-auto max-w-5xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Compliance Policies</h1>
                        <p className="text-sm text-muted-foreground mt-1">Versioned company policies requiring employee acknowledgement</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {can_report && (
                            <Button variant="outline" asChild>
                                <Link href={route('compliance.policy-report')}>View Policy Report</Link>
                            </Button>
                        )}
                    {can_manage && (
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild><Button>Create Policy</Button></DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader><DialogTitle>Create Policy</DialogTitle></DialogHeader>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label>Title *</Label>
                                        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Category *</Label>
                                        <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Description</Label>
                                        <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="ack" checked={form.requires_acknowledgement}
                                            onChange={e => setForm(f => ({ ...f, requires_acknowledgement: e.target.checked }))} className="rounded" />
                                        <Label htmlFor="ack">Requires employee acknowledgement</Label>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                        <Button onClick={handleCreate} disabled={submitting || !form.title}>
                                            {submitting ? 'Creating…' : 'Create'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr className="text-left">
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Policy</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Version</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {policies.data.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No policies yet.</td></tr>
                                )}
                                {policies.data.map(p => (
                                    <tr key={p.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{p.title}</div>
                                            {p.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</div>}
                                        </td>
                                        <td className="px-4 py-3 capitalize text-muted-foreground">{p.category}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{p.current_version ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            {p.requires_acknowledgement && (
                                                p.acknowledged
                                                    ? <span className="rounded px-2 py-0.5 text-xs bg-green-100 text-green-700">Acknowledged</span>
                                                    : <span className="rounded px-2 py-0.5 text-xs bg-orange-100 text-orange-700">Pending ACK</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {p.requires_acknowledgement && p.current_version && !p.acknowledged && (
                                                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs"
                                                        onClick={() => handleAcknowledge(p.id)}>
                                                        Acknowledge
                                                    </Button>
                                                )}
                                                {can_manage && (
                                                    <Dialog open={publishOpen === p.id} onOpenChange={v => { setPublishOpen(v ? p.id : null); setPublishVersion(''); setPublishContent(''); }}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">Publish Version</Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl">
                                                            <DialogHeader><DialogTitle>Publish New Version — {p.title}</DialogTitle></DialogHeader>
                                                            <div className="space-y-3">
                                                                <div className="space-y-1">
                                                                    <Label>Version *</Label>
                                                                    <Input placeholder="e.g. 1.0, 2.1" value={publishVersion} onChange={e => setPublishVersion(e.target.value)} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label>Policy Content *</Label>
                                                                    <Textarea rows={12} placeholder="Full policy text…" value={publishContent} onChange={e => setPublishContent(e.target.value)} />
                                                                </div>
                                                                <div className="flex justify-end gap-2">
                                                                    <Button variant="outline" onClick={() => setPublishOpen(null)}>Cancel</Button>
                                                                    <Button onClick={() => handlePublish(p.id)} disabled={submitting || !publishVersion || !publishContent}>
                                                                        {submitting ? 'Publishing…' : 'Publish'}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
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
