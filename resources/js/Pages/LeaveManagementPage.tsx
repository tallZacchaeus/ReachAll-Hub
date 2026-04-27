import { router, useForm, usePage } from "@inertiajs/react";
import { format, addDays, eachDayOfInterval, isWeekend, parseISO, startOfMonth, endOfMonth, getDaysInMonth, getDay } from "date-fns";
import {
    CalendarIcon,
    Check,
    X,
    Clock,
    Eye,
    User,
    FileText,
    Plus,
    Pencil,
    Trash2,
    AlertCircle,
    Info,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type {
    LeaveType,
    LeaveBalance,
    PublicHoliday,
    LeaveRequest,
    LeaveHistoryItem,
    TeamLeaveEntry,
} from "@/types/leave";

// ---------------------------------------------------------------------------
// Page props
// ---------------------------------------------------------------------------

interface LeaveManagementPageProps {
    userRole: string;
    currentUserName: string;
    currentUserEmployeeId?: string | null;
    canManageLeave: boolean;
    leaveTypes: LeaveType[];
    balances: LeaveBalance[];
    /** Legacy balance kept for backward compat */
    leaveBalance: {
        annual: { total: number; used: number; remaining: number };
        sick: { total: number; used: number; remaining: number };
        personal: { total: number; used: number; remaining: number };
    };
    requests: LeaveRequest[];
    leaveHistory: LeaveHistoryItem[];
    // Admin only
    publicHolidays?: PublicHoliday[];
    allLeaveTypes?: LeaveType[];
    allPublicHolidays?: PublicHoliday[];
    teamLeave?: TeamLeaveEntry[];
}

// ---------------------------------------------------------------------------
// Form shapes
// ---------------------------------------------------------------------------

type LeaveFormData = {
    leave_type_id: string;
    startDate: string;
    endDate: string;
    reason: string;
    cover_user_id: string;
};

type LeaveTypeFormData = {
    name: string;
    code: string;
    days_per_year: string;
    accrual_policy: "none" | "monthly" | "annual";
    carry_over_days: string;
    max_carry_over_days: string;
    requires_documentation: boolean;
    is_active: boolean;
};

type HolidayFormData = {
    name: string;
    date: string;
    country_code: string;
    is_recurring: boolean;
    is_active: boolean;
};

// ---------------------------------------------------------------------------
// Type-code → Tailwind background colour mapping (semantic, token-based)
// ---------------------------------------------------------------------------
const TYPE_COLOURS: Record<string, string> = {
    ANNUAL:    "bg-brand text-white",
    SICK:      "bg-destructive text-white",
    PERSONAL:  "bg-brand-yellow text-foreground",
    MATERNITY: "bg-purple-500 text-white",
    PATERNITY: "bg-blue-500 text-white",
};

function typeColour(code: string): string {
    return TYPE_COLOURS[code?.toUpperCase()] ?? "bg-muted text-foreground";
}

// ---------------------------------------------------------------------------
// Small utility — approximate working-day count client-side (excludes weekends only;
// server calculates the authoritative value including holidays)
// ---------------------------------------------------------------------------
function approxWorkingDays(start: Date, end: Date): number {
    if (start > end) return 0;
    const days = eachDayOfInterval({ start, end });
    return days.filter((d) => !isWeekend(d)).length;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
    const cls: Record<string, string> = {
        pending:  "bg-brand-yellow text-foreground",
        approved: "bg-brand text-white",
        rejected: "bg-destructive text-white",
        Approved: "bg-brand text-white",
        Rejected: "bg-destructive text-white",
    };
    const icon = status === "approved" || status === "Approved"
        ? <Check className="w-3 h-3" />
        : status === "rejected" || status === "Rejected"
            ? <X className="w-3 h-3" />
            : <Clock className="w-3 h-3" />;
    return (
        <Badge className={cls[status] ?? "bg-muted text-foreground"}>
            <span className="flex items-center gap-1">{icon}{status}</span>
        </Badge>
    );
}

// ---------------------------------------------------------------------------
// Balance cards — driven by the new balances prop
// ---------------------------------------------------------------------------

function BalanceCards({ balances }: { balances: LeaveBalance[] }) {
    if (balances.length === 0) return null;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {balances.map((b, i) => {
                const pct = b.entitled_days + b.carried_over_days > 0
                    ? (b.remaining / (b.entitled_days + b.carried_over_days)) * 100
                    : 0;
                const isPrimary = i === 0;
                return (
                    <Card
                        key={b.leave_type_id}
                        className={isPrimary
                            ? "bg-gradient-to-br from-brand to-brand/80 text-white border-0 shadow-lg"
                            : "bg-card border shadow-sm"}
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-2">
                                <p className={`text-sm ${isPrimary ? "opacity-90" : "text-muted-foreground"}`}>
                                    {b.leave_type.name}
                                </p>
                                <CalendarIcon className={`w-4 h-4 ${isPrimary ? "opacity-70" : "text-brand"}`} />
                            </div>
                            <p className={`text-3xl font-bold mb-0.5 ${isPrimary ? "" : "text-foreground"}`}>
                                {b.remaining}
                            </p>
                            <p className={`text-xs mb-3 ${isPrimary ? "opacity-80" : "text-muted-foreground"}`}>
                                days remaining
                            </p>
                            <Progress
                                value={pct}
                                className={`h-1.5 ${isPrimary ? "bg-white/20" : ""}`}
                            />
                            <p className={`text-xs mt-2 ${isPrimary ? "opacity-70" : "text-muted-foreground"}`}>
                                {b.used_days} used of {b.entitled_days}
                                {b.carried_over_days > 0 && ` (+${b.carried_over_days} carried over)`}
                            </p>
                            {b.leave_type.requires_documentation && (
                                <p className={`text-xs mt-1 ${isPrimary ? "opacity-70" : "text-muted-foreground"} flex items-center gap-1`}>
                                    <Info className="w-3 h-3" /> Requires documentation
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Team calendar (month-view grid)
// ---------------------------------------------------------------------------

function TeamCalendar({ teamLeave, year, month }: {
    teamLeave: TeamLeaveEntry[];
    year: number;
    month: number; // 0-indexed
}) {
    const firstDay = new Date(year, month, 1);
    const totalDays = getDaysInMonth(firstDay);
    const startWeekday = getDay(firstDay); // 0=Sun

    // Map date string → entries
    const byDate = useMemo(() => {
        const map: Record<string, TeamLeaveEntry[]> = {};
        teamLeave.forEach((entry) => {
            const start = parseISO(entry.startDate);
            const end   = parseISO(entry.endDate);
            eachDayOfInterval({ start, end }).forEach((d) => {
                if (d.getFullYear() === year && d.getMonth() === month) {
                    const key = format(d, "yyyy-MM-dd");
                    if (!map[key]) map[key] = [];
                    map[key].push(entry);
                }
            });
        });
        return map;
    }, [teamLeave, year, month]);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div>
            <div className="grid grid-cols-7 gap-px mb-1">
                {dayNames.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {Array.from({ length: startWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-muted/30 min-h-[72px]" />
                ))}
                {Array.from({ length: totalDays }).map((_, i) => {
                    const dayNum  = i + 1;
                    const dateStr = format(new Date(year, month, dayNum), "yyyy-MM-dd");
                    const entries = byDate[dateStr] ?? [];
                    const isWE    = isWeekend(new Date(year, month, dayNum));
                    return (
                        <div
                            key={dayNum}
                            className={`bg-card min-h-[72px] p-1 ${isWE ? "bg-muted/40" : ""}`}
                        >
                            <p className={`text-xs font-medium mb-1 ${isWE ? "text-muted-foreground" : "text-foreground"}`}>
                                {dayNum}
                            </p>
                            <div className="space-y-0.5">
                                {entries.slice(0, 2).map((e) => (
                                    <div
                                        key={`${e.id}-${dateStr}`}
                                        className={`text-[10px] leading-tight rounded px-1 py-0.5 truncate ${typeColour(e.typeCode)}`}
                                        title={`${e.staffName} — ${e.leaveType}`}
                                    >
                                        {e.staffName.split(" ")[0]}
                                    </div>
                                ))}
                                {entries.length > 2 && (
                                    <div className="text-[10px] text-muted-foreground">
                                        +{entries.length - 2} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Leave types admin table
// ---------------------------------------------------------------------------

function LeaveTypesTab({
    allLeaveTypes,
    canManage,
}: {
    allLeaveTypes: LeaveType[];
    canManage: boolean;
}) {
    const blankForm: LeaveTypeFormData = {
        name: "",
        code: "",
        days_per_year: "20",
        accrual_policy: "annual",
        carry_over_days: "0",
        max_carry_over_days: "0",
        requires_documentation: false,
        is_active: true,
    };

    const [open, setOpen]         = useState(false);
    const [editing, setEditing]   = useState<LeaveType | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<LeaveTypeFormData>(blankForm);

    function openCreate() {
        reset();
        clearErrors();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(lt: LeaveType) {
        setData({
            name:                   lt.name,
            code:                   lt.code,
            days_per_year:          String(lt.days_per_year),
            accrual_policy:         lt.accrual_policy as LeaveTypeFormData["accrual_policy"],
            carry_over_days:        String(lt.carry_over_days),
            max_carry_over_days:    String(lt.max_carry_over_days),
            requires_documentation: lt.requires_documentation,
            is_active:              lt.is_active,
        });
        clearErrors();
        setEditing(lt);
        setOpen(true);
    }

    function handleSubmit() {
        if (editing) {
            put(`/leave/types/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => { setOpen(false); reset(); },
            });
        } else {
            post("/leave/types", {
                preserveScroll: true,
                onSuccess: () => { setOpen(false); reset(); },
            });
        }
    }

    function handleDestroy(lt: LeaveType) {
        if (!confirm(`Delete leave type "${lt.name}"? This action cannot be undone.`)) return;
        router.delete(`/leave/types/${lt.id}`, { preserveScroll: true });
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                    {allLeaveTypes.length} leave type{allLeaveTypes.length !== 1 ? "s" : ""} configured
                </p>
                {canManage && (
                    <Button size="sm" onClick={openCreate} className="bg-brand hover:bg-brand/90 text-white">
                        <Plus className="w-4 h-4 mr-1" /> Add Type
                    </Button>
                )}
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Days/Year</TableHead>
                            <TableHead>Accrual</TableHead>
                            <TableHead>Carry Over</TableHead>
                            <TableHead>Requires Docs</TableHead>
                            <TableHead>Status</TableHead>
                            {canManage && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allLeaveTypes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground">
                                    No leave types configured.
                                </TableCell>
                            </TableRow>
                        )}
                        {allLeaveTypes.map((lt) => (
                            <TableRow key={lt.id}>
                                <TableCell className="font-medium text-foreground">{lt.name}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="font-mono">{lt.code}</Badge>
                                </TableCell>
                                <TableCell className="text-foreground">{lt.days_per_year}</TableCell>
                                <TableCell className="capitalize text-muted-foreground">{lt.accrual_policy}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {lt.carry_over_days > 0
                                        ? `${lt.carry_over_days} (max ${lt.max_carry_over_days})`
                                        : "None"}
                                </TableCell>
                                <TableCell>
                                    {lt.requires_documentation
                                        ? <Check className="w-4 h-4 text-brand" />
                                        : <X className="w-4 h-4 text-muted-foreground" />}
                                </TableCell>
                                <TableCell>
                                    <Badge className={lt.is_active ? "bg-brand text-white" : "bg-muted text-muted-foreground"}>
                                        {lt.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                {canManage && (
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(lt)}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDestroy(lt)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            {editing ? "Edit Leave Type" : "Create Leave Type"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Configure how this leave type works for your organisation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Name *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    placeholder="Annual Leave"
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Code *</Label>
                                <Input
                                    value={data.code}
                                    onChange={(e) => setData("code", e.target.value.toUpperCase())}
                                    placeholder="ANNUAL"
                                    className="font-mono uppercase"
                                />
                                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Days per Year *</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={data.days_per_year}
                                    onChange={(e) => setData("days_per_year", e.target.value)}
                                />
                                {errors.days_per_year && <p className="text-xs text-destructive">{errors.days_per_year}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Accrual Policy *</Label>
                                <Select
                                    value={data.accrual_policy}
                                    onValueChange={(v: LeaveTypeFormData["accrual_policy"]) => setData("accrual_policy", v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="annual">Annual</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="none">None</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Carry-over Days</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={data.carry_over_days}
                                    onChange={(e) => setData("carry_over_days", e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Max Carry-over Days</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={data.max_carry_over_days}
                                    onChange={(e) => setData("max_carry_over_days", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.requires_documentation}
                                    onChange={(e) => setData("requires_documentation", e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm text-foreground">Requires documentation</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData("is_active", e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm text-foreground">Active</span>
                            </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                className="flex-1 bg-brand hover:bg-brand/90 text-white"
                                onClick={handleSubmit}
                                disabled={processing}
                            >
                                {editing ? "Save Changes" : "Create Type"}
                            </Button>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ---------------------------------------------------------------------------
// Public holidays admin tab
// ---------------------------------------------------------------------------

function PublicHolidaysTab({
    allPublicHolidays,
    canManage,
}: {
    allPublicHolidays: PublicHoliday[];
    canManage: boolean;
}) {
    const blankForm: HolidayFormData = {
        name: "",
        date: "",
        country_code: "NG",
        is_recurring: false,
        is_active: true,
    };

    const [open, setOpen]       = useState(false);
    const [editing, setEditing] = useState<PublicHoliday | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<HolidayFormData>(blankForm);

    function openCreate() {
        reset();
        clearErrors();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(h: PublicHoliday) {
        setData({
            name:         h.name,
            date:         h.date,
            country_code: h.country_code,
            is_recurring: h.is_recurring,
            is_active:    h.is_active,
        });
        clearErrors();
        setEditing(h);
        setOpen(true);
    }

    function handleSubmit() {
        if (editing) {
            put(`/leave/holidays/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => { setOpen(false); reset(); },
            });
        } else {
            post("/leave/holidays", {
                preserveScroll: true,
                onSuccess: () => { setOpen(false); reset(); },
            });
        }
    }

    function handleDestroy(h: PublicHoliday) {
        if (!confirm(`Remove "${h.name}" from public holidays?`)) return;
        router.delete(`/leave/holidays/${h.id}`, { preserveScroll: true });
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                    {allPublicHolidays.length} holiday{allPublicHolidays.length !== 1 ? "s" : ""} on record
                </p>
                {canManage && (
                    <Button size="sm" onClick={openCreate} className="bg-brand hover:bg-brand/90 text-white">
                        <Plus className="w-4 h-4 mr-1" /> Add Holiday
                    </Button>
                )}
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Recurring</TableHead>
                            <TableHead>Status</TableHead>
                            {canManage && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allPublicHolidays.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No public holidays added yet.
                                </TableCell>
                            </TableRow>
                        )}
                        {allPublicHolidays.map((h) => (
                            <TableRow key={h.id}>
                                <TableCell className="font-medium text-foreground">{h.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {format(parseISO(h.date), "dd MMM yyyy")}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{h.country_code}</Badge>
                                </TableCell>
                                <TableCell>
                                    {h.is_recurring
                                        ? <Check className="w-4 h-4 text-brand" />
                                        : <X className="w-4 h-4 text-muted-foreground" />}
                                </TableCell>
                                <TableCell>
                                    <Badge className={h.is_active ? "bg-brand text-white" : "bg-muted text-muted-foreground"}>
                                        {h.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                {canManage && (
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(h)}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDestroy(h)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            {editing ? "Edit Public Holiday" : "Add Public Holiday"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            These dates are excluded from working-day calculations.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="space-y-1">
                            <Label>Holiday Name *</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="Christmas Day"
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Date *</Label>
                                <Input
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData("date", e.target.value)}
                                />
                                {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>Country Code *</Label>
                                <Input
                                    maxLength={2}
                                    value={data.country_code}
                                    onChange={(e) => setData("country_code", e.target.value.toUpperCase())}
                                    className="uppercase font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_recurring}
                                    onChange={(e) => setData("is_recurring", e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm text-foreground">Repeats yearly</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData("is_active", e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm text-foreground">Active</span>
                            </label>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                className="flex-1 bg-brand hover:bg-brand/90 text-white"
                                onClick={handleSubmit}
                                disabled={processing}
                            >
                                {editing ? "Save Changes" : "Add Holiday"}
                            </Button>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ---------------------------------------------------------------------------
// Request details dialog
// ---------------------------------------------------------------------------

function RequestDetailsDialog({
    request,
    open,
    onClose,
    isAdmin,
    onApprove,
    onReject,
}: {
    request: LeaveRequest | LeaveHistoryItem | null;
    open: boolean;
    onClose: () => void;
    isAdmin: boolean;
    onApprove: (id: string, comment: string) => void;
    onReject:  (id: string, comment: string) => void;
}) {
    const [comment, setComment] = useState("");

    useEffect(() => { if (!open) setComment(""); }, [open]);

    if (!request) return null;

    const isPending    = request.status === "pending";
    const isAdminView  = isAdmin && "submittedDate" in request;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand" />
                        Leave Request Details
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Complete information about this leave request
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Request ID</span>
                        <span className="text-sm text-foreground font-mono">#{request.id}</span>
                    </div>

                    {isAdminView && "staffName" in request && (
                        <div className="p-3 bg-brand-subtle dark:bg-muted rounded-lg border border-brand">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-brand" />
                                <span className="text-sm text-muted-foreground">Staff Member</span>
                            </div>
                            <p className="text-foreground font-medium">{request.staffName}</p>
                            <p className="text-xs text-muted-foreground">{request.staffId}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Leave Type</Label>
                            <p className="text-foreground mt-1">
                                {"leaveType" in request ? request.leaveType : request.type}
                            </p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Duration</Label>
                            <p className="text-foreground mt-1">
                                {request.days} cal. {request.days === 1 ? "day" : "days"}
                                {"workingDays" in request && request.workingDays !== null
                                    ? ` / ${request.workingDays} working`
                                    : ""}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs text-muted-foreground">Start Date</Label>
                            <p className="text-foreground mt-1">{request.startDate}</p>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">End Date</Label>
                            <p className="text-foreground mt-1">{request.endDate}</p>
                        </div>
                    </div>

                    {"submittedDate" in request && request.submittedDate && (
                        <div>
                            <Label className="text-xs text-muted-foreground">Submitted On</Label>
                            <p className="text-foreground mt-1">{request.submittedDate}</p>
                        </div>
                    )}

                    {"coverName" in request && request.coverName && (
                        <div>
                            <Label className="text-xs text-muted-foreground">Cover Person</Label>
                            <p className="text-foreground mt-1">{request.coverName}</p>
                        </div>
                    )}

                    <div>
                        <Label className="text-xs text-muted-foreground">Reason</Label>
                        <p className="text-sm text-foreground mt-2 p-3 bg-muted rounded-lg">
                            {request.reason}
                        </p>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <div className="mt-2">
                            <StatusBadge status={request.status} />
                        </div>
                    </div>

                    {request.approverName && (
                        <div className="p-3 bg-muted rounded-lg">
                            <Label className="text-xs text-muted-foreground">Reviewed by</Label>
                            <p className="text-sm text-foreground mt-1">{request.approverName}</p>
                        </div>
                    )}

                    {request.hrComment && (
                        <div className={`p-3 rounded-lg border ${
                            request.status.toLowerCase() === "approved"
                                ? "bg-brand-subtle dark:bg-muted border-brand"
                                : "bg-destructive/10 border-destructive"
                        }`}>
                            <Label className="text-xs text-muted-foreground">HR Comment</Label>
                            <p className="text-sm text-foreground mt-1">{request.hrComment}</p>
                        </div>
                    )}

                    {isAdminView && isPending && (
                        <div className="space-y-3 pt-2 border-t">
                            <Label>HR Comment (optional)</Label>
                            <Textarea
                                placeholder="Leave a comment for the staff member…"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-brand hover:bg-brand/90 text-white"
                                    onClick={() => { onApprove(request.id, comment); onClose(); }}
                                >
                                    <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="destructive"
                                    onClick={() => { onReject(request.id, comment); onClose(); }}
                                >
                                    <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LeaveManagementPage({
    userRole,
    canManageLeave,
    leaveTypes,
    balances,
    requests,
    leaveHistory,
    publicHolidays,
    allLeaveTypes,
    allPublicHolidays,
    teamLeave,
}: LeaveManagementPageProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const isAdmin = ["superadmin", "hr", "management"].includes(userRole);

    // Calendar nav
    const now = new Date();
    const [calYear,  setCalYear]  = useState(now.getFullYear());
    const [calMonth, setCalMonth] = useState(now.getMonth());

    // Request form state
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate,   setEndDate]   = useState<Date | undefined>();

    // Estimated working days (client-side preview — server calculates authoritatively)
    const estimatedWorkingDays = useMemo(() => {
        if (startDate && endDate && startDate <= endDate) {
            return approxWorkingDays(startDate, endDate);
        }
        return null;
    }, [startDate, endDate]);

    // Details modal
    const [selectedRequest, setSelectedRequest]   = useState<LeaveRequest | LeaveHistoryItem | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<LeaveFormData>({
            leave_type_id: leaveTypes[0] ? String(leaveTypes[0].id) : "",
            startDate:     "",
            endDate:       "",
            reason:        "",
            cover_user_id: "",
        });

    // Flash toasts
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error)   toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    // Keep details modal in sync with updated request list
    useEffect(() => {
        if (selectedRequest && "submittedDate" in selectedRequest) {
            const updated = requests.find((r) => r.id === selectedRequest.id) ?? null;
            setSelectedRequest(updated);
            if (!updated) setShowDetailsModal(false);
        }
    }, [requests, selectedRequest]);

    function resetForm() {
        reset();
        clearErrors();
        setStartDate(undefined);
        setEndDate(undefined);
    }

    function handleSubmitRequest() {
        post("/leave", {
            preserveScroll: true,
            onSuccess: resetForm,
        });
    }

    function updateReviewStatus(status: "approved" | "rejected", id: string, comment: string) {
        router.patch(
            `/leave/${id}/status`,
            { status, hrComment: comment.trim() },
            { preserveScroll: true }
        );
    }

    function openDetails(req: LeaveRequest | LeaveHistoryItem) {
        setSelectedRequest(req);
        setShowDetailsModal(true);
    }

    const selectedLeaveType = leaveTypes.find((lt) => String(lt.id) === data.leave_type_id);
    const selectedBalance   = balances.find((b)  => String(b.leave_type_id) === data.leave_type_id);

    const pendingCount = requests.filter((r) => r.status === "pending").length;

    // Month nav helpers
    function prevMonth() {
        if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
        else setCalMonth((m) => m - 1);
    }
    function nextMonth() {
        if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
        else setCalMonth((m) => m + 1);
    }

    return (
        <div className="space-y-8">
            {/* Page header */}
            <div>
                <h1 className="text-foreground mb-1">Leave Management</h1>
                <p className="text-muted-foreground">
                    {isAdmin ? "Manage team leave requests and configure leave policies" : "Request and track your leave"}
                </p>
            </div>

            {/* Balance cards */}
            <BalanceCards balances={balances} />

            {/* Request form */}
            <Card className="bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground">Request New Leave</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Submit a leave request for approval
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Leave type */}
                        <div className="space-y-1">
                            <Label>Leave Type *</Label>
                            <Select
                                value={data.leave_type_id}
                                onValueChange={(v) => setData("leave_type_id", v)}
                            >
                                <SelectTrigger className="bg-card">
                                    <SelectValue placeholder="Select type…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes.map((lt) => (
                                        <SelectItem key={lt.id} value={String(lt.id)}>
                                            {lt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.leave_type_id && <p className="text-xs text-destructive">{errors.leave_type_id}</p>}

                            {/* Inline balance hint */}
                            {selectedBalance && (
                                <p className="text-xs text-muted-foreground">
                                    Balance: <span className="font-medium text-foreground">{selectedBalance.remaining}</span> days remaining
                                    {selectedLeaveType?.requires_documentation && (
                                        <span className="ml-1 text-brand-yellow flex items-center gap-1 inline-flex">
                                            <AlertCircle className="w-3 h-3" /> Documentation required
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Start date */}
                        <div className="space-y-1">
                            <Label>Start Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left bg-card">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "dd MMM yyyy") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(v) => {
                                            setStartDate(v);
                                            setData("startDate", v ? format(v, "yyyy-MM-dd") : "");
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                        </div>

                        {/* End date */}
                        <div className="space-y-1">
                            <Label>End Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left bg-card">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "dd MMM yyyy") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(v) => {
                                            setEndDate(v);
                                            setData("endDate", v ? format(v, "yyyy-MM-dd") : "");
                                        }}
                                        disabled={startDate ? { before: startDate } : undefined}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}

                            {/* Working-day preview */}
                            {estimatedWorkingDays !== null && (
                                <p className="text-xs text-muted-foreground">
                                    ~{estimatedWorkingDays} working {estimatedWorkingDays === 1 ? "day" : "days"}
                                    <span className="text-muted-foreground/60 ml-1">(excl. weekends)</span>
                                </p>
                            )}
                        </div>

                        {/* Cover person (optional) */}
                        <div className="space-y-1">
                            <Label>Cover Person <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Input
                                placeholder="Employee name…"
                                value={data.cover_user_id}
                                onChange={(e) => setData("cover_user_id", e.target.value)}
                                className="bg-card"
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1">
                        <Label>Reason / Note *</Label>
                        <Textarea
                            placeholder="Provide details about your leave request…"
                            value={data.reason}
                            onChange={(e) => setData("reason", e.target.value)}
                            className="bg-card min-h-[90px]"
                        />
                        {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
                    </div>

                    <Button
                        onClick={handleSubmitRequest}
                        disabled={processing}
                        className="bg-brand hover:bg-brand/90 text-white"
                    >
                        {processing ? "Submitting…" : "Submit Leave Request"}
                    </Button>
                </CardContent>
            </Card>

            {/* Requests & management section */}
            {isAdmin ? (
                <Card className="bg-card shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-foreground">Leave Management</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Review requests, manage leave types, holidays, and team calendar
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="bg-brand-yellow text-foreground">
                                {pendingCount} Pending
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="requests">
                            <TabsList className="mb-6 flex-wrap h-auto gap-1">
                                <TabsTrigger value="requests">
                                    Pending Requests {pendingCount > 0 && `(${pendingCount})`}
                                </TabsTrigger>
                                <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
                                {canManageLeave && (
                                    <>
                                        <TabsTrigger value="types">Leave Types</TabsTrigger>
                                        <TabsTrigger value="holidays">Public Holidays</TabsTrigger>
                                    </>
                                )}
                            </TabsList>

                            {/* Pending requests */}
                            <TabsContent value="requests">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Staff</TableHead>
                                                <TableHead>Leave Type</TableHead>
                                                <TableHead>Start</TableHead>
                                                <TableHead>End</TableHead>
                                                <TableHead>Days</TableHead>
                                                <TableHead>Working Days</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requests.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                        No leave requests found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {requests.map((req) => (
                                                <TableRow
                                                    key={req.id}
                                                    className="cursor-pointer hover:bg-muted"
                                                    onClick={() => openDetails(req)}
                                                >
                                                    <TableCell>
                                                        <div>
                                                            <p className="text-sm text-foreground">{req.staffName}</p>
                                                            <p className="text-xs text-muted-foreground">{req.staffId}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-foreground">{req.leaveType ?? req.type}</TableCell>
                                                    <TableCell className="text-muted-foreground">{req.startDate}</TableCell>
                                                    <TableCell className="text-muted-foreground">{req.endDate}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{req.days}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {req.workingDays !== null
                                                            ? <Badge variant="secondary">{req.workingDays}</Badge>
                                                            : <span className="text-muted-foreground text-xs">—</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={req.status} />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => openDetails(req)}>
                                                                <Eye className="w-3 h-3 mr-1" /> View
                                                            </Button>
                                                            {req.status === "pending" && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-brand hover:bg-brand/90 text-white"
                                                                        onClick={() => updateReviewStatus("approved", req.id, "")}
                                                                    >
                                                                        <Check className="w-3 h-3" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => updateReviewStatus("rejected", req.id, "")}
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            {/* Team calendar */}
                            <TabsContent value="calendar">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-foreground">
                                            {format(new Date(calYear, calMonth, 1), "MMMM yyyy")}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={prevMonth}>←</Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()); }}
                                            >
                                                Today
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={nextMonth}>→</Button>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-3">
                                        {(allLeaveTypes ?? leaveTypes).filter((lt) => lt.is_active).map((lt) => (
                                            <div key={lt.id} className="flex items-center gap-1.5 text-xs">
                                                <div className={`w-3 h-3 rounded-sm ${typeColour(lt.code)}`} />
                                                <span className="text-muted-foreground">{lt.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <TeamCalendar
                                        teamLeave={teamLeave ?? []}
                                        year={calYear}
                                        month={calMonth}
                                    />
                                </div>
                            </TabsContent>

                            {/* Leave types management */}
                            {canManageLeave && (
                                <TabsContent value="types">
                                    <LeaveTypesTab
                                        allLeaveTypes={allLeaveTypes ?? []}
                                        canManage={canManageLeave}
                                    />
                                </TabsContent>
                            )}

                            {/* Public holidays management */}
                            {canManageLeave && (
                                <TabsContent value="holidays">
                                    <PublicHolidaysTab
                                        allPublicHolidays={allPublicHolidays ?? []}
                                        canManage={canManageLeave}
                                    />
                                </TabsContent>
                            )}
                        </Tabs>
                    </CardContent>
                </Card>
            ) : (
                /* Non-admin: simple pending requests */
                <Card className="bg-card shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-foreground">My Leave Requests</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Track your submitted requests
                                </CardDescription>
                            </div>
                            {pendingCount > 0 && (
                                <Badge variant="secondary" className="bg-brand-yellow text-foreground">
                                    {pendingCount} Pending
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Leave Type</TableHead>
                                        <TableHead>Start</TableHead>
                                        <TableHead>End</TableHead>
                                        <TableHead>Days</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                No leave requests found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {requests.map((req) => (
                                        <TableRow
                                            key={req.id}
                                            className="cursor-pointer hover:bg-muted"
                                            onClick={() => openDetails(req)}
                                        >
                                            <TableCell className="text-foreground">{req.leaveType ?? req.type}</TableCell>
                                            <TableCell className="text-muted-foreground">{req.startDate}</TableCell>
                                            <TableCell className="text-muted-foreground">{req.endDate}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {req.workingDays ?? req.days}{" "}
                                                    {(req.workingDays ?? req.days) === 1 ? "day" : "days"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell><StatusBadge status={req.status} /></TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Button variant="outline" size="sm" onClick={() => openDetails(req)}>
                                                    <Eye className="w-3 h-3 mr-1" /> View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Leave history */}
            <Card className="bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground">My Leave History</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Approved and rejected leave records
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Working Days</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaveHistory.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            No leave history found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {leaveHistory.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="cursor-pointer hover:bg-muted"
                                        onClick={() => openDetails(item)}
                                    >
                                        <TableCell className="text-foreground">{item.period}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.type}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {item.startDate} – {item.endDate}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {item.workingDays ?? item.days}{" "}
                                                {(item.workingDays ?? item.days) === 1 ? "day" : "days"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell><StatusBadge status={item.status} /></TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Button variant="outline" size="sm" onClick={() => openDetails(item)}>
                                                <Eye className="w-3 h-3 mr-1" /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Details dialog */}
            <RequestDetailsDialog
                request={selectedRequest}
                open={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                isAdmin={isAdmin}
                onApprove={(id, comment) => updateReviewStatus("approved", id, comment)}
                onReject={(id, comment)  => updateReviewStatus("rejected",  id, comment)}
            />
        </div>
    );
}

LeaveManagementPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
