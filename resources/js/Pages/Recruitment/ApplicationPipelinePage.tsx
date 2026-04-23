import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import type { ApplicationRow, ApplicationStage } from '@/types/recruitment';

interface Posting {
    id: number;
    title: string;
}

interface Props {
    applications: {
        data: ApplicationRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    postings: Posting[];
    filters: { posting_id?: string; stage?: string };
}

const STAGE_COLORS: Record<ApplicationStage, string> = {
    new:        'bg-zinc-100 text-zinc-700',
    screening:  'bg-yellow-100 text-yellow-800',
    interview:  'bg-blue-100 text-blue-800',
    offer:      'bg-purple-100 text-purple-800',
    hired:      'bg-green-100 text-green-800',
    rejected:   'bg-red-100 text-red-800',
    withdrawn:  'bg-zinc-200 text-zinc-500',
};

const STAGES: ApplicationStage[] = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];

export default function ApplicationPipelinePage({ applications, postings, filters }: Props) {
    const [stageDialog, setStageDialog] = useState<ApplicationRow | null>(null);
    const [stageForm, setStageForm] = useState<{ stage: ApplicationStage; ats_notes: string }>({ stage: 'new', ats_notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [filterPosting, setFilterPosting] = useState(filters.posting_id ?? '');
    const [filterStage, setFilterStage] = useState(filters.stage ?? '');

    function applyFilters() {
        router.get(route('recruitment.pipeline.index'), {
            posting_id: filterPosting || undefined,
            stage: filterStage || undefined,
        }, { preserveState: true });
    }

    function openStageDialog(app: ApplicationRow) {
        setStageDialog(app);
        setStageForm({ stage: app.stage, ats_notes: app.ats_notes ?? '' });
    }

    function handleAdvanceStage() {
        if (!stageDialog) return;
        setSubmitting(true);
        router.post(route('recruitment.pipeline.stage', stageDialog.id), stageForm, {
            onSuccess: () => setStageDialog(null),
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <MainLayout title="Application Pipeline">
            <div className="mx-auto max-w-7xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Application Pipeline</h1>
                    <p className="text-sm text-muted-foreground mt-1">Track and advance candidate applications through the ATS pipeline</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Select value={filterPosting} onValueChange={setFilterPosting}>
                        <SelectTrigger className="w-56">
                            <SelectValue placeholder="All postings" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Postings</SelectItem>
                            {postings.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStage} onValueChange={setFilterStage}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All stages" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Stages</SelectItem>
                            {STAGES.map(s => (
                                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={applyFilters}>Filter</Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Applications</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Applicant</TableHead>
                                    <TableHead>Posting</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Stage</TableHead>
                                    <TableHead>Applied</TableHead>
                                    <TableHead>Interviews</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            No applications found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {applications.data.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {app.candidate?.name ?? app.applicant?.name ?? '—'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {app.candidate?.email ?? app.applicant?.email ?? ''}
                                            </div>
                                        </TableCell>
                                        <TableCell>{app.job_posting?.title ?? '—'}</TableCell>
                                        <TableCell>
                                            <span className="text-xs rounded px-1.5 py-0.5 bg-zinc-100">
                                                {app.candidate ? 'External' : 'Internal'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STAGE_COLORS[app.stage]}`}>
                                                {app.stage}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(app.applied_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {app.interviews?.length ?? 0} scheduled
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={route('recruitment.pipeline.show', app.id)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    View
                                                </Link>
                                                <Button size="sm" variant="outline" onClick={() => openStageDialog(app)}>
                                                    Move
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Stage change dialog */}
            <Dialog open={!!stageDialog} onOpenChange={o => !o && setStageDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Move {stageDialog?.candidate?.name ?? stageDialog?.applicant?.name ?? 'Applicant'} to Stage
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>New Stage</Label>
                            <Select
                                value={stageForm.stage}
                                onValueChange={v => setStageForm(f => ({ ...f, stage: v as ApplicationStage }))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STAGES.map(s => (
                                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>ATS Notes</Label>
                            <Textarea
                                rows={3}
                                value={stageForm.ats_notes}
                                onChange={e => setStageForm(f => ({ ...f, ats_notes: e.target.value }))}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setStageDialog(null)}>Cancel</Button>
                            <Button onClick={handleAdvanceStage} disabled={submitting}>
                                {submitting ? 'Saving…' : 'Update Stage'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
