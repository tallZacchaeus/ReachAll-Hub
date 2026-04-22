import { useState } from "react";
import { useForm, router } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, FileText, Eye, Download } from "lucide-react";

interface CostCentre {
  id: number;
  code: string;
  name: string;
}

interface Props {
  report_types: Record<string, string>;
  cost_centres: CostCentre[];
  categories: string[];
  filters: Record<string, string>;
  report_type: string;
  headings: string[];
  preview: string[][] | null;
}

export default function ReportsPage({
  report_types, cost_centres, categories, filters, report_type, headings, preview,
}: Props) {
  const [selectedType, setSelectedType] = useState(report_type ?? "budget_vs_actual");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const [ccId, setCcId] = useState(filters.cost_centre_id ?? "");

  function buildQuery(extra: Record<string, string> = {}): string {
    const p = new URLSearchParams({
      report_type: selectedType,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(ccId ? { cost_centre_id: ccId } : {}),
      ...extra,
    });
    return p.toString();
  }

  function handlePreview() {
    router.get(`/finance/reports?${buildQuery({ preview: "1" })}`);
  }

  function handleExcelExport() {
    window.location.href = `/finance/reports/export/excel?${buildQuery()}`;
  }

  function handlePdfExport() {
    window.location.href = `/finance/reports/export/pdf?${buildQuery()}`;
  }

  return (
    <MainLayout activePage="finance-reports" title="Finance Reports">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, preview, and export financial reports. All exports respect your data-access level.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Report Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Report Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(report_types).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                    <SelectItem value="transactions">Full Transaction Listing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Date From</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Date To</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Cost Centre</Label>
                <Select value={ccId || "_all"} onValueChange={(v) => setCcId(v === "_all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All cost centres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All cost centres</SelectItem>
                    {cost_centres.map((cc) => (
                      <SelectItem key={cc.id} value={String(cc.id)}>
                        {cc.code} — {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={handlePreview} variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1.5" /> Preview (50 rows)
              </Button>
              <Button onClick={handleExcelExport} size="sm">
                <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export Excel
              </Button>
              <Button onClick={handlePdfExport} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1.5" /> Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview table */}
        {preview !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Preview — {report_types[report_type] ?? "Full Transaction Listing"}
                <span className="text-xs font-normal text-muted-foreground">
                  (first {preview.length} rows shown — export for full dataset)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {preview.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No data found for the selected filters.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headings.map((h) => (
                        <TableHead key={h} className="text-xs whitespace-nowrap">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, ri) => (
                      <TableRow key={ri}>
                        {row.map((cell, ci) => (
                          <TableCell key={ci} className="text-xs whitespace-nowrap">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Report guide */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Available Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { type: "budget_vs_actual",      desc: "Compares budgeted vs. actual spend per cost centre with variance and utilisation %" },
                { type: "spend_by_cost_centre",  desc: "Total spend grouped by cost centre with transaction counts and averages" },
                { type: "spend_by_account_code", desc: "Spend breakdown by account code category for chart-of-accounts analysis" },
                { type: "approval_throughput",   desc: "Time from submission to decision for all requisitions — identifies bottlenecks" },
                { type: "tax_summary",           desc: "MTD/YTD VAT collected and WHT withheld grouped by period and cost centre" },
                { type: "transactions",          desc: "Full transaction listing with all fields — compatible with accounting software import" },
              ].map((r) => (
                <button
                  key={r.type}
                  onClick={() => { setSelectedType(r.type); }}
                  className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium">{report_types[r.type] ?? "Full Transaction Listing"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
