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
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/MainLayout';
import type {
    ComplianceDocumentRow,
    DataSubjectRequestRow,
    TrainingAssignmentRow,
    CompliancePolicyRow,
    DocumentStatus,
    DsrStatus,
    AssignmentStatus,
} from '@/types/compliance';

interface Props {
    docs: ComplianceDocumentRow[];
    assignments: TrainingAssignmentRow[];
    dsrs: DataSubjectRequestRow[];
    policies: CompliancePolicyRow[];
}

const DOC_STATUS_COLORS: Record<DocumentStatus, string> = {
    pending:  'bg-yellow-100 text-yellow-800',
    active:   'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired:  'bg-zinc-100 text-zinc-500',
};

const DSR_STATUS_COLORS: Record<DsrStatus, string> = {
    pending:      'bg-yellow-100 text-yellow-800',
    acknowledged: 'bg-blue-100 text-blue-800',
    in_progress:  'bg-orange-100 text-orange-800',
    completed:    'bg-green-100 text-green-800',
    rejected:     'bg-red-100 text-red-800',
    withdrawn:    'bg-zinc-100 text-zinc-500',
};

const TRAINING_STATUS_COLORS: Record<AssignmentStatus, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    overdue:   'bg-red-100 text-red-800',
    waived:    'bg-zinc-100 text-zinc-500',
};

const DOC_TYPES = [
    { value: 'visa', label: 'Visa' },
    { value: 'work_permit', label: 'Work Permit' },
    { value: 'right_to_work', label: 'Right to Work' },
    { value: 'passport', label: 'Passport' },
    { value: 'national_id', label: 'National ID' },
    { value: 'residence_permit', label: 'Residence Permit' },
];

const DSR_TYPES = [
    { value: 'access', label: 'Data Access' },
    { value: 'rectification', label: 'Rectification' },
    { value: 'erasure', label: 'Erasure (Right to be Forgotten)' },
    { value: 'restriction', label: 'Restriction of Processing' },
    { value: 'portability', label: 'Data Portability' },
    { value: 'objection', label: 'Objection to Processing' },
];

export default function MyCompliancePage({ docs, assignments, dsrs, policies }: Props) {
    const [docOpen, setDocOpen] = useState(false);
    const [dsrOpen, setDsrOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [docForm, setDocForm] = useState({ type: 'passport', document_number: '', country_of_issue: '', issued_at: '', expires_at: '' });
    const [docFile, setDocFile] = useState<File | null>(null);
    const [dsrForm, setDsrForm] = useState({ type: 'access', description: '' });

    const pendingPolicies = policies.filter(p => !p.acknowledged);

    function handleDocSubmit() {
        setSubmitting(true);
        const data = new FormData();
        Object.entries(docForm).forEach(([k, v]) => { if (v) data.append(k, v); });
        if (docFile) data.append('file', docFile);
        router.post(route('compliance.my.documents.store'), data, {
            onSuccess: () => { setDocOpen(false); setDocFile(null); setDocForm({ type: 'passport', document_number: '', country_of_issue: '', issued_at: '', expires_at: '' }); },
            onFinish: () => setSubmitting(false),
        });
    }

    function handleDsrSubmit() {
        setSubmitting(true);
        router.post(route('compliance.my.dsr.store'), dsrForm, {
            onSuccess: () => { setDsrOpen(false); setDsrForm({ type: 'access', description: '' }); },
            onFinish: () => setSubmitting(false),
        });
    }

    function handleComplete(trainingId: number) {
        router.post(route('compliance.trainings.complete', trainingId));
    }

    function handleAcknowledge(policyId: number) {
        router.post(route('compliance.policies.acknowledge', policyId));
    }

    function handleWithdrawDsr(dsrId: number) {
        router.post(route('compliance.my.dsr.withdraw', dsrId));
    }

    return (
        <MainLayout title="My Compliance">
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">My Compliance</h1>
                    <p className="text-sm text-muted-foreground mt-1">Your compliance documents, training assignments, and data requests</p>
                </div>

                {/* Pending Policy Acknowledgements */}
                {pendingPolicies.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardHeader><CardTitle className="text-base text-orange-800">Action Required: Policy Acknowledgements</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {pendingPolicies.map(p => (
                                <div key={p.id} className="flex items-center justify-between rounded bg-white border px-3 py-2 text-sm">
                                    <div>
                                        <span className="font-medium">{p.title}</span>
                                        <span className="ml-2 text-xs text-muted-foreground capitalize">{p.category} · v{p.current_version}</span>
                                    </div>
                                    <Button size="sm" onClick={() => handleAcknowledge(p.id)}>Acknowledge</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Training Assignments */}
                <Card>
                    <CardHeader><CardTitle className="text-base">My Training Assignments</CardTitle></CardHeader>
                    <CardContent>
                        {assignments.length === 0 && <p className="text-sm text-muted-foreground">No training assignments.</p>}
                        <div className="space-y-2">
                            {assignments.map(a => (
                                <div key={a.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                                    <div>
                                        <div className="font-medium">{a.training?.title}</div>
                                        <div className="text-xs text-muted-foreground capitalize">
                                            {a.training?.category.replace('_', ' ')} · Due {new Date(a.due_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${TRAINING_STATUS_COLORS[a.status]}`}>
                                            {a.status}
                                        </span>
                                        {a.status === 'pending' && a.training && (
                                            <Button size="sm" variant="outline" onClick={() => handleComplete(a.training!.id)}>
                                                Mark Complete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Compliance Documents */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">My Compliance Documents</CardTitle>
                        <Dialog open={docOpen} onOpenChange={setDocOpen}>
                            <DialogTrigger asChild><Button size="sm">Upload Document</Button></DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader><DialogTitle>Upload Compliance Document</DialogTitle></DialogHeader>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label>Document Type *</Label>
                                        <Select value={docForm.type} onValueChange={v => setDocForm(f => ({ ...f, type: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Document Number</Label>
                                        <Input value={docForm.document_number} onChange={e => setDocForm(f => ({ ...f, document_number: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Country of Issue</Label>
                                        <Input value={docForm.country_of_issue} onChange={e => setDocForm(f => ({ ...f, country_of_issue: e.target.value }))} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label>Issue Date</Label>
                                            <Input type="date" value={docForm.issued_at} onChange={e => setDocForm(f => ({ ...f, issued_at: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Expiry Date</Label>
                                            <Input type="date" value={docForm.expires_at} onChange={e => setDocForm(f => ({ ...f, expires_at: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Upload File (PDF/Image)</Label>
                                        <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="outline" onClick={() => setDocOpen(false)}>Cancel</Button>
                                        <Button onClick={handleDocSubmit} disabled={submitting}>
                                            {submitting ? 'Uploading…' : 'Upload'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
                        <div className="space-y-2">
                            {docs.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                                    <div>
                                        <span className="font-medium capitalize">{doc.type.replace('_', ' ')}</span>
                                        {doc.document_number && <span className="ml-2 font-mono text-xs text-muted-foreground">{doc.document_number}</span>}
                                        {doc.expires_at && (
                                            <div className="text-xs text-muted-foreground">
                                                Expires {new Date(doc.expires_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${DOC_STATUS_COLORS[doc.status]}`}>
                                        {doc.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Data Subject Requests */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">My Data Requests (GDPR/NDPR)</CardTitle>
                        <Dialog open={dsrOpen} onOpenChange={setDsrOpen}>
                            <DialogTrigger asChild><Button size="sm" variant="outline">Submit Request</Button></DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader><DialogTitle>Submit Data Subject Request</DialogTitle></DialogHeader>
                                <div className="space-y-3">
                                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                                        Under GDPR/NDPR, you have the right to access, correct, erase, or restrict how your personal data is processed. We will respond within 30 days.
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Request Type *</Label>
                                        <Select value={dsrForm.type} onValueChange={v => setDsrForm(f => ({ ...f, type: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {DSR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Description *</Label>
                                        <Textarea rows={4} placeholder="Describe your request…" value={dsrForm.description} onChange={e => setDsrForm(f => ({ ...f, description: e.target.value }))} />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="outline" onClick={() => setDsrOpen(false)}>Cancel</Button>
                                        <Button onClick={handleDsrSubmit} disabled={submitting || !dsrForm.description}>
                                            {submitting ? 'Submitting…' : 'Submit'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {dsrs.length === 0 && <p className="text-sm text-muted-foreground">No data requests submitted.</p>}
                        <div className="space-y-2">
                            {dsrs.map(dsr => (
                                <div key={dsr.id} className="rounded border px-3 py-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs text-muted-foreground">{dsr.request_number}</span>
                                            <span className="capitalize">{dsr.type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${DSR_STATUS_COLORS[dsr.status]}`}>
                                                {dsr.status.replace('_', ' ')}
                                            </span>
                                            {['pending', 'acknowledged'].includes(dsr.status) && (
                                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground"
                                                    onClick={() => handleWithdrawDsr(dsr.id)}>
                                                    Withdraw
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {dsr.response && (
                                        <p className="mt-1 text-xs text-muted-foreground border-t pt-1">{dsr.response}</p>
                                    )}
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Submitted {new Date(dsr.created_at).toLocaleDateString()}
                                        {dsr.due_at && ` · Due ${new Date(dsr.due_at).toLocaleDateString()}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
