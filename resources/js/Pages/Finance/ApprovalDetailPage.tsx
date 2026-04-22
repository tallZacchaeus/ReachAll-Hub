import { useState } from "react";
import { useForm, router } from "@inertiajs/react";
import {
  CheckCircle2, XCircle, MessageSquare, AlertTriangle, User, Building2,
  Hash, Package, FileText, Download, Clock,
} from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

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
  requester: { id: number; name: string; department: string } | null;
  cost_centre: { code: string; name: string; budget_kobo: number; budget_fmt: string } | null;
  account_code: { code: string; description: string } | null;
  vendor: { name: string; bank_name: string | null; contact_email: string | null } | null;
  supporting_docs: string[];
  submitted_at: string | null;
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

interface MyStep {
  id: number;
  level: number;
  status: string;
}

interface ApprovalDetailPageProps {
  requisition: Requisition;
  steps: ApprovalStep[];
  myStep: MyStep | null;
  canDecide: boolean;
}

const STEP_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  approved:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-700",
  escalated: "bg-orange-100 text-orange-700",
};

interface DecideFormData {
  action: string;
  comment: string;
  [key: string]: string;
}

function DecisionDialog({
  stepId,
  action,
  open,
  onClose,
}: {
  stepId: number;
  action: "approve" | "reject" | "query";
  open: boolean;
  onClose: () => void;
}) {
  const { data, setData, post, processing, errors } = useForm<DecideFormData>({
    action,
    comment: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post(`/finance/approvals/steps/${stepId}/decide`, {
      onSuccess: () => onClose(),
    });
  }

  const labels = {
    approve: { title: "Approve Request", btn: "Approve", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    reject:  { title: "Reject Request",  btn: "Reject",  color: "bg-red-600 hover:bg-red-700 text-white" },
    query:   { title: "Query Requester", btn: "Send Query", color: "bg-amber-600 hover:bg-amber-700 text-white" },
  };
  const label = labels[action];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{label.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="comment">
              Comment {action !== "approve" ? "*" : "(optional)"}
            </Label>
            <Textarea
              id="comment"
              rows={4}
              placeholder={
                action === "approve"
                  ? "Add a note (optional)…"
                  : action === "reject"
                  ? "Reason for rejection (required)…"
                  : "Describe what clarification is needed…"
              }
              value={data.comment}
              onChange={(e) => setData("comment", e.target.value)}
            />
            {errors.comment && <p className="text-sm text-red-600 mt-1">{errors.comment}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={processing} className={label.color}>
              {processing ? "Saving…" : label.btn}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ApprovalDetailPage({
  requisition: req,
  steps,
  myStep,
  canDecide,
}: ApprovalDetailPageProps) {
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | "query" | null>(null);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold font-mono">{req.request_id}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700`}>
              {req.type}
            </span>
            {req.urgency !== "standard" && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${
                req.urgency === "emergency" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
              }`}>
                <AlertTriangle className="w-3 h-3" />
                {req.urgency.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Submitted {formatDate(req.submitted_at)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.visit("/finance/approvals")}>
          ← Back to Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Context */}
        <div className="space-y-4">
          {/* Amount */}
          <div className="border rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Financial Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Amount</span>
                <span className="font-semibold text-lg">{req.amount_fmt}</span>
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
            </div>
          </div>

          {/* Meta */}
          <div className="border rounded-xl p-5 space-y-3 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Request Context</h3>
            {[
              { label: "Requester", icon: User, value: `${req.requester?.name} · ${req.requester?.department}` },
              { label: "Cost Centre", icon: Building2, value: req.cost_centre ? `${req.cost_centre.code} — ${req.cost_centre.name}` : "—" },
              { label: "Account Code", icon: Hash, value: req.account_code ? `${req.account_code.code} — ${req.account_code.description}` : "—" },
              { label: "Vendor", icon: Package, value: req.vendor?.name ?? "—" },
            ].map(({ label, icon: Icon, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              </div>
            ))}
            {req.cost_centre && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-muted-foreground mb-1">Cost Centre Annual Budget</p>
                <p className="font-semibold">{req.cost_centre.budget_fmt}</p>
              </div>
            )}
          </div>

          {/* Vendor detail */}
          {req.vendor && (
            <div className="border rounded-xl p-5 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Vendor</h3>
              <p className="font-medium">{req.vendor.name}</p>
              {req.vendor.bank_name && <p className="text-muted-foreground">{req.vendor.bank_name}</p>}
              {req.vendor.contact_email && <p className="text-muted-foreground">{req.vendor.contact_email}</p>}
            </div>
          )}

          {/* Description */}
          <div className="border rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Business Justification</h3>
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

        {/* Right: Approval history + action */}
        <div className="space-y-4">
          {/* Approval history */}
          <div className="border rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">Approval History</h3>
            <ol className="relative border-l border-border ml-3 space-y-6">
              {steps.map((step) => {
                const isMyStep = myStep?.id === step.id;
                return (
                  <li key={step.id} className={`ml-6 ${isMyStep ? "opacity-100" : ""}`}>
                    <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      STEP_COLORS[step.status] ?? "bg-muted text-muted-foreground"
                    }`}>
                      {step.level}
                    </span>
                    <div className={`rounded-lg p-3 ${isMyStep ? "border-2 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20" : "bg-muted/30"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-medium">{step.approver.name}</p>
                          <p className="text-xs text-muted-foreground">{step.role_label}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STEP_COLORS[step.status] ?? "bg-muted"}`}>
                          {step.status}
                        </span>
                      </div>
                      {isMyStep && step.status === "pending" && (
                        <p className="text-xs text-emerald-600 font-medium">← Your decision required</p>
                      )}
                      {step.acted_at && (
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(step.acted_at)}</p>
                      )}
                      {step.comment && (
                        <div className="mt-2 p-2 bg-card rounded text-xs border-l-2 border-muted-foreground/30">
                          "{step.comment}"
                        </div>
                      )}
                      {step.is_overdue && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> SLA exceeded
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Decision buttons */}
          {canDecide && myStep && (
            <div className="border-2 border-emerald-300 rounded-xl p-5 bg-emerald-50/30 dark:bg-emerald-950/10">
              <h3 className="font-semibold text-sm mb-1">Your Decision (Level {myStep.level})</h3>
              <p className="text-xs text-muted-foreground mb-4">
                You are required to act on this request. Your decision will be logged and immutable.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setDialogAction("approve")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  onClick={() => setDialogAction("query")}
                  variant="outline"
                  className="flex-1 border-amber-400 text-amber-700 hover:bg-amber-50"
                >
                  <MessageSquare className="w-4 h-4 mr-1" /> Query
                </Button>
                <Button
                  onClick={() => setDialogAction("reject")}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision dialog */}
      {dialogAction && myStep && (
        <DecisionDialog
          stepId={myStep.id}
          action={dialogAction}
          open={dialogAction !== null}
          onClose={() => setDialogAction(null)}
        />
      )}
    </div>
  );
}

ApprovalDetailPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
