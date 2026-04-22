import { useState, useMemo } from "react";
import { useForm } from "@inertiajs/react";
import {
  FileText, Upload, X, AlertCircle, CheckCircle2, Zap, Package, Briefcase, AlertTriangle,
  Info,
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
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface CostCentre {
  id: number;
  code: string;
  name: string;
  depth: number;
  label: string;
}

interface AccountCode {
  id: number;
  code: string;
  category: string;
  category_label: string;
  description: string;
  tax_vat_applicable: boolean;
  tax_wht_applicable: boolean;
  wht_rate: number | null;
}

interface Vendor {
  id: number;
  name: string;
  bank_name: string | null;
  contact_email: string | null;
}

interface RequisitionCreatePageProps {
  costCentres: CostCentre[];
  accountCodes: AccountCode[];
  vendors: Vendor[];
  vatRate: number;
}

const REQUEST_TYPES = [
  {
    value: "OPEX",
    label: "OPEX",
    description: "Operational expenses — day-to-day running costs",
    icon: Package,
    color: "border-blue-300 bg-blue-50 dark:bg-blue-950/30",
    active: "border-blue-500 bg-blue-100 dark:bg-blue-900/40",
  },
  {
    value: "CAPEX",
    label: "CAPEX",
    description: "Capital expenditure — assets and equipment",
    icon: Briefcase,
    color: "border-amber-300 bg-amber-50 dark:bg-amber-950/30",
    active: "border-amber-500 bg-amber-100 dark:bg-amber-900/40",
  },
  {
    value: "PETTY",
    label: "Petty Cash",
    description: "Small purchases under ₦10,000 from petty cash float",
    icon: FileText,
    color: "border-green-300 bg-green-50 dark:bg-green-950/30",
    active: "border-green-500 bg-green-100 dark:bg-green-900/40",
  },
  {
    value: "EMERG",
    label: "Emergency",
    description: "Urgent unplanned expenditure requiring justification",
    icon: AlertTriangle,
    color: "border-red-300 bg-red-50 dark:bg-red-950/30",
    active: "border-red-500 bg-red-100 dark:bg-red-900/40",
  },
];

const CURRENCIES = ["NGN", "USD", "EUR", "GBP"];

interface FormData {
  type: string;
  amount_naira: string;
  currency: string;
  exchange_rate: string;
  cost_centre_id: string;
  account_code_id: string;
  vendor_id: string;
  urgency: string;
  description: string;
  supporting_docs: File[];
  [key: string]: string | File[];
}

export default function RequisitionCreatePage({
  costCentres,
  accountCodes,
  vendors,
  vatRate,
}: RequisitionCreatePageProps) {
  const { data, setData, post, processing, errors } = useForm<FormData>({
    type: "OPEX",
    amount_naira: "",
    currency: "NGN",
    exchange_rate: "1",
    cost_centre_id: "",
    account_code_id: "",
    vendor_id: "",
    urgency: "standard",
    description: "",
    supporting_docs: [],
  });

  const [vendorOpen, setVendorOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [acOpen, setAcOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ── Tax preview calculation ───────────────────────────────────────────────
  const selectedAC = useMemo(
    () => accountCodes.find((ac) => String(ac.id) === data.account_code_id),
    [accountCodes, data.account_code_id]
  );

  const preview = useMemo(() => {
    const naira = parseFloat(data.amount_naira) || 0;
    const kobo  = Math.round(naira * 100);
    const vat   = selectedAC?.tax_vat_applicable ? Math.round(kobo * vatRate) : 0;
    const wht   = (selectedAC?.tax_wht_applicable && selectedAC?.wht_rate)
      ? Math.round(kobo * (selectedAC.wht_rate / 100))
      : 0;
    const total = kobo + vat - wht;

    const fmt = (k: number) =>
      "₦" + (k / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return { gross: fmt(kobo), vat: fmt(vat), wht: fmt(wht), total: fmt(total) };
  }, [data.amount_naira, selectedAC, vatRate]);

  // ── File handling ─────────────────────────────────────────────────────────
  function addFiles(files: FileList | null) {
    if (!files) return;
    const allowed = Array.from(files).filter((f) => {
      const ok = ["application/pdf", "image/jpeg", "image/png"].includes(f.type);
      const size = f.size <= 10 * 1024 * 1024;
      return ok && size;
    });
    setData("supporting_docs", [...(data.supporting_docs as File[]), ...allowed]);
  }

  function removeFile(idx: number) {
    const docs = [...(data.supporting_docs as File[])];
    docs.splice(idx, 1);
    setData("supporting_docs", docs);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post("/finance/requisitions", {
      forceFormData: true,
    });
  }

  const selectedCC     = costCentres.find((cc) => String(cc.id) === data.cost_centre_id);
  const selectedVendor = vendors.find((v) => String(v.id) === data.vendor_id);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-500" />
          New Payment Request
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit a request for approval. All fields are required unless marked optional.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Form ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Request type picker */}
            <div>
              <Label className="mb-2 block text-sm font-semibold">Request Type *</Label>
              <div className="grid grid-cols-2 gap-3">
                {REQUEST_TYPES.map((rt) => {
                  const Icon = rt.icon;
                  const isSelected = data.type === rt.value;
                  return (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() => setData("type", rt.value)}
                      className={cn(
                        "text-left p-3 rounded-lg border-2 transition-all",
                        isSelected ? rt.active : rt.color
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4" />
                        <span className="font-semibold text-sm">{rt.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rt.description}</p>
                    </button>
                  );
                })}
              </div>
              {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
            </div>

            {/* Amount + Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="amount">Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">₦</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    className="pl-7"
                    placeholder="0.00"
                    value={data.amount_naira}
                    onChange={(e) => setData("amount_naira", e.target.value)}
                  />
                </div>
                {errors.amount_naira && <p className="text-sm text-red-600 mt-1">{errors.amount_naira}</p>}
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={data.currency} onValueChange={(v) => setData("currency", v)}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost Centre */}
            <div>
              <Label className="mb-1 block">Cost Centre *</Label>
              <Popover open={ccOpen} onOpenChange={setCcOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal" type="button">
                    {selectedCC ? (
                      <span>{selectedCC.code} — {selectedCC.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Select cost centre…</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search cost centres…" />
                    <CommandEmpty>No cost centre found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {costCentres.map((cc) => (
                        <CommandItem
                          key={cc.id}
                          value={cc.label}
                          onSelect={() => {
                            setData("cost_centre_id", String(cc.id));
                            setCcOpen(false);
                          }}
                          className={cn(cc.depth === 1 && "pl-6", cc.depth === 2 && "pl-10")}
                        >
                          <span className="font-mono text-xs text-muted-foreground mr-2">{cc.code}</span>
                          {cc.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.cost_centre_id && <p className="text-sm text-red-600 mt-1">{errors.cost_centre_id}</p>}
            </div>

            {/* Account Code */}
            <div>
              <Label className="mb-1 block">Account Code *</Label>
              <Popover open={acOpen} onOpenChange={setAcOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal" type="button">
                    {selectedAC ? (
                      <span>{selectedAC.code} — {selectedAC.description}</span>
                    ) : (
                      <span className="text-muted-foreground">Select account code…</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[460px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by code or description…" />
                    <CommandEmpty>No account code found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {accountCodes.map((ac) => (
                        <CommandItem
                          key={ac.id}
                          value={`${ac.code} ${ac.description} ${ac.category_label}`}
                          onSelect={() => {
                            setData("account_code_id", String(ac.id));
                            setAcOpen(false);
                          }}
                        >
                          <span className="font-mono text-xs text-muted-foreground mr-2 w-10 shrink-0">{ac.code}</span>
                          <span className="flex-1">{ac.description}</span>
                          <span className="text-xs text-muted-foreground ml-2">{ac.category_label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.account_code_id && <p className="text-sm text-red-600 mt-1">{errors.account_code_id}</p>}
            </div>

            {/* Vendor */}
            <div>
              <Label className="mb-1 block">Vendor *</Label>
              <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal" type="button">
                    {selectedVendor ? (
                      <span>{selectedVendor.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Search vendor…</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search vendor name or email…" />
                    <CommandEmpty>No vendor found. Only registered vendors are allowed.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {vendors.map((v) => (
                        <CommandItem
                          key={v.id}
                          value={`${v.name} ${v.contact_email ?? ""}`}
                          onSelect={() => {
                            setData("vendor_id", String(v.id));
                            setVendorOpen(false);
                          }}
                        >
                          <div>
                            <p className="font-medium">{v.name}</p>
                            {v.bank_name && (
                              <p className="text-xs text-muted-foreground">{v.bank_name}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.vendor_id && <p className="text-sm text-red-600 mt-1">{errors.vendor_id}</p>}
            </div>

            {/* Urgency */}
            <div>
              <Label className="mb-2 block text-sm font-semibold">Urgency *</Label>
              <RadioGroup
                value={data.urgency}
                onValueChange={(v) => setData("urgency", v)}
                className="flex gap-6"
              >
                {[
                  { value: "standard", label: "Standard", description: "Normal processing" },
                  { value: "urgent", label: "Urgent", description: "Within 48h needed" },
                  { value: "emergency", label: "Emergency", description: "Same-day required" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-start gap-2">
                    <RadioGroupItem value={opt.value} id={`urgency-${opt.value}`} className="mt-0.5" />
                    <Label htmlFor={`urgency-${opt.value}`} className="cursor-pointer">
                      <span className="font-medium">{opt.label}</span>
                      <p className="text-xs text-muted-foreground font-normal">{opt.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe what this request is for (min. 20 characters). Include purpose, business justification, and expected delivery date if applicable."
                value={data.description}
                onChange={(e) => setData("description", e.target.value)}
                className="resize-none"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">Minimum 20 characters</p>
                <p className={cn("text-xs", data.description.length < 20 ? "text-red-500" : "text-muted-foreground")}>
                  {data.description.length} chars
                </p>
              </div>
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
            </div>

            {/* Supporting Documents */}
            <div>
              <Label className="mb-2 block text-sm font-semibold">
                Supporting Documents * <span className="text-muted-foreground font-normal text-xs">(at least 1 required — PDF, JPG, PNG; max 10MB each)</span>
              </Label>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                  dragOver ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" : "border-border hover:border-muted-foreground/50"
                )}
                onClick={() => document.getElementById("doc-upload")?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag & drop files here, or click to browse</p>
                <input
                  id="doc-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {/* File list */}
              {(data.supporting_docs as File[]).length > 0 && (
                <ul className="mt-3 space-y-2">
                  {(data.supporting_docs as File[]).map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate max-w-64">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button type="button" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {errors.supporting_docs && <p className="text-sm text-red-600 mt-1">{errors.supporting_docs as string}</p>}
            </div>

            <Button type="submit" disabled={processing} className="w-full" size="lg">
              {processing ? "Submitting…" : "Submit Request for Approval"}
            </Button>
          </div>

          {/* ── Right: Preview panel ──────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">

              {/* Tax summary */}
              <div className="border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Payment Summary
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Amount</span>
                    <span className="font-medium">{preview.gross}</span>
                  </div>

                  {selectedAC?.tax_vat_applicable && (
                    <div className="flex justify-between text-amber-700 dark:text-amber-300">
                      <span>+ VAT (7.5%)</span>
                      <span>{preview.vat}</span>
                    </div>
                  )}

                  {selectedAC?.tax_wht_applicable && (
                    <div className="flex justify-between text-blue-700 dark:text-blue-300">
                      <span>− WHT ({selectedAC.wht_rate}%)</span>
                      <span>{preview.wht}</span>
                    </div>
                  )}

                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total Payable</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{preview.total}</span>
                  </div>
                </div>

                {selectedAC && (
                  <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                    {selectedAC.tax_vat_applicable
                      ? <p className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> VAT applies (7.5%)</p>
                      : <p className="flex items-center gap-1"><X className="w-3 h-3" /> VAT not applicable</p>}
                    {selectedAC.tax_wht_applicable
                      ? <p className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> WHT applies ({selectedAC.wht_rate}%)</p>
                      : <p className="flex items-center gap-1"><X className="w-3 h-3" /> WHT not applicable</p>}
                  </div>
                )}
              </div>

              {/* Approval path preview */}
              <div className="border rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Approval Route
                </h3>
                {data.amount_naira ? (
                  <ApprovalRoutePreview
                    amountNaira={parseFloat(data.amount_naira) || 0}
                    type={data.type}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">Enter an amount to see the approval chain.</p>
                )}
              </div>

              {/* Checklist */}
              <div className="border rounded-xl p-5 space-y-2">
                <h3 className="font-semibold text-sm mb-2">Submission Checklist</h3>
                {[
                  { label: "Request type selected", ok: !!data.type },
                  { label: "Amount entered", ok: !!data.amount_naira && parseFloat(data.amount_naira) > 0 },
                  { label: "Cost centre selected", ok: !!data.cost_centre_id },
                  { label: "Account code selected", ok: !!data.account_code_id },
                  { label: "Vendor selected", ok: !!data.vendor_id },
                  { label: "Description (min 20 chars)", ok: data.description.length >= 20 },
                  { label: "At least 1 document uploaded", ok: (data.supporting_docs as File[]).length >= 1 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    {item.ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      : <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <span className={item.ok ? "" : "text-muted-foreground"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function ApprovalRoutePreview({ amountNaira, type }: { amountNaira: number; type: string }) {
  const tiers = useMemo(() => {
    const TIERS_OPEX: [number, string[]][] = [
      [100_000,     ["Line Manager"]],
      [500_000,     ["Line Manager", "Dept Head"]],
      [2_000_000,   ["Line Manager", "Dept Head", "Finance"]],
      [10_000_000,  ["Line Manager", "Dept Head", "Finance", "Gen. Management"]],
      [Infinity,    ["Line Manager", "Dept Head", "Finance", "Gen. Management", "CEO"]],
    ];

    let base: string[] = ["Line Manager"];
    for (const [threshold, levels] of TIERS_OPEX) {
      if (amountNaira < threshold) {
        base = levels;
        break;
      }
    }

    if (type === "CAPEX" && !base.includes("CEO")) {
      const allTiers = ["Line Manager", "Dept Head", "Finance", "Gen. Management", "CEO"];
      const extra = allTiers.find((t) => !base.includes(t));
      if (extra) base = [...base, extra];
    }

    return base;
  }, [amountNaira, type]);

  return (
    <ol className="space-y-2">
      {tiers.map((label, idx) => (
        <li key={label} className="flex items-center gap-2 text-xs">
          <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
            {idx + 1}
          </span>
          <span>{label}</span>
        </li>
      ))}
      {amountNaira >= 10_000_000 && (
        <li className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
          <AlertTriangle className="w-3 h-3" /> Board approval flag required
        </li>
      )}
    </ol>
  );
}

RequisitionCreatePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
