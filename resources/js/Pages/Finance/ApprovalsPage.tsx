import { router, Link } from "@inertiajs/react";
import {
  CheckSquare, Clock, AlertTriangle, Search, Filter,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import MainLayout from "@/layouts/MainLayout";

interface QueueItem {
  step_id: number;
  requisition_id: number;
  request_id: string;
  type: string;
  amount_fmt: string;
  urgency: string;
  description: string;
  requester_name: string | null;
  department: string | null;
  cost_centre: string | null;
  vendor: string | null;
  role_label: string;
  sla_deadline: string | null;
  is_overdue: boolean;
  submitted_at: string | null;
}

interface ApprovalsPageProps {
  steps: QueueItem[];
  overdueCount: number;
  filters: { urgency?: string; type?: string; min_amount?: string; max_amount?: string };
}

const TYPE_BADGES: Record<string, string> = {
  OPEX:  "bg-blue-100 text-blue-700",
  CAPEX: "bg-amber-100 text-amber-700",
  PETTY: "bg-green-100 text-green-700",
  EMERG: "bg-red-100 text-red-700",
};

function slaLabel(iso: string | null, isOverdue: boolean): React.ReactNode {
  if (!iso) return null;
  const d = new Date(iso);
  const hoursLeft = (d.getTime() - Date.now()) / 36e5;
  if (isOverdue) return <span className="text-red-600 text-xs flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Overdue</span>;
  if (hoursLeft <= 24) return <span className="text-amber-600 text-xs">{Math.round(hoursLeft)}h left</span>;
  return <span className="text-muted-foreground text-xs">{d.toLocaleDateString()}</span>;
}

export default function ApprovalsPage({ steps, overdueCount, filters }: ApprovalsPageProps) {
  const [urgency, setUrgency]     = useState(filters.urgency ?? "all");
  const [type, setType]           = useState(filters.type ?? "all");
  const [minAmount, setMinAmount] = useState(filters.min_amount ?? "");
  const [maxAmount, setMaxAmount] = useState(filters.max_amount ?? "");

  function applyFilters(u: string, t: string, min: string, max: string) {
    router.visit("/finance/approvals", {
      data: {
        urgency:    u !== "all" ? u : undefined,
        type:       t !== "all" ? t : undefined,
        min_amount: min || undefined,
        max_amount: max || undefined,
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
            <CheckSquare className="w-6 h-6 text-emerald-500" />
            Approvals Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {steps.length} pending approval{steps.length !== 1 ? "s" : ""}
            {overdueCount > 0 && (
              <span className="ml-2 text-red-600 font-semibold">· {overdueCount} overdue</span>
            )}
          </p>
        </div>
        {overdueCount > 0 && (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-sm px-3 py-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {overdueCount} SLA Exceeded
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={urgency} onValueChange={(v) => { setUrgency(v); applyFilters(v, type, minAmount, maxAmount); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => { setType(v); applyFilters(urgency, v, minAmount, maxAmount); }}>
          <SelectTrigger className="w-40">
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
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Input
            className="w-32"
            placeholder="Min ₦"
            type="number"
            value={minAmount}
            onChange={(e) => { setMinAmount(e.target.value); applyFilters(urgency, type, e.target.value, maxAmount); }}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            className="w-32"
            placeholder="Max ₦"
            type="number"
            value={maxAmount}
            onChange={(e) => { setMaxAmount(e.target.value); applyFilters(urgency, type, minAmount, e.target.value); }}
          />
        </div>
      </div>

      {/* Table */}
        <div className="overflow-x-auto">

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Cost Centre</TableHead>
              <TableHead>My Role</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {steps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Your queue is empty. All caught up!
                </TableCell>
              </TableRow>
            ) : (
              steps.map((item) => (
                <TableRow
                  key={item.step_id}
                  className={item.is_overdue ? "bg-red-50/50 dark:bg-red-950/10" : ""}
                >
                  <TableCell>
                    <p className="font-mono font-semibold text-sm">{item.request_id}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_BADGES[item.type] ?? ""}`}>
                        {item.type}
                      </span>
                      {item.urgency !== "standard" && (
                        <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> {item.urgency}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{item.requester_name ?? "—"}</p>
                    <p className="text-muted-foreground text-xs">{item.department ?? ""}</p>
                  </TableCell>
                  <TableCell className="font-semibold">{item.amount_fmt}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.cost_centre ?? "—"}</TableCell>
                  <TableCell>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{item.role_label}</span>
                  </TableCell>
                  <TableCell>{slaLabel(item.sla_deadline, item.is_overdue)}</TableCell>
                  <TableCell>
                    <Link href={`/finance/approvals/${item.requisition_id}`}>
                      <Button size="sm" variant={item.is_overdue ? "destructive" : "default"}>
                        Review
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

ApprovalsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
