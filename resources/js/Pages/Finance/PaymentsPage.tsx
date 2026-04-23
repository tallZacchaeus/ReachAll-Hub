import { useState } from "react";
import { useForm } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Separator,
} from "@/components/ui/separator";
import { CreditCard, CheckCircle2, Clock } from "lucide-react";

interface VendorInfo {
  name: string;
  bank_name: string | null;
  bank_account: string | null;
}

interface ReadyItem {
  id: number;
  request_id: string;
  type: string;
  status: string;
  amount_kobo: number;
  amount_fmt: string;
  description: string;
  requester: string | null;
  department: string | null;
  vendor: VendorInfo | null;
  tax_vat_fmt: string;
  tax_wht_fmt: string;
  total_fmt: string;
  total_kobo: number;
  requires_match: boolean;
  approved_at: string | null;
}

interface RecentPayment {
  id: number;
  request_id: string;
  description: string;
  amount_fmt: string;
  method: string;
  reference: string;
  paid_at: string;
  paid_by: string | null;
}

interface Props {
  ready: ReadyItem[];
  recent: RecentPayment[];
  flash?: { success?: string; error?: string };
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  cash: "Cash",
};

export default function PaymentsPage({ ready, recent, flash }: Props) {
  const [payTarget, setPayTarget] = useState<ReadyItem | null>(null);

  const form = useForm({
    method: "bank_transfer",
    reference: "",
    paid_at: new Date().toISOString().slice(0, 10),
    proof: null as File | null,
  });

  function openPayDialog(item: ReadyItem) {
    form.reset();
    form.setData("method", "bank_transfer");
    setPayTarget(item);
  }

  function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payTarget) return;
    form.post(`/finance/payments/${payTarget.id}/pay`, {
      forceFormData: true,
      onSuccess: () => setPayTarget(null),
    });
  }

  return (
    <MainLayout activePage="finance-payments" title="Payments">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Matched requisitions ready for payment. Requisitions ≥ ₦500K must be
            three-way matched before payment is enabled.
          </p>
        </div>

        {flash?.success && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
            {flash.success}
          </div>
        )}

        {/* ── Ready to Pay ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ready for Payment ({ready.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ready.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No requisitions awaiting payment.
              </p>
            ) : (
              <div className="overflow-x-auto">

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>VAT</TableHead>
                    <TableHead>WHT</TableHead>
                    <TableHead>Net Payable</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ready.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.request_id}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">{item.description}</TableCell>
                      <TableCell>{item.amount_fmt}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.tax_vat_fmt}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.tax_wht_fmt}</TableCell>
                      <TableCell className="font-semibold">{item.total_fmt}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.vendor?.name ?? "—"}
                        {item.vendor?.bank_name && (
                          <div className="text-xs text-muted-foreground/70">{item.vendor.bank_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.status === "matched" ? (
                          <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Matched
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Skipped (&lt;₦500K)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => openPayDialog(item)}>
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Pay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Recent Payments ── */}
        {recent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.request_id}</TableCell>
                      <TableCell className="font-medium">{p.amount_fmt}</TableCell>
                      <TableCell className="text-sm">{METHOD_LABELS[p.method] ?? p.method}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.reference}</TableCell>
                      <TableCell className="text-sm">{p.paid_at}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.paid_by ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Pay Dialog ── */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment — {payTarget?.request_id}</DialogTitle>
          </DialogHeader>

          {payTarget && (
            <div className="rounded-md bg-muted px-3 py-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross</span>
                <span>{payTarget.amount_fmt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ VAT</span>
                <span>{payTarget.tax_vat_fmt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">− WHT</span>
                <span>{payTarget.tax_wht_fmt}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold">
                <span>Net Payable</span>
                <span>{payTarget.total_fmt}</span>
              </div>
              {payTarget.vendor && (
                <div className="pt-1 text-muted-foreground">
                  Vendor: {payTarget.vendor.name}
                  {payTarget.vendor.bank_account && ` · ${payTarget.vendor.bank_account}`}
                </div>
              )}
            </div>
          )}

          <form onSubmit={submitPayment} className="space-y-4">
            <div className="space-y-1">
              <Label>Payment Method *</Label>
              <Select
                value={form.data.method}
                onValueChange={(v) => form.setData("method", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reference">Reference Number *</Label>
              <Input
                id="reference"
                value={form.data.reference}
                onChange={(e) => form.setData("reference", e.target.value)}
                placeholder="TRN-20240416-001"
              />
              {form.errors.reference && (
                <p className="text-xs text-red-600">{form.errors.reference}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="paid_at">Payment Date *</Label>
              <Input
                id="paid_at"
                type="date"
                value={form.data.paid_at}
                onChange={(e) => form.setData("paid_at", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="proof">Proof of Payment *</Label>
              <Input
                id="proof"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => form.setData("proof", e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">Bank receipt, transfer confirmation, or cheque scan</p>
              {form.errors.proof && (
                <p className="text-xs text-red-600">{form.errors.proof}</p>
              )}
            </div>

            {(form.errors as Record<string, string>).payment && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {(form.errors as Record<string, string>).payment}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.processing}>
                <Clock className="w-3.5 h-3.5 mr-1" />
                {form.processing ? "Processing…" : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
