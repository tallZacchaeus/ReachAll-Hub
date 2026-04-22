import { useState } from "react";
import { useForm, router } from "@inertiajs/react";
import {
  CheckCircle2, XCircle, Download, User, AlertTriangle, ExternalLink,
} from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Transaction {
  id: number;
  amount_kobo: number;
  amount_fmt: string;
  description: string;
  date: string;
  receipt_path: string;
  status: string;
  account_code: { code: string; description: string } | null;
}

interface Reconciliation {
  id: number;
  period_start: string;
  period_end: string;
  total_fmt: string;
  total_kobo: number;
  status: string;
  notes: string | null;
  reviewed_at: string | null;
  replenishment_req_id: number | null;
  custodian: { name: string; department: string };
  float: { limit_fmt: string; balance_fmt: string };
}

interface ReconciliationDetailPageProps {
  reconciliation: Reconciliation;
  transactions: Transaction[];
  canReview: boolean;
}

interface ReviewFormData {
  notes: string;
  [key: string]: string;
}

function ReviewDialog({
  recon,
  action,
  open,
  onClose,
}: {
  recon: Reconciliation;
  action: "approve" | "reject";
  open: boolean;
  onClose: () => void;
}) {
  const { data, setData, post, processing, errors } = useForm<ReviewFormData>({ notes: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post(`/finance/reconciliation/${recon.id}/${action}`, {
      onSuccess: () => onClose(),
    });
  }

  const isApprove = action === "approve";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isApprove ? "Approve Reconciliation" : "Reject Reconciliation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isApprove && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 dark:text-emerald-300">
              Approving will:
              <ul className="mt-1 ml-4 list-disc text-xs space-y-0.5">
                <li>Mark all {recon.total_kobo > 0 ? "transactions" : ""} as reconciled</li>
                <li>Reset the float balance to {recon.float.limit_fmt}</li>
                <li>Create a replenishment Requisition ({recon.total_fmt})</li>
              </ul>
            </div>
          )}
          {!isApprove && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-3 text-sm text-red-800 dark:text-red-300">
              Rejecting will return transactions to the custodian for correction.
            </div>
          )}
          <div>
            <Label htmlFor="notes">
              Notes {isApprove ? "(optional)" : "(required — explain variance)"}
            </Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder={isApprove ? "Add a note (optional)…" : "Explain the reason for rejection…"}
              value={data.notes}
              onChange={(e) => setData("notes", e.target.value)}
            />
            {errors.notes && <p className="text-sm text-red-600 mt-1">{errors.notes}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={processing}
              className={isApprove
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {processing ? "Saving…" : isApprove ? "Approve & Replenish" : "Reject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_BADGE: Record<string, string> = {
  pending_recon: "bg-amber-100 text-amber-700",
  reconciled:    "bg-emerald-100 text-emerald-700",
  rejected:      "bg-red-100 text-red-700",
};

export default function ReconciliationDetailPage({
  reconciliation: recon,
  transactions,
  canReview,
}: ReconciliationDetailPageProps) {
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reconciliation #{recon.id}</h1>
          <p className="text-sm text-muted-foreground">
            {recon.period_start} → {recon.period_end}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.visit("/finance/reconciliation")}>
          ← Back to Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: summary */}
        <div className="space-y-4">
          <div className="border rounded-xl p-5 space-y-3 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Summary</h3>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Custodian</p>
                <p className="font-medium">{recon.custodian.name}</p>
                <p className="text-xs text-muted-foreground">{recon.custodian.department}</p>
              </div>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-semibold">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Claimed</span>
                <span className="font-bold text-lg">{recon.total_fmt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Float Limit</span>
                <span>{recon.float.limit_fmt}</span>
              </div>
            </div>
            {recon.status !== "submitted" && (
              <div className="border-t pt-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  recon.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                  {recon.status === "approved" ? "Approved" : "Rejected"}
                </span>
                {recon.notes && (
                  <p className="text-xs text-muted-foreground mt-2">{recon.notes}</p>
                )}
                {recon.replenishment_req_id && (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Replenishment REQ created
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {canReview && (
            <div className="border-2 border-emerald-300 rounded-xl p-4 space-y-2 bg-emerald-50/30 dark:bg-emerald-950/10">
              <p className="text-xs font-semibold mb-2">Finance Decision</p>
              <Button
                onClick={() => setDialogAction("approve")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Replenish
              </Button>
              <Button
                onClick={() => setDialogAction("reject")}
                variant="destructive"
                className="w-full"
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          )}
        </div>

        {/* Right: transaction table */}
        <div className="md:col-span-2">
          <div className="border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/30">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Transactions ({transactions.length})
              </h3>
            </div>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No transactions</div>
            ) : (
              <div className="divide-y">
                {transactions.map((txn) => (
                  <div key={txn.id} className="px-5 py-3 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{txn.amount_fmt}</span>
                        {txn.account_code && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {txn.account_code.code}
                          </span>
                        )}
                      </div>
                      <p className="text-sm truncate">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{txn.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_BADGE[txn.status] ?? "bg-muted"
                      }`}>
                        {txn.status.replace("_", " ")}
                      </span>
                      <a
                        href={`/storage/${txn.receipt_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Download className="w-3 h-3" /> Receipt
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Total row */}
            <div className="px-5 py-3 border-t bg-muted/30 flex justify-between items-center">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-bold text-lg">{recon.total_fmt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review dialog */}
      {dialogAction && (
        <ReviewDialog
          recon={recon}
          action={dialogAction}
          open={dialogAction !== null}
          onClose={() => setDialogAction(null)}
        />
      )}
    </div>
  );
}

ReconciliationDetailPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
