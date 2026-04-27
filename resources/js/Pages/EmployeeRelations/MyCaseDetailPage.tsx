import { router, Link } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/layouts/MainLayout';
import type { HrCaseRow, CaseStatus } from '@/types/employee-relations';

interface Props {
    case: HrCaseRow;
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

export default function MyCaseDetailPage({ case: hrCase }: Props) {
    const [noteContent, setNoteContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isOpen = !['resolved', 'closed', 'dismissed'].includes(hrCase.status);

    function handleAddNote() {
        if (!noteContent.trim()) return;
        setSubmitting(true);
        router.post(route('er.my-cases.notes.store', hrCase.id), { content: noteContent }, {
            onSuccess: () => setNoteContent(''),
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <MainLayout title={`Case ${hrCase.case_number}`}>
            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <Link href={route('er.my-cases.index')} className="text-sm text-muted-foreground hover:underline">
                        ← My Cases
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-xl font-semibold font-mono">{hrCase.case_number}</h1>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[hrCase.status]}`}>
                        {hrCase.status.replace('_', ' ')}
                    </span>
                </div>

                <Card>
                    <CardHeader><CardTitle className="text-base">Case Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Subject: </span><span className="font-medium">{hrCase.subject}</span></div>
                        <div><span className="text-muted-foreground">Type: </span><span className="capitalize">{hrCase.type}</span></div>
                        <div><span className="text-muted-foreground">Priority: </span><span className="capitalize">{hrCase.priority}</span></div>
                        <div>
                            <span className="text-muted-foreground">Assigned To: </span>
                            {hrCase.assigned_to?.name ?? <span className="italic">Unassigned</span>}
                        </div>
                        {hrCase.description !== '[Confidential]' && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Description: </span>
                                <p className="mt-1 whitespace-pre-wrap">{hrCase.description}</p>
                            </div>
                        )}
                        {hrCase.outcome && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Resolution: </span>
                                <p className="mt-1 whitespace-pre-wrap">{hrCase.outcome}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-base">Correspondence</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {hrCase.notes.length === 0 && (
                            <p className="text-sm text-muted-foreground">No messages yet.</p>
                        )}
                        {hrCase.notes.map(note => (
                            <div key={note.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{note.author?.name ?? 'HR Team'}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(note.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p className="whitespace-pre-wrap">{note.content}</p>
                            </div>
                        ))}

                        {isOpen && (
                            <div className="space-y-2 pt-2 border-t">
                                <Textarea
                                    placeholder="Add a message or update…"
                                    rows={3}
                                    value={noteContent}
                                    onChange={e => setNoteContent(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button onClick={handleAddNote} disabled={submitting || !noteContent.trim()}>
                                        {submitting ? 'Sending…' : 'Send Message'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
