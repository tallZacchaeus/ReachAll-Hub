import { useState } from "react";
import { router, Link } from "@inertiajs/react";
import { Plus, Search, FileText, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Requisition {
  id: number;
  request_id: string;
  type: string;
  amount_fmt: string;
  total_fmt: string;
  cost_centre: string | null;
  vendor: string | null;
  status: string;
  urgency: string;
  submitted_at: string | null;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface RequisitionListPageProps {
  requisitions: { data: Requisition[]; meta: PaginationMeta };
  filters: { status?: string; type?: string; q?: string };
}

const STATUS_STYLES: Record<string, { label: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft:     { label: "Draft",     class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",     icon: FileText },
  submitted: { label: "Submitted", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",   icon: Clock },
  approving: { label: "Approving", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Loader2 },
  approved:  { label: "Approved",  class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  rejected:  { label: "Rejected",  class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",       icon: XCircle },
  cancelled: { label: "Cancelled", class: "bg-gray-100 text-gray-500",  icon: XCircle },
  matched:   { label: "Matched",   class: "bg-cyan-100 text-cyan-700",   icon: CheckCircle2 },
  paid:      { label: "Paid",      class: "bg-green-100 text-green-700", icon: CheckCircle2 },
  posted:    { label: "Posted",    class: "bg-purple-100 text-purple-700", icon: CheckCircle2 },
};

const TYPE_BADGES: Record<string, string> = {
  OPEX:  "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  CAPEX: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  PETTY: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  EMERG: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.class}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency === "standard") return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ml-1 ${
      urgency === "emergency" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
    }`}>
      <AlertTriangle className="w-2.5 h-2.5" />
      {urgency}
    </span>
  );
}

export default function RequisitionListPage({ requisitions, filters }: RequisitionListPageProps) {
  const [search, setSearch]   = useState(filters.q ?? "");
  const [status, setStatus]   = useState(filters.status ?? "all");
  const [type, setType]       = useState(filters.type ?? "all");

  function applyFilters(q: string, s: string, t: string) {
    router.visit("/finance/requisitions", {
      data: {
        q:      q || undefined,
        status: s !== "all" ? s : undefined,
        type:   t !== "all" ? t : undefined,
      },
      preserveState: true,
      replace: true,
    });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-500" />
            My Payment Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {requisitions.meta.total} request{requisitions.meta.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/finance/requisitions/create">
          <Button>
            <Plus className="w-4 h-4 mr-1" /> New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by ID or description…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); applyFilters(e.target.value, status, type); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); applyFilters(search, v, type); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_STYLES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => { setType(v); applyFilters(search, status, v); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="OPEX">OPEX</SelectItem>
            <SelectItem value="CAPEX">CAPEX</SelectItem>
            <SelectItem value="PETTY">Petty Cash</SelectItem>
            <SelectItem value="EMERG">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
        <div className="overflow-x-auto">

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Cost Centre</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requisitions.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No requests found. <Link href="/finance/requisitions/create" className="text-emerald-600 hover:underline">Create your first request →</Link>
                </TableCell>
              </TableRow>
            ) : (
              requisitions.data.map((req) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => router.visit(`/finance/requisitions/${req.id}`)}
                >
                  <TableCell className="font-mono text-sm font-semibold">
                    {req.request_id}
                    <UrgencyBadge urgency={req.urgency} />
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGES[req.type] ?? ""}`}>
                      {req.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">{req.amount_fmt}</p>
                    <p className="text-xs text-muted-foreground">Total: {req.total_fmt}</p>
                  </TableCell>
                  <TableCell className="text-sm">{req.cost_centre ?? "—"}</TableCell>
                  <TableCell className="text-sm">{req.vendor ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.submitted_at ?? req.created_at}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {requisitions.meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {requisitions.meta.links.map((link, idx) => (
            <Button
              key={idx}
              variant={link.active ? "default" : "outline"}
              size="sm"
              disabled={!link.url}
              onClick={() => link.url && router.visit(link.url)}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(link.label) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

RequisitionListPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
