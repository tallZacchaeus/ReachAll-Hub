import { router, useForm } from "@inertiajs/react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  RefreshCw,
  FileText,
} from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";


interface Invoice {
  id: number;
  invoice_number: string;
  amount_fmt: string;
  match_status: "pending" | "matched" | "variance" | "blocked";
  variance_fmt: string;
  variance_kobo: number;
  file_url: string;
}

interface RequisitionItem {
  id: number;
  request_id: string;
  status: string;
  type: string;
  amount_kobo: number;
  amount_fmt: string;
  description: string;
  requester: string | null;
  department: string | null;
  vendor: string | null;
  cost_centre: string | null;
  requires_match: boolean;
  has_invoice: boolean;
  has_receipt: boolean;
  invoice: Invoice | null;
  approved_at: string | null;
}

interface Props {
  pending: RequisitionItem[];
  matched: RequisitionItem[];
  flash?: { success?: string; warning?: string; error?: string };
  userRole: string;
}

const MATCH_STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:  { label: "Pending",  variant: "secondary" },
  matched:  { label: "Matched",  variant: "default" },
  variance: { label: "Variance", variant: "outline" },
  blocked:  { label: "Blocked",  variant: "destructive" },
};

export default function ThreeWayMatchPage({ pending, matched, flash, userRole }: Props) {
  const [uploadTarget, setUploadTarget] = useState<RequisitionItem | null>(null);
  const [varianceTarget, setVarianceTarget] = useState<RequisitionItem | null>(null);
  const [matchConfirmId, setMatchConfirmId] = useState<number | null>(null);

  const isCeo = ["ceo", "superadmin"].includes(userRole);

  const uploadForm = useForm({
    invoice_number: "",
    invoice_amount: "",
    invoice_date: "",
    invoice_file: null as File | null,
    receipt_date: "",
    receipt_notes: "",
    receipt_file: null as File | null,
  });

  const varianceForm = useForm({ override_reason: "" });

  function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadTarget) return;
    uploadForm.post(`/finance/matching/${uploadTarget.id}/upload`, {
      forceFormData: true,
      onSuccess: () => setUploadTarget(null),
    });
  }

  function runMatch(id: number) {
    router.post(`/finance/matching/${id}/match`, {}, {
      onFinish: () => setMatchConfirmId(null),
    });
  }

  function submitVariance(e: React.FormEvent) {
    e.preventDefault();
    if (!varianceTarget) return;
    varianceForm.post(`/finance/matching/${varianceTarget.id}/accept-variance`, {
      onSuccess: () => setVarianceTarget(null),
    });
  }

  const matchIcon = (status: string) => {
    if (status === "matched")  return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === "variance") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    if (status === "blocked")  return <XCircle className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <MainLayout activePage="finance-matching" title="Three-Way Matching">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Three-Way Matching</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload invoices and goods receipts, then run the match engine.
            Requisitions ≥ ₦500K require a confirmed match before payment.
          </p>
        </div>

        {flash?.success && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
            {flash.success}
          </div>
        )}
        {flash?.warning && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
            {flash.warning}
          </div>
        )}

        {/* ── Pending Queue ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Awaiting Match ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pending.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No approved requisitions awaiting three-way match.
              </p>
            ) : (
              <div className="overflow-x-auto">

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Match Required</TableHead>
                    <TableHead>Invoice Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.request_id}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{item.description}</TableCell>
                      <TableCell className="font-medium">{item.amount_fmt}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.vendor ?? "—"}</TableCell>
                      <TableCell>
                        {item.requires_match ? (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.invoice ? (
                          <div className="flex items-center gap-1.5">
                            {matchIcon(item.invoice.match_status)}
                            <Badge
                              variant={MATCH_STATUS_BADGE[item.invoice.match_status]?.variant ?? "secondary"}
                              className="text-xs"
                            >
                              {MATCH_STATUS_BADGE[item.invoice.match_status]?.label ?? item.invoice.match_status}
                            </Badge>
                            {item.invoice.variance_kobo !== 0 && (
                              <span className="text-xs text-amber-600">±{item.invoice.variance_fmt}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No invoice</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Upload documents */}
                          {!item.has_invoice && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUploadTarget(item)}
                            >
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              Upload
                            </Button>
                          )}

                          {/* Run match */}
                          {item.has_invoice && item.has_receipt && item.invoice?.match_status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => setMatchConfirmId(item.id)}
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              Match
                            </Button>
                          )}

                          {/* CEO: accept variance */}
                          {isCeo && item.invoice?.match_status === "variance" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-300 text-amber-700 hover:bg-amber-50"
                              onClick={() => setVarianceTarget(item)}
                            >
                              Accept Variance
                            </Button>
                          )}

                          {/* View invoice */}
                          {item.invoice?.file_url && (
                            <a
                              href={item.invoice.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" />
                              Invoice
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Matched History ── */}
        {matched.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recently Matched</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matched.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.request_id}</TableCell>
                      <TableCell>{item.amount_fmt}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.vendor ?? "—"}</TableCell>
                      <TableCell className="text-sm">{item.invoice?.invoice_number ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Matched
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Upload Dialog ── */}
      <Dialog open={!!uploadTarget} onOpenChange={(o) => !o && setUploadTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Documents — {uploadTarget?.request_id}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitUpload} className="space-y-4">
            <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Requisition: <strong>{uploadTarget?.amount_fmt}</strong> · {uploadTarget?.vendor ?? "No vendor"}
            </div>

            {/* Invoice section */}
            <p className="text-sm font-semibold">Invoice</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="invoice_number">Invoice Number *</Label>
                <Input
                  id="invoice_number"
                  value={uploadForm.data.invoice_number}
                  onChange={(e) => uploadForm.setData("invoice_number", e.target.value)}
                  placeholder="INV-2024-001"
                />
                {uploadForm.errors.invoice_number && (
                  <p className="text-xs text-red-600">{uploadForm.errors.invoice_number}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice_amount">Invoice Amount (₦) *</Label>
                <Input
                  id="invoice_amount"
                  type="number"
                  step="0.01"
                  value={uploadForm.data.invoice_amount}
                  onChange={(e) => uploadForm.setData("invoice_amount", e.target.value)}
                />
                {uploadForm.errors.invoice_amount && (
                  <p className="text-xs text-red-600">{uploadForm.errors.invoice_amount}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={uploadForm.data.invoice_date}
                  onChange={(e) => uploadForm.setData("invoice_date", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice_file">Invoice PDF/Image *</Label>
                <Input
                  id="invoice_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => uploadForm.setData("invoice_file", e.target.files?.[0] ?? null)}
                />
                {uploadForm.errors.invoice_file && (
                  <p className="text-xs text-red-600">{uploadForm.errors.invoice_file}</p>
                )}
              </div>
            </div>

            {/* Goods receipt section */}
            <p className="text-sm font-semibold mt-2">Goods Receipt</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="receipt_date">Receipt Date *</Label>
                <Input
                  id="receipt_date"
                  type="date"
                  value={uploadForm.data.receipt_date}
                  onChange={(e) => uploadForm.setData("receipt_date", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="receipt_file">Delivery Note *</Label>
                <Input
                  id="receipt_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => uploadForm.setData("receipt_file", e.target.files?.[0] ?? null)}
                />
                {uploadForm.errors.receipt_file && (
                  <p className="text-xs text-red-600">{uploadForm.errors.receipt_file}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt_notes">Notes</Label>
              <Textarea
                id="receipt_notes"
                rows={2}
                value={uploadForm.data.receipt_notes}
                onChange={(e) => uploadForm.setData("receipt_notes", e.target.value)}
                placeholder="Condition of goods, partial delivery notes..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadForm.processing}>
                {uploadForm.processing ? "Uploading…" : "Upload Documents"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Match Confirm Dialog ── */}
      <AlertDialog open={matchConfirmId !== null} onOpenChange={(o) => !o && setMatchConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Three-Way Match?</AlertDialogTitle>
            <AlertDialogDescription>
              This will compare the invoice and goods receipt against the requisition.
              A variance will require CEO review before payment can proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => matchConfirmId && runMatch(matchConfirmId)}>
              Run Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── CEO Variance Accept Dialog ── */}
      <Dialog open={!!varianceTarget} onOpenChange={(o) => !o && setVarianceTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-700">Accept Match Variance</DialogTitle>
          </DialogHeader>
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
            <strong>Variance: {varianceTarget?.invoice?.variance_fmt}</strong> on {varianceTarget?.request_id}.
            By accepting, you authorise payment despite the invoice discrepancy.
            This decision is permanently logged.
          </div>
          <form onSubmit={submitVariance} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="override_reason">
                Reason for Acceptance * <span className="text-muted-foreground">(min. 30 characters)</span>
              </Label>
              <Textarea
                id="override_reason"
                rows={3}
                value={varianceForm.data.override_reason}
                onChange={(e) => varianceForm.setData("override_reason", e.target.value)}
                placeholder="Explain why this variance is acceptable..."
              />
              <p className="text-xs text-muted-foreground">
                {varianceForm.data.override_reason.length} / 30 min
              </p>
              {varianceForm.errors.override_reason && (
                <p className="text-xs text-red-600">{varianceForm.errors.override_reason}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVarianceTarget(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={varianceForm.processing || varianceForm.data.override_reason.length < 30}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {varianceForm.processing ? "Saving…" : "Accept & Proceed"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
