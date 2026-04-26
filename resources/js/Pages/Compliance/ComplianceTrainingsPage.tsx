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
import { Link } from '@inertiajs/react';
import type { ComplianceTrainingRow, TrainingAssignmentRow, AssignmentStatus } from '@/types/compliance';

interface StaffUser {
    id: number;
    name: string;
    employee_id: string;
}

interface Props {
    trainings: {
        data: ComplianceTrainingRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    assignments: {
        data: TrainingAssignmentRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    staff_list: StaffUser[];
    filters: { category?: string; status?: string };
    can_report?: boolean;
}

const STATUS_COLORS: Record<AssignmentStatus, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    overdue:   'bg-red-100 text-red-800',
    waived:    'bg-zinc-100 text-zinc-500',
};

const CATEGORIES = [
    { value: 'data_protection', label: 'Data Protection' },
    { value: 'health_safety', label: 'Health & Safety' },
    { value: 'anti_bribery', label: 'Anti-Bribery' },
    { value: 'code_of_conduct', label: 'Code of Conduct' },
    { value: 'cybersecurity', label: 'Cybersecurity' },
    { value: 'general', label: 'General' },
];

export default function ComplianceTrainingsPage({ trainings, assignments, staff_list, filters, can_report }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState<number | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [assignDue, setAssignDue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', category: 'general',
        is_mandatory: true, duration_minutes: '', content_url: '', recurrence_months: '',
    });

    function handleCreate() {
        setSubmitting(true);
        router.post(route('compliance.trainings.store'), {
            ...form,
            duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
            recurrence_months: form.recurrence_months ? parseInt(form.recurrence_months) : null,
        }, {
            onSuccess: () => { setCreateOpen(false); setForm({ title: '', description: '', category: 'general', is_mandatory: true, duration_minutes: '', content_url: '', recurrence_months: '' }); },
            onFinish: () => setSubmitting(false),
        });
    }

    function handleAssign(trainingId: number) {
        setSubmitting(true);
        router.post(route('compliance.trainings.assign', trainingId), {
            user_ids: selectedUsers.map(Number),
            due_at: assignDue,
        }, {
            onSuccess: () => { setAssignOpen(null); setSelectedUsers([]); setAssignDue(''); },
            onFinish: () => setSubmitting(false),
        });
    }

    function toggleUser(id: string) {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
    }

    return (
        <MainLayout title="Compliance Trainings">
            <div className="mx-auto max-w-6xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Compliance Trainings</h1>
                        <p className="text-sm text-muted-foreground mt-1">Mandatory and optional compliance training catalog</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {can_report && (
                            <Button variant="outline" asChild>
                                <Link href={route('compliance.training-report')}>View Report</Link>
                            </Button>
                        )}
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild><Button>Create Training</Button></DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>Create Training</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label>Title *</Label>
                                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Description</Label>
                                    <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
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
                                        <Label>Duration (minutes)</Label>
                                        <Input type="number" min="1" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Content URL</Label>
                                    <Input type="url" placeholder="https://…" value={form.content_url} onChange={e => setForm(f => ({ ...f, content_url: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Recurrence (months, leave blank for one-time)</Label>
                                    <Input type="number" min="1" value={form.recurrence_months} onChange={e => setForm(f => ({ ...f, recurrence_months: e.target.value }))} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="mandatory" checked={form.is_mandatory}
                                        onChange={e => setForm(f => ({ ...f, is_mandatory: e.target.checked }))} className="rounded" />
                                    <Label htmlFor="mandatory">Mandatory</Label>
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
                    </div>
                </div>

                <Card>
                    <CardHeader><CardTitle className="text-base">Training Catalog</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr className="text-left">
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Title</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Duration</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Recurrence</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Assigned</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {trainings.data.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No trainings yet.</td></tr>
                                )}
                                {trainings.data.map(t => (
                                    <tr key={t.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{t.title}</div>
                                            {t.is_mandatory && <span className="text-xs bg-red-100 text-red-700 rounded px-1">Mandatory</span>}
                                        </td>
                                        <td className="px-4 py-3 capitalize text-muted-foreground">{t.category.replace('_', ' ')}</td>
                                        <td className="px-4 py-3">{t.duration_minutes ? `${t.duration_minutes} min` : '—'}</td>
                                        <td className="px-4 py-3">{t.recurrence_months ? `Every ${t.recurrence_months}mo` : 'One-time'}</td>
                                        <td className="px-4 py-3">{t.assignments_count ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <Dialog open={assignOpen === t.id} onOpenChange={v => { setAssignOpen(v ? t.id : null); setSelectedUsers([]); setAssignDue(''); }}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs">Assign</Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader><DialogTitle>Assign "{t.title}"</DialogTitle></DialogHeader>
                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <Label>Due Date *</Label>
                                                            <Input type="date" value={assignDue} onChange={e => setAssignDue(e.target.value)} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label>Select Employees</Label>
                                                            <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
                                                                {staff_list.map(u => (
                                                                    <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded">
                                                                        <input type="checkbox" checked={selectedUsers.includes(String(u.id))}
                                                                            onChange={() => toggleUser(String(u.id))} className="rounded" />
                                                                        {u.name} <span className="text-xs text-muted-foreground">({u.employee_id})</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{selectedUsers.length} selected</p>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" onClick={() => setAssignOpen(null)}>Cancel</Button>
                                                            <Button onClick={() => handleAssign(t.id)} disabled={submitting || !assignDue || selectedUsers.length === 0}>
                                                                {submitting ? 'Assigning…' : 'Assign'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Assignments</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="border-b">
                                <tr className="text-left">
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Training</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Employee</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Due</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Completed</th>
                                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {assignments.data.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No assignments.</td></tr>
                                )}
                                {assignments.data.map(a => (
                                    <tr key={a.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">{a.training?.title ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <div>{a.user?.name ?? '—'}</div>
                                            <div className="text-xs text-muted-foreground">{a.user?.employee_id}</div>
                                        </td>
                                        <td className="px-4 py-3">{new Date(a.due_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                                                {a.status}
                                            </span>
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
