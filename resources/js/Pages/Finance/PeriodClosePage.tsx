import { useForm } from "@inertiajs/react";
import {
  CheckCircle2, Clock, AlertTriangle, Lock, Unlock, FileText,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";


interface Period {
  id: number;
  label: string;
  year: number;
  month: number;
  status: string;
  close_initiated_by: string | null;
  close_initiated_at: string | null;
  co_authorized_by: string | null;
  closed_by: string | null;
  closed_at: string | null;
  close_report_path: string | null;
}

interface ChecklistItem {
  type: string;
  id: number | null;
  label: string;
  status: "resolved" | "waived" | "pending";
  waiver_reason?: string | null;
}

interface ClosingPeriod {
  id: number;
  label: string;
  checklist_clear: boolean;
  has_co_auth: boolean;
  initiated_by: string | null;
}

interface Props {
  periods: Period[];
  closing: ClosingPeriod | null;
  checklist: ChecklistItem[];
  user_role: string;
  flash?: { success?: string; error?: string };
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open:    { label: "Open",    variant: "default" },
  closing: { label: "Closing", variant: "outline" },
  closed:  { label: "Closed",  variant: "secondary" },
};

type WaiveTarget = { periodId: number; itemType: string; itemId: number | null };

export default function PeriodClosePage({ periods, closing, checklist, user_role, flash }: Props) {
  const isCeoOrAdmin = ["ceo", "superadmin"].includes(user_role);
  const isFinance    = ["finance", "ceo", "superadmin"].includes(user_role);
  const [expandedPeriod, setExpandedPeriod] = useState<number | null>(null);
  const [waiveTarget, setWaiveTarget] = useState<WaiveTarget | null>(null);

  const initiateForm  = useForm({ period_id: "" });
  const waiveForm     = useForm({ period_id: "", item_type: "", item_id: "", reason: "" });
  const coAuthForm    = useForm({ period_id: "" });
  const closeForm     = useForm({ period_id: "" });
  const reopenForm    = useForm({ period_id: "" });

  // Find first open period
  const openPeriods = periods.filter((p) => p.status === "open");

  function submitInitiate(periodId: number) {
    initiateForm.setData("period_id", String(periodId));
    initiateForm.post("/finance/period-close/initiate");
  }

  function submitCoAuth(periodId: number) {
    coAuthForm.setData("period_id", String(periodId));
    coAuthForm.post("/finance/period-close/co-authorize");
  }

  function submitClose(periodId: number) {
    closeForm.setData("period_id", String(periodId));
    closeForm.post("/finance/period-close/close");
  }

  function submitReopen(periodId: number) {
    reopenForm.setData("period_id", String(periodId));
    reopenForm.post("/finance/period-close/reopen");
  }

  function openWaiveDialog(target: WaiveTarget) {
    waiveForm.setData({
      period_id: String(target.periodId),
      item_type: target.itemType,
      item_id: target.itemId ? String(target.itemId) : "",
      reason: "",
    });
    setWaiveTarget(target);
  }

  function submitWaive(e: React.FormEvent) {
    e.preventDefault();
    waiveForm.post("/finance/period-close/waive", {
      onSuccess: () => setWaiveTarget(null),
    });
  }

  return (
    <MainLayout activePage="finance-period-close" title="Period Close">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Period Close</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage financial period closures. Closing requires dual authorisation (Finance + CEO/Superadmin).
            Reopening requires CEO + Superadmin together.
          </p>
        </div>

        {flash?.success && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
            {flash.error}
          </div>
        )}

        {/* Active closing period + checklist */}
        {closing && (
          <Card className="border-amber-300 dark:border-amber-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Close in Progress — {closing.label}
                </CardTitle>
                <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">Closing</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Initiated by {closing.initiated_by ?? "—"}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Checklist */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pre-Close Checklist</p>
                {checklist.length === 0 && (
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    All checklist items resolved — period is ready to close.
                  </div>
                )}
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
                    <div className="flex items-start gap-2">
                      {item.status === "pending" && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                      {item.status === "waived"  && <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                      {item.status === "resolved"&& <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />}
                      <div>
                        <p className="text-sm">{item.label}</p>
                        {item.waiver_reason && (
                          <p className="text-xs text-muted-foreground mt-0.5">Waiver: {item.waiver_reason}</p>
                        )}
                      </div>
                    </div>
                    {item.status === "pending" && isFinance && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs"
                        onClick={() => openWaiveDialog({ periodId: closing.id, itemType: item.type, itemId: item.id })}
                      >
                        Waive
                      </Button>
                    )}
                    {item.status !== "pending" && (
                      <Badge variant={item.status === "waived" ? "outline" : "default"} className="text-xs shrink-0">
                        {item.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Action row */}
              <div className="flex gap-3 flex-wrap">
                {isCeoOrAdmin && !closing.has_co_auth && closing.checklist_clear && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Co-Authorise Close
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Co-Authorise Period Close</AlertDialogTitle>
                        <AlertDialogDescription>
                          You are providing the second authorisation to close {closing.label}.
                          This action cannot be undone without a dual-role reopen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => submitCoAuth(closing.id)}>
                          Confirm Co-Authorise
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {isFinance && closing.has_co_auth && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm">
                        <Lock className="w-3.5 h-3.5 mr-1" /> Finalise Close
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Finalise Period Close</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will close {closing.label} permanently and generate the close report.
                          No new transactions can be recorded in this period after closure.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => submitClose(closing.id)}>
                          Close Period
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {!closing.checklist_clear && !closing.has_co_auth && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 self-center">
                    Resolve or waive all checklist items before co-authorisation.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Periods list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Periods</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {periods.map((p) => (
                <div key={p.id}>
                  <div
                    className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setExpandedPeriod(expandedPeriod === p.id ? null : p.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-28">{p.label}</span>
                      <Badge variant={STATUS_BADGE[p.status]?.variant ?? "secondary"} className="text-xs">
                        {STATUS_BADGE[p.status]?.label ?? p.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.status === "open" && isFinance && !closing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={(e) => { e.stopPropagation(); submitInitiate(p.id); }}
                        >
                          Initiate Close
                        </Button>
                      )}
                      {p.status === "closed" && p.close_report_path && (
                        <a
                          href={`/storage/${p.close_report_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3 h-3" /> Report
                        </a>
                      )}
                      {p.status === "closed" && isCeoOrAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 text-muted-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Unlock className="w-3 h-3 mr-1" /> Reopen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reopen Closed Period</AlertDialogTitle>
                              <AlertDialogDescription>
                                Reopening {p.label} requires both CEO and Superadmin authorisation.
                                Your confirmation is the first authorisation — a second person must also confirm within 30 minutes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => submitReopen(p.id)}>
                                Confirm Reopen Request
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {expandedPeriod === p.id
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </div>

                  {expandedPeriod === p.id && (
                    <div className="px-6 pb-4 bg-muted/30 border-t text-xs space-y-1 text-muted-foreground">
                      {p.close_initiated_by && <p>Close initiated by: {p.close_initiated_by} ({p.close_initiated_at})</p>}
                      {p.co_authorized_by   && <p>Co-authorised by: {p.co_authorized_by}</p>}
                      {p.closed_by          && <p>Closed by: {p.closed_by} ({p.closed_at})</p>}
                      {!p.close_initiated_by && <p className="italic">No close activity recorded.</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waive Dialog */}
      <Dialog open={!!waiveTarget} onOpenChange={(o) => !o && setWaiveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Waive Checklist Item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Provide a reason for waiving this item. Minimum 20 characters. The reason will be recorded
            in the close report and audit trail.
          </p>
          <form onSubmit={submitWaive} className="space-y-4">
            <div className="space-y-1">
              <Label>Reason *</Label>
              <Textarea
                rows={4}
                value={waiveForm.data.reason}
                onChange={(e) => waiveForm.setData("reason", e.target.value)}
                placeholder="Explain why this item is being waived..."
              />
              <p className="text-xs text-muted-foreground text-right">
                {waiveForm.data.reason.length} / 20 min
              </p>
              {waiveForm.errors.reason && (
                <p className="text-xs text-red-600">{waiveForm.errors.reason}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWaiveTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={waiveForm.processing}>
                {waiveForm.processing ? "Saving…" : "Record Waiver"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
