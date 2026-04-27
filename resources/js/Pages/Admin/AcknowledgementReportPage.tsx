import { router } from "@inertiajs/react";
import {
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MainLayout from "@/layouts/MainLayout";

interface PendingUser {
  id: number;
  name: string;
  department: string;
  employee_id: string;
  employee_stage: string;
}

interface PolicyReport {
  id: number;
  title: string;
  slug: string;
  acknowledgement_deadline: string | null;
  total: number;
  acknowledged: number;
  pending_count: number;
  percentage: number;
  pending_users: PendingUser[];
}

interface AcknowledgementReportPageProps {
  report: PolicyReport[];
  summary: {
    total_policies: number;
    overall_percentage: number;
  };
}

const STAGE_STYLES: Record<string, string> = {
  joiner: "border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  performer: "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  leader: "border-purple-300 text-purple-600 bg-purple-50 dark:bg-purple-950/30",
};

function PolicySection({ policy }: { policy: PolicyReport }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const isOverdue =
    policy.acknowledgement_deadline != null &&
    policy.acknowledgement_deadline < today;

  return (
    <div className="border-2 border-border rounded-xl overflow-hidden overflow-x-auto">
      {/* Header row — always visible */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/40 transition-colors cursor-pointer"
      >
        <div className="shrink-0">
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Title + deadline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-foreground truncate">{policy.title}</p>
            {policy.acknowledgement_deadline && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                }`}
              >
                <Calendar className="w-3 h-3" />
                {isOverdue ? "Overdue: " : "Due: "}
                {policy.acknowledgement_deadline}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress value={policy.percentage} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground shrink-0">
              {policy.acknowledged}/{policy.total} ({policy.percentage}%)
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          {policy.pending_count === 0 ? (
            <Badge className="bg-green-100 text-green-700 border-0 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30 text-xs"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              {policy.pending_count} pending
            </Badge>
          )}
        </div>

        {/* View policy link */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            router.visit(`/content/${policy.slug}`);
          }}
          title="View policy"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Collapsible: pending users table */}
      {open && (
        <div className="border-t border-border">
          {policy.pending_users.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              All eligible users have acknowledged this policy.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-foreground text-xs">Name</TableHead>
                  <TableHead className="text-foreground text-xs">Employee ID</TableHead>
                  <TableHead className="text-foreground text-xs">Department</TableHead>
                  <TableHead className="text-foreground text-xs">Stage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policy.pending_users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm text-foreground">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {u.employee_id}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.department}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${STAGE_STYLES[u.employee_stage] ?? ""}`}
                      >
                        {u.employee_stage}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

export default function AcknowledgementReportPage({
  report,
  summary,
}: AcknowledgementReportPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-brand" />
          Acknowledgement Report
        </h1>
        <p className="text-muted-foreground">
          Track which employees have acknowledged required policies.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-2 border-border">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Policies Requiring Acknowledgement</p>
            <p className="text-3xl font-bold text-foreground">{summary.total_policies}</p>
          </CardContent>
        </Card>
        <Card
          className={`border-2 ${
            summary.overall_percentage === 100
              ? "border-green-300"
              : summary.overall_percentage >= 50
                ? "border-brand"
                : "border-amber-300"
          }`}
        >
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Overall Completion</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-foreground">{summary.overall_percentage}%</p>
            </div>
            <Progress value={summary.overall_percentage} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Per-policy sections */}
      {report.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          No policies require acknowledgement yet.
        </div>
      ) : (
        <div className="space-y-3">
          {report.map((policy) => (
            <PolicySection key={policy.id} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
}

AcknowledgementReportPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
