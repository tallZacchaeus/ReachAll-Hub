import { Head, router } from "@inertiajs/react";
import { ArrowLeft, Plus, CheckCircle2, CalendarDays, User, ClipboardList, FileText } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type { OneOnOne, OneOnOneStatus, ActionItem } from "@/types/feedback";

interface Props {
    oneOnOne:    OneOnOne;
    canEdit:     boolean;
    authUserId:  number;
}

const STATUS_CLASSES: Record<OneOnOneStatus, string> = {
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function formatDateTime(iso: string): string {
    try {
        return new Intl.DateTimeFormat("en-GB", {
            dateStyle: "full",
            timeStyle: "short",
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function putMeeting(id: number, payload: Record<string, unknown>, options?: object) {
    router.put(route("feedback.1on1s.update", id), payload as Record<string, string>, options);
}

export default function OneOnOnePage({ oneOnOne: initial, canEdit }: Props) {
    const [meeting, setMeeting] = useState(initial);
    const [agenda, setAgenda] = useState(initial.agenda ?? "");
    const [notes, setNotes] = useState(initial.notes ?? "");
    const [actionItems, setActionItems] = useState<ActionItem[]>(initial.action_items ?? []);
    const [editingAgenda, setEditingAgenda] = useState(false);
    const [editingNotes, setEditingNotes] = useState(false);
    const [newActionText, setNewActionText] = useState("");
    const [newActionDue, setNewActionDue] = useState("");
    const [saving, setSaving] = useState(false);

    function saveAgenda() {
        setSaving(true);
        putMeeting(meeting.id, { agenda }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: () => setEditingAgenda(false),
        });
    }

    function saveNotes() {
        setSaving(true);
        putMeeting(meeting.id, { notes }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
            onSuccess: () => setEditingNotes(false),
        });
    }

    function toggleActionItem(index: number) {
        const items = actionItems.map((a, i) =>
            i === index ? { ...a, done: !a.done } : a,
        );
        setActionItems(items);
        putMeeting(meeting.id, { action_items: JSON.stringify(items) }, { preserveScroll: true });
    }

    function addActionItem() {
        if (!newActionText.trim()) return;
        const items: ActionItem[] = [
            ...actionItems,
            { text: newActionText.trim(), done: false, due_date: newActionDue || null },
        ];
        setActionItems(items);
        setNewActionText("");
        setNewActionDue("");
        putMeeting(meeting.id, { action_items: JSON.stringify(items) }, { preserveScroll: true });
    }

    function markCompleted() {
        if (!confirm("Mark this 1:1 as completed?")) return;
        putMeeting(meeting.id, { status: "completed" }, {
            onSuccess: () => setMeeting((prev) => ({ ...prev, status: "completed" })),
        });
    }

    const pendingCount = actionItems.filter((a) => !a.done).length;

    return (
        <>
            <Head title={`1:1 — ${meeting.employee?.name ?? "Meeting"}`} />
            <div className="space-y-6 max-w-3xl">
                {/* Back */}
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-1 mb-2"
                        onClick={() => router.visit(route("feedback.1on1s.index"))}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>

                    {/* Header */}
                    <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-foreground">
                                1:1 — {meeting.employee?.name ?? "Meeting"}
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                with {meeting.manager?.name ?? "Manager"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={STATUS_CLASSES[meeting.status]}>
                                {meeting.status}
                            </Badge>
                            {canEdit && meeting.status === "scheduled" && (
                                <Button size="sm" onClick={markCompleted}>
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    Mark Completed
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Meta cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                            <CalendarDays className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">Scheduled</p>
                                <p className="text-sm font-medium">{formatDateTime(meeting.scheduled_at)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                            <User className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">Participants</p>
                                <p className="text-sm font-medium">
                                    {meeting.manager?.name} &amp; {meeting.employee?.name}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Agenda */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-base">
                            <span className="flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" />
                                Agenda
                            </span>
                            {canEdit && !editingAgenda && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingAgenda(true)}
                                >
                                    Edit
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {editingAgenda ? (
                            <div className="space-y-3">
                                <Textarea
                                    rows={5}
                                    value={agenda}
                                    onChange={(e) => setAgenda(e.target.value)}
                                    placeholder="Topics and questions to cover…"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={saveAgenda}
                                        disabled={saving}
                                    >
                                        {saving ? "Saving…" : "Save"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setAgenda(meeting.agenda ?? "");
                                            setEditingAgenda(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {agenda || "No agenda set yet."}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-base">
                            <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Meeting Notes
                            </span>
                            {canEdit && !editingNotes && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingNotes(true)}
                                >
                                    Edit
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {editingNotes ? (
                            <div className="space-y-3">
                                <Textarea
                                    rows={6}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Post-meeting notes, decisions, and outcomes…"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={saveNotes}
                                        disabled={saving}
                                    >
                                        {saving ? "Saving…" : "Save"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setNotes(meeting.notes ?? "");
                                            setEditingNotes(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {notes || "No notes yet."}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Action Items */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                            Action Items
                            {pendingCount > 0 && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    {pendingCount} open
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {actionItems.length === 0 && (
                            <p className="text-sm text-muted-foreground">No action items yet.</p>
                        )}
                        {actionItems.map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-3 p-3 rounded-lg border ${
                                    item.done
                                        ? "bg-muted/40 border-border/50"
                                        : "bg-card border-border"
                                }`}
                            >
                                <Checkbox
                                    checked={item.done}
                                    onCheckedChange={() => canEdit && toggleActionItem(i)}
                                    disabled={!canEdit}
                                    aria-label={`Mark "${item.text}" as ${item.done ? "incomplete" : "done"}`}
                                    className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>
                                        {item.text}
                                    </p>
                                    {item.due_date && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Due: {item.due_date}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add new action item */}
                        {canEdit && meeting.status !== "cancelled" && (
                            <div className="flex gap-2 pt-2">
                                <div className="flex-1 min-w-0 space-y-2">
                                    <Input
                                        placeholder="Add action item…"
                                        value={newActionText}
                                        onChange={(e) => setNewActionText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addActionItem()}
                                    />
                                    <Input
                                        type="date"
                                        placeholder="Due date (optional)"
                                        value={newActionDue}
                                        onChange={(e) => setNewActionDue(e.target.value)}
                                        className="max-w-[180px]"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addActionItem}
                                    disabled={!newActionText.trim()}
                                    className="self-start"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OneOnOnePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
