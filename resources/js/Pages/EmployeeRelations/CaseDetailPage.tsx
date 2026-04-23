import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { HrCaseRow, CaseStatus, PartyRole } from '@/types/employee-relations';

interface StaffUser {
    id: number;
    name: string;
}

interface Props {
    case: HrCaseRow;
    can_manage: boolean;
    staff_list: StaffUser[];
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

const ALL_STATUSES: CaseStatus[] = [
    'open', 'under_review', 'investigating', 'pending_action', 'resolved', 'closed', 'dismissed',
];

export default function CaseDetailPage({ case: hrCase, can_manage, staff_list }: Props) {
    const [noteContent, setNoteContent] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [addingPartyId, setAddingPartyId] = useState('');
    const [addingPartyRole, setAddingPartyRole] = useState<PartyRole>('respondent');
    const [outcomeText, setOutcomeText] = useState(hrCase.outcome ?? '');
    const [editStatus, setEditStatus] = useState<CaseStatus>(hrCase.status);
    const [assignedTo, setAssignedTo] = useState(hrCase.assigned_to_id?.toString() ?? '');
    const [submitting, setSubmitting] = useState(false);

    function handleAddNote() {
        if (!noteContent.trim()) return;
        setSubmitting(true);
        router.post(route('er.cases.notes.store', hrCase.id), {
            content: noteContent,
            is_internal: isInternal,
        }, {
            onSuccess: () => { setNoteContent(''); setIsInternal(false); },
            onFinish: () => setSubmitting(false),
        });
    }

    function handleSaveCase() {
        setSubmitting(true);
        router.put(route('er.cases.update', hrCase.id), {
            status: editStatus,
            assigned_to_id: assignedTo || null,
            outcome: outcomeText || null,
        }, {
            onFinish: () => setSubmitting(false),
        });
    }

    function handleAddParty() {
        if (!addingPartyId) return;
        router.post(route('er.cases.parties.add', hrCase.id), {
            user_id: parseInt(addingPartyId),
            role: addingPartyRole,
        }, {
            onSuccess: () => setAddingPartyId(''),
        });
    }

    function handleRemoveParty(partyId: number) {
        router.delete(route('er.cases.parties.remove', { hrCase: hrCase.id, party: partyId }));
    }

    return (
        <MainLayout title={`Case ${hrCase.case_number}`}>
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <Link href={route('er.cases.index')} className="text-sm text-muted-foreground hover:underline">
                        ← Cases
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-xl font-semibold font-mono">{hrCase.case_number}</h1>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[hrCase.status]}`}>
                        {hrCase.status.replace('_', ' ')}
                    </span>
                    {hrCase.confidential && (
                        <span className="text-xs rounded px-2 py-0.5 bg-orange-100 text-orange-700">Confidential</span>
                    )}
                </div>

                {/* Case Summary */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Case Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Subject: </span><span className="font-medium">{hrCase.subject}</span></div>
                        <div><span className="text-muted-foreground">Type: </span><span className="capitalize">{hrCase.type.replace('_', ' ')}</span></div>
                        <div><span className="text-muted-foreground">Priority: </span><span className="capitalize">{hrCase.priority}</span></div>
                        <div><span className="text-muted-foreground">Reporter: </span>{hrCase.reported_by?.name ?? <em>Anonymous</em>}</div>
                        <div className="col-span-2">
                            <span className="text-muted-foreground">Description: </span>
                            <p className="mt-1 whitespace-pre-wrap">{hrCase.description}</p>
                        </div>
                        {hrCase.outcome && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Outcome: </span>
                                <p className="mt-1 whitespace-pre-wrap">{hrCase.outcome}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Case Management (HR only) */}
                {can_manage && (
                    <Card>
                        <CardHeader><CardTitle className="text-base">Manage Case</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Status</Label>
                                    <Select value={editStatus} onValueChange={v => setEditStatus(v as CaseStatus)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ALL_STATUSES.map(s => (
                                                <SelectItem key={s} value={s} className="capitalize">
                                                    {s.replace('_', ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Assign To</Label>
                                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Unassigned</SelectItem>
                                            {staff_list.map(u => (
                                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label>Outcome / Resolution Notes</Label>
                                <Textarea rows={3} value={outcomeText} onChange={e => setOutcomeText(e.target.value)} />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSaveCase} disabled={submitting}>
                                    {submitting ? 'Saving…' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Parties */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Parties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {hrCase.parties.length === 0 && (
                            <p className="text-sm text-muted-foreground">No parties added yet.</p>
                        )}
                        {hrCase.parties.map(p => (
                            <div key={p.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                                <div>
                                    <span className="font-medium">{p.user?.name ?? 'Unknown'}</span>
                                    <span className="ml-2 text-xs capitalize text-muted-foreground">{p.role}</span>
                                </div>
                                {can_manage && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleRemoveParty(p.id)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))}
                        {can_manage && (
                            <div className="flex gap-2 pt-2">
                                <Select value={addingPartyId} onValueChange={setAddingPartyId}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select employee…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staff_list.map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={addingPartyRole} onValueChange={v => setAddingPartyRole(v as PartyRole)}>
                                    <SelectTrigger className="w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(['complainant', 'respondent', 'witness', 'investigator'] as PartyRole[]).map(r => (
                                            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddParty} disabled={!addingPartyId}>Add</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Notes & Activity</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {hrCase.notes.length === 0 && (
                            <p className="text-sm text-muted-foreground">No notes yet.</p>
                        )}
                        {hrCase.notes.map(note => (
                            <div
                                key={note.id}
                                className={`rounded-lg p-3 text-sm ${note.is_internal ? 'border border-orange-200 bg-orange-50' : 'bg-muted/40'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{note.author?.name ?? 'System'}</span>
                                    <div className="flex items-center gap-2">
                                        {note.is_internal && (
                                            <span className="text-xs text-orange-600 font-medium">Internal</span>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(note.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <p className="whitespace-pre-wrap">{note.content}</p>
                            </div>
                        ))}

                        <div className="space-y-2 pt-2 border-t">
                            <Textarea
                                placeholder="Add a note…"
                                rows={3}
                                value={noteContent}
                                onChange={e => setNoteContent(e.target.value)}
                            />
                            {can_manage && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="internal-note"
                                        checked={isInternal}
                                        onChange={e => setIsInternal(e.target.checked)}
                                        className="rounded"
                                    />
                                    <Label htmlFor="internal-note" className="text-sm">Internal (HR only)</Label>
                                </div>
                            )}
                            <div className="flex justify-end">
                                <Button onClick={handleAddNote} disabled={submitting || !noteContent.trim()}>
                                    {submitting ? 'Adding…' : 'Add Note'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
