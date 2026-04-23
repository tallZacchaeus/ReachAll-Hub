import { useState } from "react";
import { useForm } from "@inertiajs/react";
import {
  Wallet, AlertTriangle, CheckCircle2, Clock, Upload,
  TrendingDown, RotateCcw, ArrowUpCircle,
} from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FloatData {
  id: number;
  float_limit_kobo: number;
  current_balance_kobo: number;
  low_alert_threshold: number;
  last_reconciled_at: string | null;
  limit_fmt: string;
  balance_fmt: string;
  balance_pct: number;
  status: string;
}

interface Transaction {
  id: number;
  amount_kobo: number;
  amount_fmt: string;
  type: string;
  description: string;
  date: string;
  status: string;
  receipt_path: string;
  account_code: { code: string; description: string } | null;
}

interface AccountCode {
  id: number;
  code: string;
  description: string;
}

interface PettyCashPageProps {
  float: FloatData;
  transactions: Transaction[];
  accountCodes: AccountCode[];
  canSubmitRecon: boolean;
  daysWithoutRecon: number;
  pendingCount: number;
}

interface ExpenseFormData {
  amount_naira: string;
  description: string;
  date: string;
  account_code_id: string;
  receipt: File | null;
  [key: string]: string | File | null;
}

const TXN_STATUS: Record<string, { label: string; cls: string }> = {
  pending_recon: { label: "Pending",     cls: "bg-amber-100 text-amber-700" },
  reconciled:    { label: "Reconciled",  cls: "bg-emerald-100 text-emerald-700" },
  rejected:      { label: "Rejected",    cls: "bg-red-100 text-red-700" },
};

function BalanceMeter({ pct, threshold, balanceFmt, limitFmt }: {
  pct: number; threshold: number; balanceFmt: string; limitFmt: string;
}) {
  const color = pct > threshold * 2
    ? "bg-emerald-500"
    : pct > threshold
    ? "bg-amber-400"
    : "bg-red-500";

  const textColor = pct > threshold * 2
    ? "text-emerald-700"
    : pct > threshold
    ? "text-amber-700"
    : "text-red-700";

  return (
    <div className="border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Float Balance</h3>
        </div>
        {pct <= threshold && (
          <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Low Balance
          </span>
        )}
      </div>
      <div className="mb-3">
        <div className={`text-3xl font-bold ${textColor}`}>{balanceFmt}</div>
        <div className="text-sm text-muted-foreground">of {limitFmt} float limit</div>
      </div>
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1 text-right">{pct.toFixed(1)}% remaining</div>
    </div>
  );
}

function ExpenseDialog({
  floatId, accountCodes, open, onClose,
}: {
  floatId: number; accountCodes: AccountCode[]; open: boolean; onClose: () => void;
}) {
  const { data, setData, post, processing, errors, reset } = useForm<ExpenseFormData>({
    amount_naira:    "",
    description:     "",
    date:            new Date().toISOString().slice(0, 10),
    account_code_id: "",
    receipt:         null,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post("/finance/petty-cash/expense", {
      forceFormData: true,
      onSuccess: () => { reset(); onClose(); },
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Amount (₦) *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max="20000"
                step="0.01"
                placeholder="e.g. 5000"
                value={data.amount_naira}
                onChange={(e) => setData("amount_naira", e.target.value)}
              />
              {errors.amount_naira && <p className="text-xs text-red-600 mt-1">{errors.amount_naira}</p>}
            </div>
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={data.date}
                onChange={(e) => setData("date", e.target.value)}
              />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="What was this expense for?"
              value={data.description}
              onChange={(e) => setData("description", e.target.value)}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          <div>
            <Label htmlFor="ac">Account Code</Label>
            <Select
              value={data.account_code_id}
              onValueChange={(v) => setData("account_code_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select (optional)" />
              </SelectTrigger>
              <SelectContent>
                {accountCodes.map((ac) => (
                  <SelectItem key={ac.id} value={String(ac.id)}>
                    {ac.code} — {ac.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="receipt">Receipt *</Label>
            <Input
              id="receipt"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setData("receipt", e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, or PNG — max 5 MB. Required.</p>
            {errors.receipt && <p className="text-xs text-red-600 mt-1">{errors.receipt}</p>}
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
            Hard limits: ₦20K per expense · ₦50K per day · ₦200K per week
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={processing}>
              {processing ? "Saving…" : "Log Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PettyCashPage({
  float: floatData,
  transactions,
  accountCodes,
  canSubmitRecon,
  daysWithoutRecon,
  pendingCount,
}: PettyCashPageProps) {
  const [showExpense, setShowExpense]       = useState(false);
  const [showReconConfirm, setShowReconConfirm] = useState(false);

  const { post: submitRecon, processing: submittingRecon } = useForm({});

  function handleSubmitRecon() {
    submitRecon("/finance/petty-cash/reconciliation", {
      onSuccess: () => setShowReconConfirm(false),
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Petty Cash</h1>
          <p className="text-sm text-muted-foreground">Your float dashboard</p>
        </div>
        <Button onClick={() => setShowExpense(true)} className="bg-brand hover:bg-[#1a5c3e] text-white">
          <TrendingDown className="w-4 h-4 mr-2" /> Log Expense
        </Button>
      </div>

      {/* Recon due warning */}
      {daysWithoutRecon > 25 && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${
          daysWithoutRecon > 30
            ? "bg-red-50 dark:bg-red-950/20 border-red-200 text-red-800 dark:text-red-300"
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 text-amber-800 dark:text-amber-300"
        }`}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">
              {daysWithoutRecon > 30 ? "Expenses Blocked — Reconciliation Overdue" : "Reconciliation Due Soon"}
            </p>
            <p className="text-xs mt-0.5">
              {daysWithoutRecon} days since last reconciliation.
              {daysWithoutRecon > 30
                ? " New expenses are blocked until you submit a reconciliation."
                : " Submit a reconciliation before day 30 to avoid blocking."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance meter */}
        <div className="md:col-span-1">
          <BalanceMeter
            pct={floatData.balance_pct}
            threshold={floatData.low_alert_threshold}
            balanceFmt={floatData.balance_fmt}
            limitFmt={floatData.limit_fmt}
          />

          {/* Submit reconciliation */}
          <div className="border rounded-xl p-5 mt-4">
            <h3 className="font-semibold text-sm mb-1">Reconciliation</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {pendingCount} pending transaction{pendingCount !== 1 ? "s" : ""} · {daysWithoutRecon} days since last recon
            </p>
            <Button
              onClick={() => setShowReconConfirm(true)}
              disabled={!canSubmitRecon || submittingRecon}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Submit Reconciliation
            </Button>
            {!canSubmitRecon && pendingCount === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">No pending transactions</p>
            )}
            {!canSubmitRecon && pendingCount > 0 && daysWithoutRecon < 7 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">Available after 7 days</p>
            )}
          </div>
        </div>

        {/* Transaction history */}
        <div className="md:col-span-2">
          <div className="border rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Recent Transactions
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No transactions yet. Log your first expense above.
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((txn) => {
                  const st = TXN_STATUS[txn.status] ?? { label: txn.status, cls: "bg-muted" };
                  return (
                    <div key={txn.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {txn.date}
                          {txn.account_code && ` · ${txn.account_code.code}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-red-600">−{txn.amount_fmt}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                          {st.label}
                        </span>
                        <a
                          href={`/storage/${txn.receipt_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Receipt
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense dialog */}
      <ExpenseDialog
        floatId={floatData.id}
        accountCodes={accountCodes}
        open={showExpense}
        onClose={() => setShowExpense(false)}
      />

      {/* Submit reconciliation confirm */}
      <AlertDialog open={showReconConfirm} onOpenChange={setShowReconConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Reconciliation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will bundle all {pendingCount} pending transaction{pendingCount !== 1 ? "s" : ""} into a reconciliation submission for Finance review.
              Once submitted, you cannot add more transactions to this period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitRecon} disabled={submittingRecon}>
              {submittingRecon ? "Submitting…" : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

PettyCashPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
