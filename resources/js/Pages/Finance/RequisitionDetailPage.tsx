import { router, useForm } from "@inertiajs/react";
import {
  FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Download, User,
  Building2, Hash, Package, Calendar,
} from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Requisition {
  id: number;
  request_id: string;
  type: string;
  amount_fmt: string;
  tax_vat_fmt: string;
  tax_wht_fmt: string;
  total_fmt: string;
  currency: string;
  urgency: string;
  description: string;
  status: string;
  needs_board: boolean;
  requester: { id: number; name: string; department: string } | null;
  cost_centre: { code: string; name: string } | null;
  account_code: { code: string; description: string } | null;
  vendor: { name: string; bank_name: string | null } | null;
  supporting_docs: string[];
  submitted_at: string | null;
  approved_at: string | null;
  period: string | null;
  created_at: string;
}

interface ApprovalStep {
  id: number;
  level: number;
  role_label: string;
  approver: { id: number; name: string; role: string };
  status: string;
  comment: string | null;
  acted_at: string | null;
  sla_deadline: string | null;
  is_overdue: boolean;
}

interface RequisitionDetailPageProps {
  requisition: Requisition;
  steps: ApprovalStep[];
  canApprove: boolean;
}

const STEP_STATUS_STYLES: Record<string, { class: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:   { class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",   icon: Clock },
  approved:  { class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  rejected:  { class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",           icon: XCircle },
  escalated: { class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", icon: AlertTriangle },
  skipped:   { class: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",           icon: FileText },
};

const REQ_STATUS_STYLES: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  approving: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  approved:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function RequisitionDetailPage({ requisition: req, steps, canApprove }: RequisitionDetailPageProps) {
  const statusStyle = REQ_STATUS_STYLES[req.status] ?? REQ_STATUS_STYLES.draft;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold font-mono">{req.request_id}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>
              {req.status.toUpperCase()}
            </span>
            {req.urgency !== "standard" && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${
                req.urgency === "emergency" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
              }`}>
                <AlertTriangle className="w-3 h-3" />
                {req.urgency.toUpperCase()}
              </span>
            )}
            {req.needs_board && (
              <Badge className="bg-purple-100 text-purple-700 text-xs">Board Approval Required</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Submitted {formatDate(req.submitted_at)}</p>
        </div>

        {/* Cancel button */}
        {["draft", "submitted"].includes(req.status) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">Cancel Request</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. The request will be marked as cancelled.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => router.post(`/finance/requisitions/${req.id}/cancel`)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Cancel Request
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canApprove && (
          <Button onClick={() => router.visit(`/finance/approvals/${req.id}`)}>
            Review & Decide
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Details */}
        <div className="space-y-4">
          {/* Amount card */}
          <div className="border rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Financial Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{req.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Amount</span>
                <span className="font-semibold">{req.amount_fmt}</span>
              </div>
              <div className="flex justify-between text-amber-700 dark:text-amber-300">
                <span>+ VAT</span>
                <span>{req.tax_vat_fmt}</span>
              </div>
              <div className="flex justify-between text-blue-700 dark:text-blue-300">
                <span>− WHT</span>
                <span>{req.tax_wht_fmt}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total Payable</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">{req.total_fmt}</span>
              </div>
              {req.currency !== "NGN" && (
                <p className="text-xs text-muted-foreground">Currency: {req.currency}</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="border rounded-xl p-5 space-y-3 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Request Details</h3>
            {[
              { label: "Requester", icon: User, value: `${req.requester?.name} · ${req.requester?.department}` },
              { label: "Cost Centre", icon: Building2, value: req.cost_centre ? `${req.cost_centre.code} — ${req.cost_centre.name}` : "—" },
              { label: "Account Code", icon: Hash, value: req.account_code ? `${req.account_code.code} — ${req.account_code.description}` : "—" },
              { label: "Vendor", icon: Package, value: req.vendor?.name ?? "—" },
              { label: "Period", icon: Calendar, value: req.period ?? "—" },
            ].map(({ label, icon: Icon, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="border rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Description</h3>
            <p className="text-sm whitespace-pre-wrap">{req.description}</p>
          </div>

          {/* Documents */}
          {req.supporting_docs.length > 0 && (
            <div className="border rounded-xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Supporting Documents</h3>
              <ul className="space-y-2">
                {req.supporting_docs.map((path, idx) => (
                  <li key={idx}>
                    <a
                      href={`/storage/${path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {path.split("/").pop()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Approval timeline */}
        <div>
          <div className="border rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">Approval Chain</h3>
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approval steps yet.</p>
            ) : (
              <ol className="relative border-l border-border ml-3 space-y-6">
                {steps.map((step) => {
                  const style = STEP_STATUS_STYLES[step.status] ?? STEP_STATUS_STYLES.pending;
                  const Icon  = style.icon;
                  return (
                    <li key={step.id} className="ml-6">
                      <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ${style.class}`}>
                        <Icon className="w-3 h-3" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-muted-foreground">Level {step.level}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{step.role_label}</span>
                          {step.is_overdue && (
                            <span className="text-xs text-red-600 flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium">{step.approver.name}</p>
                        <p className="text-xs text-muted-foreground">{step.approver.role}</p>
                        {step.acted_at && (
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(step.acted_at)}</p>
                        )}
                        {step.comment && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground border-l-2 border-muted-foreground/30">
                            "{step.comment}"
                          </div>
                        )}
                        {step.status === "pending" && step.sla_deadline && (
                          <p className="text-xs text-muted-foreground mt-1">
                            SLA: {formatDate(step.sla_deadline)}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

RequisitionDetailPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
