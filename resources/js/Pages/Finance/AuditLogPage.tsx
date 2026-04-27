import { router } from "@inertiajs/react";
import { Search, ChevronLeft, ChevronRight, Clock, User, FileText } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface AuditLogEntry {
  id: number;
  action: string;
  model_type: string;
  model_id: number;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  logged_at: string | null;
  user: { id: number; name: string; role: string } | null;
}

interface PaginatedLogs {
  data: AuditLogEntry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface Filters {
  action?: string;
  model_type?: string;
  user_id?: string;
  from?: string;
  to?: string;
  model_id?: string;
}

interface AuditLogPageProps {
  logs: PaginatedLogs;
  actions: string[];
  filters: Filters;
}

const ACTION_COLOURS: Record<string, string> = {
  created: "bg-green-100 text-green-800",
  updated: "bg-blue-100 text-blue-800",
  deleted: "bg-red-100 text-red-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  budget_override: "bg-amber-100 text-amber-800",
  budget_blocked: "bg-red-100 text-red-800",
  period_close_initiated: "bg-purple-100 text-purple-800",
  period_closed: "bg-purple-100 text-purple-800",
  period_reopened: "bg-sky-100 text-sky-800",
};

function DiffViewer({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  if (!before && !after) return <p className="text-sm text-muted-foreground">No data recorded.</p>;

  const keys = Array.from(
    new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="text-left px-3 py-1.5 font-medium border">Field</th>
            <th className="text-left px-3 py-1.5 font-medium border">Before</th>
            <th className="text-left px-3 py-1.5 font-medium border">After</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const bVal = before?.[key];
            const aVal = after?.[key];
            const changed = JSON.stringify(bVal) !== JSON.stringify(aVal);
            return (
              <tr key={key} className={changed ? "bg-yellow-50" : ""}>
                <td className="px-3 py-1 border font-mono">{key}</td>
                <td className="px-3 py-1 border text-red-700 font-mono">
                  {bVal !== undefined ? JSON.stringify(bVal) : "—"}
                </td>
                <td className="px-3 py-1 border text-green-700 font-mono">
                  {aVal !== undefined ? JSON.stringify(aVal) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditLogPage({ logs, actions, filters }: AuditLogPageProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  function applyFilters() {
    router.get("/finance/audit-log", localFilters as Record<string, string>, {
      preserveState: true,
      replace: true,
    });
  }

  function clearFilters() {
    setLocalFilters({});
    router.get("/finance/audit-log", {}, { replace: true });
  }

  function goToPage(page: number) {
    router.get(
      "/finance/audit-log",
      { ...(localFilters as Record<string, string>), page: String(page) },
      { preserveState: true, replace: true }
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Finance Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Append-only record of all financial system changes. Read-only.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-xs mb-1">Action</Label>
              <Select
                value={localFilters.action ?? ""}
                onValueChange={(v) =>
                  setLocalFilters((f) => ({ ...f, action: v || undefined }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {actions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs mb-1">Model</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Requisition"
                value={localFilters.model_type ?? ""}
                onChange={(e) =>
                  setLocalFilters((f) => ({
                    ...f,
                    model_type: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div>
              <Label className="text-xs mb-1">Model ID</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                placeholder="ID"
                value={localFilters.model_id ?? ""}
                onChange={(e) =>
                  setLocalFilters((f) => ({
                    ...f,
                    model_id: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div>
              <Label className="text-xs mb-1">User ID</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                placeholder="User ID"
                value={localFilters.user_id ?? ""}
                onChange={(e) =>
                  setLocalFilters((f) => ({
                    ...f,
                    user_id: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div>
              <Label className="text-xs mb-1">From</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={localFilters.from ?? ""}
                onChange={(e) =>
                  setLocalFilters((f) => ({
                    ...f,
                    from: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div>
              <Label className="text-xs mb-1">To</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={localFilters.to ?? ""}
                onChange={(e) =>
                  setLocalFilters((f) => ({
                    ...f,
                    to: e.target.value || undefined,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={applyFilters} className="h-8">
              <Search className="h-3.5 w-3.5 mr-1.5" />
              Search
            </Button>
            <Button size="sm" variant="outline" onClick={clearFilters} className="h-8">
              Clear
            </Button>
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground">
          {logs.total.toLocaleString()} entries
          {logs.from && logs.to && (
            <> — showing {logs.from}–{logs.to}</>
          )}
        </p>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Logged At</TableHead>
                <TableHead className="w-20 text-right">Diff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No audit entries found.
                  </TableCell>
                </TableRow>
              )}
              {logs.data.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/40">
                  <TableCell className="text-xs text-muted-foreground">#{log.id}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        ACTION_COLOURS[log.action] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-mono text-xs">{log.model_type}</span>
                    <span className="text-muted-foreground ml-1">#{log.model_id}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.user ? (
                      <span>
                        {log.user.name}
                        <Badge variant="outline" className="ml-1.5 text-xs py-0">
                          {log.user.role}
                        </Badge>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {log.logged_at
                      ? new Date(log.logged_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {(log.before_json || log.after_json) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => setSelected(log)}
                      >
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {logs.last_page > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={logs.current_page === 1}
              onClick={() => goToPage(logs.current_page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {logs.current_page} of {logs.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={logs.current_page === logs.last_page}
              onClick={() => goToPage(logs.current_page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Diff modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              Diff — {selected?.action} on {selected?.model_type} #{selected?.model_id}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <DiffViewer before={selected.before_json} after={selected.after_json} />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
