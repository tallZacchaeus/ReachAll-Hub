import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    ShieldOff,
    Monitor,
    CreditCard,
    HandshakeIcon,
    BadgeCheck,
    Briefcase,
    Building2,
    ArrowLeft,
} from 'lucide-react';
import type {
    OffboardingChecklist,
    OffboardingTask,
    OffboardingTaskType,
    OffboardingStatus,
} from '@/types/offboarding';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    checklist: OffboardingChecklist;
    can_manage_payroll: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TASK_LABELS: Record<OffboardingTaskType, string> = {
    exit_interview:    'Exit Interview',
    access_revocation: 'Access Revocation',
    equipment_return:  'Equipment Return',
    document_handover: 'Document Handover',
    hr_clearance:      'HR Clearance',
    finance_clearance: 'Finance Clearance',
    final_payroll:     'Final Payroll',
    clearance_form:    'Clearance Certificate',
};

const DEPT_LABELS: Record<OffboardingTaskType, string> = {
    exit_interview:    'HR',
    access_revocation: 'IT',
    equipment_return:  'HR',
    document_handover: 'HR',
    hr_clearance:      'HR',
    finance_clearance: 'Finance',
    final_payroll:     'Payroll',
    clearance_form:    'HR',
};

const STATUS_VARIANTS = {
    pending:   'secondary',
    completed: 'default',
    waived:    'outline',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TaskIcon({ type }: { type: OffboardingTaskType }) {
    const cls = 'h-4 w-4 shrink-0';
    switch (type) {
        case 'exit_interview':    return <HandshakeIcon className={cls} />;
        case 'access_revocation': return <ShieldOff className={cls} />;
        case 'equipment_return':  return <Monitor className={cls} />;
        case 'document_handover': return <FileText className={cls} />;
        case 'hr_clearance':      return <BadgeCheck className={cls} />;
        case 'finance_clearance': return <Building2 className={cls} />;
        case 'final_payroll':     return <CreditCard className={cls} />;
        case 'clearance_form':    return <Briefcase className={cls} />;
        default:                  return <FileText className={cls} />;
    }
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch {
        return iso;
    }
}

const CHECKLIST_STATUS_LABELS: Record<OffboardingStatus, string> = {
    initiated:   'Initiated',
    in_progress: 'In Progress',
    completed:   'Completed',
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, completed, total }: { pct: number; completed: number; total: number }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                    {completed} of {total} tasks done
                </span>
                <span className="font-medium">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OffboardingDetailPage({ checklist, can_manage_payroll }: Props) {
    const [completeTask, setCompleteTask] = useState<OffboardingTask | null>(null);
    const [waiveTask, setWaiveTask]       = useState<OffboardingTask | null>(null);
    const [exitInterviewOpen, setExitInterviewOpen] = useState(false);
    const [submitting, setSubmitting]     = useState(false);

    const [completeNotes, setCompleteNotes]  = useState('');
    const [waiveNotes, setWaiveNotes]        = useState('');
    const [exitNotes, setExitNotes]          = useState(checklist.notes ?? '');

    const completedOrWaived = checklist.tasks.filter(
        (t) => t.status === 'completed' || t.status === 'waived',
    ).length;
    const totalTasks = checklist.tasks.length;
    const allDone    = totalTasks > 0 && completedOrWaived === totalTasks;

    // ── Task complete ──────────────────────────────────────────────────────
    function handleComplete() {
        if (!completeTask) return;
        setSubmitting(true);
        router.post(
            route('admin.offboarding.tasks.complete', completeTask.id),
            { notes: completeNotes },
            {
                onSuccess: () => { setCompleteTask(null); setCompleteNotes(''); },
                onFinish:  () => setSubmitting(false),
            },
        );
    }

    // ── Task waive ─────────────────────────────────────────────────────────
    function handleWaive() {
        if (!waiveTask) return;
        setSubmitting(true);
        router.post(
            route('admin.offboarding.tasks.waive', waiveTask.id),
            { notes: waiveNotes },
            {
                onSuccess: () => { setWaiveTask(null); setWaiveNotes(''); },
                onFinish:  () => setSubmitting(false),
            },
        );
    }

    // ── Exit interview ─────────────────────────────────────────────────────
    function handleExitInterview() {
        setSubmitting(true);
        router.post(
            route('admin.offboarding.exit-interview', checklist.id),
            { notes: exitNotes },
            {
                onSuccess: () => setExitInterviewOpen(false),
                onFinish:  () => setSubmitting(false),
            },
        );
    }

    // ── Issue clearance ────────────────────────────────────────────────────
    function handleIssueClearance() {
        if (!allDone) return;
        router.post(
            route('admin.offboarding.complete', checklist.id),
            {},
            { onSuccess: () => undefined },
        );
    }

    // ── Can complete a given task ──────────────────────────────────────────
    function canCompleteTask(task: OffboardingTask): boolean {
        if (task.status !== 'pending') return false;
        if (task.task_type === 'final_payroll' && !can_manage_payroll) return false;
        return true;
    }

    return (
        <MainLayout title="Offboarding Detail">
            <div className="mx-auto max-w-5xl space-y-6 p-6">
                {/* Back */}
                <Link
                    href={route('admin.offboarding.index')}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    All offboarding checklists
                </Link>

                {/* Employee header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold">{checklist.user.name}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {checklist.user.employee_id}
                                    {checklist.user.department && ` · ${checklist.user.department}`}
                                    {checklist.user.position && ` · ${checklist.user.position}`}
                                </p>
                                {checklist.termination_date && (
                                    <p className="text-sm text-muted-foreground">
                                        Termination date: {formatDate(checklist.termination_date)}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col items-start gap-2 sm:items-end">
                                <Badge variant={
                                    checklist.status === 'completed' ? 'outline' :
                                    checklist.status === 'in_progress' ? 'default' : 'secondary'
                                }>
                                    {CHECKLIST_STATUS_LABELS[checklist.status]}
                                </Badge>
                                {checklist.clearance_signed_at && (
                                    <p className="text-xs text-muted-foreground">
                                        Cleared: {formatDate(checklist.clearance_signed_at)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4">
                            <ProgressBar
                                pct={checklist.completion_percentage}
                                completed={completedOrWaived}
                                total={totalTasks}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                {checklist.status !== 'completed' && (
                    <div className="flex flex-wrap gap-3">
                        {!checklist.exit_interview_completed_at && (
                            <Button
                                variant="outline"
                                onClick={() => setExitInterviewOpen(true)}
                            >
                                Mark Exit Interview Complete
                            </Button>
                        )}
                        {checklist.exit_interview_completed_at && (
                            <p className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Exit interview completed {formatDate(checklist.exit_interview_completed_at)}
                            </p>
                        )}
                        <Button
                            disabled={!allDone}
                            onClick={handleIssueClearance}
                            title={allDone ? undefined : 'All tasks must be completed or waived first'}
                        >
                            Issue Clearance Certificate
                        </Button>
                    </div>
                )}
                {checklist.status === 'completed' && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Clearance certificate issued on {formatDate(checklist.clearance_signed_at)}.</span>
                    </div>
                )}

                {/* Task list */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Checklist Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {checklist.tasks.map((task) => (
                            <div key={task.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3 sm:items-center">
                                    <TaskIcon type={task.task_type} />
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium">{task.title}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={STATUS_VARIANTS[task.status]} className="text-xs">
                                                {task.status === 'pending'   && <Clock className="mr-1 h-3 w-3" />}
                                                {task.status === 'completed' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                                {task.status === 'waived'    && <XCircle className="mr-1 h-3 w-3" />}
                                                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {DEPT_LABELS[task.task_type]}
                                            </span>
                                            {task.completed_at && (
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(task.completed_at)}
                                                </span>
                                            )}
                                        </div>
                                        {task.notes && (
                                            <p className="text-xs text-muted-foreground">{task.notes}</p>
                                        )}
                                        {task.task_type === 'final_payroll' && !can_manage_payroll && task.status === 'pending' && (
                                            <p className="text-xs text-amber-600">
                                                Requires payroll.manage permission to complete.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {checklist.status !== 'completed' && task.status === 'pending' && (
                                    <div className="flex shrink-0 gap-2 sm:ml-4">
                                        <Button
                                            size="sm"
                                            disabled={!canCompleteTask(task)}
                                            onClick={() => { setCompleteTask(task); setCompleteNotes(''); }}
                                        >
                                            Complete
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => { setWaiveTask(task); setWaiveNotes(''); }}
                                        >
                                            Waive
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* ── Complete Task Dialog ─────────────────────────────────────── */}
            <Dialog open={!!completeTask} onOpenChange={(open) => !open && setCompleteTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Task</DialogTitle>
                        <DialogDescription>
                            Mark &ldquo;{completeTask?.title}&rdquo; as completed. Optionally add a note.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                            <Label htmlFor="complete-notes">Notes (optional)</Label>
                            <Textarea
                                id="complete-notes"
                                value={completeNotes}
                                onChange={(e) => setCompleteNotes(e.target.value)}
                                placeholder="Add any relevant notes..."
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setCompleteTask(null)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleComplete} disabled={submitting}>
                                {submitting ? 'Saving…' : 'Mark Complete'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Waive Task Dialog ────────────────────────────────────────── */}
            <Dialog open={!!waiveTask} onOpenChange={(open) => !open && setWaiveTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Waive Task</DialogTitle>
                        <DialogDescription>
                            Waive &ldquo;{waiveTask?.title}&rdquo;. Please provide a reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                            <Label htmlFor="waive-notes">Reason</Label>
                            <Textarea
                                id="waive-notes"
                                value={waiveNotes}
                                onChange={(e) => setWaiveNotes(e.target.value)}
                                placeholder="Why is this task being waived?"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setWaiveTask(null)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button variant="outline" onClick={handleWaive} disabled={submitting}>
                                {submitting ? 'Saving…' : 'Waive Task'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Exit Interview Dialog ────────────────────────────────────── */}
            <Dialog open={exitInterviewOpen} onOpenChange={setExitInterviewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Exit Interview Complete</DialogTitle>
                        <DialogDescription>
                            Record the exit interview as completed for {checklist.user.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                            <Label htmlFor="exit-notes">Exit Interview Notes</Label>
                            <Textarea
                                id="exit-notes"
                                value={exitNotes}
                                onChange={(e) => setExitNotes(e.target.value)}
                                placeholder="Key themes, feedback, or observations from the exit interview..."
                                rows={5}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setExitInterviewOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleExitInterview} disabled={submitting}>
                                {submitting ? 'Saving…' : 'Save & Mark Complete'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
