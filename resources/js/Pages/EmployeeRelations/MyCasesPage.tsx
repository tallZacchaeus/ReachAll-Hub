import { router, Link } from '@inertiajs/react';
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
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/MainLayout';
import type { CaseStatus, CasePriority } from '@/types/employee-relations';

interface CaseSummary {
    id: number;
    case_number: string;
    type: string;
    subject: string;
    status: CaseStatus;
    priority: CasePriority;
    confidential: boolean;
    created_at: string;
    assigned_to: { id: number; name: string } | null;
}

interface Props {
    cases: {
        data: CaseSummary[];
        links: { url: string | null; label: string; active: boolean }[];
    };
}

const STATUS_COLORS: Record<CaseStatus, string> = {
    open:           'bg-blue-100 text-blue-800',
    under_review:   'bg-yellow-100 text-yellow-800',
    investigating:  'bg-orange-100 text-orange-800',
    pending_action: 'bg-purple-100 text-purple-800',
    resolved:       'bg-green-100 text-green-800',
    closed:         'bg-zinc-200 text-zinc-600',
    dismissed:      'bg-zinc-100 text-zinc-500',
};

export default function MyCasesPage({ cases }: Props) {
    const [submitOpen, setSubmitOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        type: 'helpdesk' as 'helpdesk' | 'grievance' | 'whistleblower',
        subject: '',
        description: '',
        priority: 'normal' as 'low' | 'normal',
        anonymous: false,
    });

    function handleSubmit() {
        setSubmitting(true);
        router.post(route('er.my-cases.store'), form, {
            onSuccess: () => {
                setSubmitOpen(false);
                setForm({ type: 'helpdesk', subject: '', description: '', priority: 'normal', anonymous: false });
            },
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <MainLayout title="My Cases">
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">My Cases</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track your helpdesk tickets, grievances, and whistleblower reports
                        </p>
                    </div>
                    <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                        <DialogTrigger asChild>
                            <Button>Submit a Case</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Submit a Case</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>Type *</Label>
                                        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as typeof f.type }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="helpdesk">Helpdesk Ticket</SelectItem>
                                                <SelectItem value="grievance">Grievance</SelectItem>
                                                <SelectItem value="whistleblower">Whistleblower Report</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Priority</Label>
                                        <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as typeof f.priority }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
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
                                    <Textarea
                                        rows={6}
                                        placeholder="Describe the issue or concern in detail…"
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    />
                                </div>
                                {form.type === 'whistleblower' && (
                                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                                        Whistleblower reports are treated with the highest level of confidentiality. You may choose to submit anonymously.
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={form.anonymous}
                                        onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked }))}
                                        className="rounded"
                                    />
                                    <Label htmlFor="anonymous" className="text-sm">Submit anonymously</Label>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSubmit} disabled={submitting || !form.subject || !form.description}>
                                        {submitting ? 'Submitting…' : 'Submit Case'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {cases.data.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">You haven't submitted any cases yet.</p>
                            <Button className="mt-4" onClick={() => setSubmitOpen(true)}>Submit a Case</Button>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-3">
                    {cases.data.map(c => (
                        <Card key={c.id}>
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground">{c.case_number}</span>
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                                            {c.status.replace('_', ' ')}
                                        </span>
                                        {c.confidential && (
                                            <span className="text-xs rounded px-1.5 py-0.5 bg-orange-100 text-orange-700">Confidential</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-sm">{c.subject}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {c.type.charAt(0).toUpperCase() + c.type.slice(1)} ·{' '}
                                        {c.assigned_to ? `Assigned to ${c.assigned_to.name}` : 'Unassigned'} ·{' '}
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <Link
                                    href={route('er.my-cases.show', c.id)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    View
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
