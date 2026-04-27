import { router, Link } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import type { PreboardingTask, PreboardingDetailOffer, TaskType } from '@/types/onboarding';

interface Props {
    offer: PreboardingDetailOffer;
    tasks: PreboardingTask[];
    tasks_total: number;
    tasks_completed: number;
}

const TASK_TYPE_LABELS: Record<TaskType, string> = {
    document_upload:  'Document Upload',
    policy_ack:       'Policy Acknowledgement',
    equipment_request:'Equipment Request',
    it_access:        'IT Access Setup',
    bank_details:     'Bank Details',
    compliance_doc:   'Compliance Document',
};

const TASK_TYPE_ICONS: Record<TaskType, string> = {
    document_upload:  '📄',
    policy_ack:       '📋',
    equipment_request:'💻',
    it_access:        '🔑',
    bank_details:     '🏦',
    compliance_doc:   '⚖️',
};

const STATUS_STYLES: Record<PreboardingTask['status'], string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    waived:    'bg-zinc-100 text-zinc-500',
};

const TASK_TYPES: TaskType[] = [
    'document_upload',
    'policy_ack',
    'equipment_request',
    'it_access',
    'bank_details',
    'compliance_doc',
];

export default function PreboardingDetailPage({
    offer,
    tasks,
    tasks_total,
    tasks_completed,
}: Props) {
    const [completeDialog, setCompleteDialog] = useState<PreboardingTask | null>(null);
    const [waiveDialog, setWaiveDialog]       = useState<PreboardingTask | null>(null);
    const [addTaskOpen, setAddTaskOpen]       = useState(false);
    const [submitting, setSubmitting]         = useState(false);

    const [completeNotes, setCompleteNotes] = useState('');
    const [waiveNotes, setWaiveNotes]       = useState('');

    const [addForm, setAddForm] = useState({
        task_type:   'document_upload' as TaskType,
        title:       '',
        description: '',
        due_date:    '',
    });

    const progressPct = tasks_total > 0 ? Math.round((tasks_completed / tasks_total) * 100) : 0;

    function handleComplete() {
        if (!completeDialog) return;
        setSubmitting(true);
        router.post(
            route('recruitment.preboarding.tasks.complete', completeDialog.id),
            { notes: completeNotes },
            {
                onSuccess: () => { setCompleteDialog(null); setCompleteNotes(''); },
                onFinish:  () => setSubmitting(false),
            },
        );
    }

    function handleWaive() {
        if (!waiveDialog) return;
        setSubmitting(true);
        router.post(
            route('recruitment.preboarding.tasks.waive', waiveDialog.id),
            { notes: waiveNotes },
            {
                onSuccess: () => { setWaiveDialog(null); setWaiveNotes(''); },
                onFinish:  () => setSubmitting(false),
            },
        );
    }

    function handleAddTask() {
        setSubmitting(true);
        router.post(
            route('recruitment.preboarding.tasks.store', offer.id),
            addForm,
            {
                onSuccess: () => {
                    setAddTaskOpen(false);
                    setAddForm({ task_type: 'document_upload', title: '', description: '', due_date: '' });
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <MainLayout title="Pre-boarding Checklist">
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Link href={route('recruitment.preboarding.index')} className="hover:underline">
                        Pre-boarding
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">{offer.candidate.name}</span>
                </nav>

                {/* Header card */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="text-lg">{offer.candidate.name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {offer.position_title}
                                    {offer.start_date && (
                                        <>
                                            {' · '}
                                            Start: {new Date(offer.start_date).toLocaleDateString()}
                                        </>
                                    )}
                                </p>
                            </div>
                            <span className="self-start rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800 capitalize">
                                {offer.status}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Progress bar */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Overall progress</span>
                                <span className="font-medium tabular-nums">
                                    {tasks_completed}/{tasks_total} tasks — {progressPct}%
                                </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                    role="progressbar"
                                    aria-valuenow={progressPct}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Task list */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Checklist</CardTitle>
                        <Button size="sm" onClick={() => setAddTaskOpen(true)}>
                            Add Task
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {tasks.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No tasks yet. Click &ldquo;Add Task&rdquo; to create the first one.
                            </p>
                        )}
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className="mt-0.5 text-lg leading-none"
                                        aria-hidden="true"
                                    >
                                        {TASK_TYPE_ICONS[task.task_type]}
                                    </span>
                                    <div>
                                        <p className="font-medium text-sm">{task.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {TASK_TYPE_LABELS[task.task_type]}
                                            {task.due_date && (
                                                <>
                                                    {' · '}
                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                </>
                                            )}
                                        </p>
                                        {task.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {task.description}
                                            </p>
                                        )}
                                        {task.status !== 'pending' && task.notes && (
                                            <p className="mt-1 text-xs italic text-muted-foreground">
                                                Note: {task.notes}
                                            </p>
                                        )}
                                        {task.completed_by && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Completed by {task.completed_by.name}
                                                {task.completed_at && (
                                                    <> · {new Date(task.completed_at).toLocaleDateString()}</>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[task.status]}`}
                                    >
                                        {task.status}
                                    </span>
                                    {task.status === 'pending' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs"
                                                onClick={() => {
                                                    setCompleteDialog(task);
                                                    setCompleteNotes('');
                                                }}
                                            >
                                                Mark Complete
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs text-muted-foreground"
                                                onClick={() => {
                                                    setWaiveDialog(task);
                                                    setWaiveNotes('');
                                                }}
                                            >
                                                Waive
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Mark Complete Dialog */}
            <Dialog open={!!completeDialog} onOpenChange={(o) => !o && setCompleteDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Task Complete</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Marking <strong>{completeDialog?.title}</strong> as completed.
                        </p>
                        <div className="space-y-1">
                            <Label htmlFor="complete-notes">Notes (optional)</Label>
                            <Textarea
                                id="complete-notes"
                                rows={3}
                                placeholder="Any relevant details…"
                                value={completeNotes}
                                onChange={(e) => setCompleteNotes(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCompleteDialog(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleComplete} disabled={submitting}>
                                {submitting ? 'Saving…' : 'Confirm Complete'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Waive Dialog */}
            <Dialog open={!!waiveDialog} onOpenChange={(o) => !o && setWaiveDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Waive Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Waiving <strong>{waiveDialog?.title}</strong>. This task will be skipped.
                        </p>
                        <div className="space-y-1">
                            <Label htmlFor="waive-notes">Reason (optional)</Label>
                            <Textarea
                                id="waive-notes"
                                rows={3}
                                placeholder="Reason for waiving this task…"
                                value={waiveNotes}
                                onChange={(e) => setWaiveNotes(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setWaiveDialog(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleWaive}
                                disabled={submitting}
                            >
                                {submitting ? 'Saving…' : 'Waive Task'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Task Dialog */}
            <Dialog open={addTaskOpen} onOpenChange={(o) => !o && setAddTaskOpen(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Pre-boarding Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="add-task-type">Task Type</Label>
                            <Select
                                value={addForm.task_type}
                                onValueChange={(v) =>
                                    setAddForm((f) => ({ ...f, task_type: v as TaskType }))
                                }
                            >
                                <SelectTrigger id="add-task-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TASK_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {TASK_TYPE_LABELS[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="add-task-title">
                                Title <span aria-hidden="true" className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="add-task-title"
                                maxLength={200}
                                placeholder="Task title"
                                value={addForm.title}
                                onChange={(e) =>
                                    setAddForm((f) => ({ ...f, title: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="add-task-desc">Description (optional)</Label>
                            <Textarea
                                id="add-task-desc"
                                rows={2}
                                placeholder="Additional instructions…"
                                value={addForm.description}
                                onChange={(e) =>
                                    setAddForm((f) => ({ ...f, description: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="add-task-due">Due Date (optional)</Label>
                            <Input
                                id="add-task-due"
                                type="date"
                                value={addForm.due_date}
                                onChange={(e) =>
                                    setAddForm((f) => ({ ...f, due_date: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddTask}
                                disabled={submitting || !addForm.title.trim()}
                            >
                                {submitting ? 'Adding…' : 'Add Task'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
