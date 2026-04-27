import { router } from "@inertiajs/react";
import { ClipboardList } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import MainLayout from "@/layouts/MainLayout";
import type { AuditLogEntry } from "@/types/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedLogs {
    data: AuditLogEntry[];
    current_page: number;
    last_page: number;
    links: PaginationLink[];
}

interface AuditLogsPageProps {
    logs: PaginatedLogs;
    modules: string[];
    actions: string[];
    filters: {
        module: string;
        action: string;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

const ALL_VALUE = "__all__";

// ─── Page component ───────────────────────────────────────────────────────────

export default function AuditLogsPage({ logs, modules, actions, filters }: AuditLogsPageProps) {
    const [moduleFilter, setModuleFilter] = useState(filters.module || ALL_VALUE);
    const [actionFilter, setActionFilter] = useState(filters.action || ALL_VALUE);

    function applyFilters(newModule: string, newAction: string) {
        router.get(
            "/admin/audit-logs",
            {
                module: newModule === ALL_VALUE ? "" : newModule,
                action: newAction === ALL_VALUE ? "" : newAction,
            },
            { preserveState: true, replace: true },
        );
    }

    function handleModuleChange(value: string) {
        setModuleFilter(value);
        applyFilters(value, actionFilter);
    }

    function handleActionChange(value: string) {
        setActionFilter(value);
        applyFilters(moduleFilter, value);
    }

    function clearFilters() {
        setModuleFilter(ALL_VALUE);
        setActionFilter(ALL_VALUE);
        router.get("/admin/audit-logs", {}, { preserveState: true, replace: true });
    }

    const hasActiveFilters =
        moduleFilter !== ALL_VALUE || actionFilter !== ALL_VALUE;

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Audit Logs</h1>
                        <p className="text-sm text-muted-foreground">
                            Unified cross-module audit trail — read-only
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Filter events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-3">
                            {/* Module filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Module
                                </label>
                                <Select value={moduleFilter} onValueChange={handleModuleChange}>
                                    <SelectTrigger className="w-44">
                                        <SelectValue placeholder="All modules" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_VALUE}>All modules</SelectItem>
                                        {modules.map((m) => (
                                            <SelectItem key={m} value={m}>
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Action
                                </label>
                                <Select value={actionFilter} onValueChange={handleActionChange}>
                                    <SelectTrigger className="w-56">
                                        <SelectValue placeholder="All actions" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_VALUE}>All actions</SelectItem>
                                        {actions.map((a) => (
                                            <SelectItem key={a} value={a}>
                                                {a}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="self-end"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-40">Timestamp</TableHead>
                                        <TableHead className="w-40">Actor</TableHead>
                                        <TableHead className="w-28">Module</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead className="w-48">Subject</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="py-12 text-center text-sm text-muted-foreground"
                                            >
                                                No audit events found
                                                {hasActiveFilters
                                                    ? " matching the current filters."
                                                    : "."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.data.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                    {formatDate(entry.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    {entry.actor ? (
                                                        <div>
                                                            <p className="text-sm font-medium leading-tight">
                                                                {entry.actor.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {entry.actor.employee_id}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">
                                                            System
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {entry.module}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm font-mono">
                                                    {entry.action}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {entry.subject_type ? (
                                                        <>
                                                            <span>{entry.subject_type}</span>
                                                            {entry.subject_id !== null && (
                                                                <span className="ml-1 font-mono text-foreground">
                                                                    #{entry.subject_id}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="italic">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {logs.last_page > 1 && (
                            <div className="flex items-center justify-center gap-1 border-t border-border px-4 py-3">
                                {logs.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.visit(link.url, { preserveState: true });
                                            }
                                        }}
                                        className="h-8 min-w-8 text-xs"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
