import MainLayout from "@/layouts/MainLayout";
import { useChartColors } from "@/lib/useChartColors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@inertiajs/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  TrendingUp, AlertTriangle, CheckCircle2, Clock, Wallet,
  BarChart3, FileText, ChevronRight,
} from "lucide-react";

interface SummaryCard {
  label: string;
  value: string | number;
  color: "amber" | "green" | "red" | "blue" | "orange" | "purple";
}

interface TrendRow {
  month: string;
  kobo: number;
  fmt: string;
}

interface BudgetMeterWidget {
  name: string;
  pct: number;
  used_fmt: string;
  budget_fmt: string;
  status: string;
}

interface BudgetHealthRow {
  name: string;
  code: string;
  budget_fmt: string;
  pct: number;
}

interface RecentRow {
  id: number;
  request_id: string;
  description: string;
  amount_fmt: string;
  status: string;
  date: string;
}

interface Widgets {
  summary?: SummaryCard[];
  recent?: RecentRow[];
  tax_mtd?: { vat_fmt: string; wht_fmt: string };
  trend?: TrendRow[];
  budget_health?: BudgetHealthRow[];
  capex_pipeline_fmt?: string;
  budget_meter?: BudgetMeterWidget;
}

interface Props {
  widgets: Widgets;
  user_role: string;
  period: { label: string; status: string; id: number } | null;
}

const COLOR_MAP: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  red:   "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  blue:  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  orange:"bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  purple:"bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
};

const STATUS_COLORS: Record<string, string> = {
  draft:     "secondary",
  submitted: "outline",
  approving: "outline",
  approved:  "default",
  matched:   "default",
  paid:      "default",
  posted:    "default",
  rejected:  "destructive",
  cancelled: "secondary",
};

function pctColor(pct: number): string {
  if (pct >= 100) return "text-red-600";
  if (pct >= 90)  return "text-orange-600";
  if (pct >= 80)  return "text-amber-600";
  return "text-green-600";
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? "bg-red-500" : pct >= 90 ? "bg-orange-400" : pct >= 80 ? "bg-amber-400" : "bg-green-500";
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function DashboardPage({ widgets, user_role, period }: Props) {
  const { colors } = useChartColors();
  const isExec    = ["ceo", "general_management", "management"].includes(user_role);
  const isFinance = ["finance", "superadmin", "hr"].includes(user_role);
  const trendData = widgets.trend ?? [];

  return (
    <MainLayout activePage="finance-dashboard" title="Finance Dashboard">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Finance Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {period ? `Current period: ${period.label}` : "No active period"} &nbsp;·&nbsp;
              {period?.status === "closed" && <span className="text-red-600 font-medium">CLOSED</span>}
              {period?.status === "closing" && <span className="text-amber-600 font-medium">CLOSING</span>}
              {period?.status === "open" && <span className="text-green-600">Open</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/finance/reports" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <BarChart3 className="w-4 h-4" /> Reports
            </Link>
            <Link href="/finance/requisitions/create" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <FileText className="w-4 h-4" /> New Request
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        {(widgets.summary ?? []).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(widgets.summary ?? []).map((card) => (
              <div
                key={card.label}
                className={`rounded-lg border p-4 ${COLOR_MAP[card.color] ?? COLOR_MAP.blue}`}
              >
                <p className="text-xs font-medium uppercase tracking-wide opacity-70">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Budget meter (dept heads) */}
        {widgets.budget_meter && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cost Centre Budget — {widgets.budget_meter.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Spent: {widgets.budget_meter.used_fmt}</span>
                <span className={`font-semibold ${pctColor(widgets.budget_meter.pct)}`}>
                  {widgets.budget_meter.pct.toFixed(1)}% of {widgets.budget_meter.budget_fmt}
                </span>
              </div>
              <ProgressBar pct={widgets.budget_meter.pct} />
            </CardContent>
          </Card>
        )}

        {/* Finance: Tax MTD + trends */}
        {isFinance && widgets.tax_mtd && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tax Month-to-Date</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">VAT Collected</span>
                  <span className="font-semibold text-blue-600">{widgets.tax_mtd.vat_fmt}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">WHT Withheld</span>
                  <span className="font-semibold text-purple-600">{widgets.tax_mtd.wht_fmt}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-1">
                  {[
                    { href: "/finance/approvals", label: "Approval Queue" },
                    { href: "/finance/matching",  label: "Three-Way Match" },
                    { href: "/finance/payments",  label: "Payments" },
                    { href: "/finance/reconciliation", label: "Reconciliation" },
                    { href: "/finance/period-close",   label: "Period Close" },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors"
                    >
                      {l.label}
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Exec: Budget health table + CAPEX pipeline */}
        {isExec && widgets.budget_health && (
          <>
            {widgets.capex_pipeline_fmt && (
              <Card>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CAPEX Pipeline (pending)</p>
                    <p className="text-xl font-bold">{widgets.capex_pipeline_fmt}</p>
                  </div>
                  <Link href="/finance/reports?report_type=budget_vs_actual" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
                    View Report →
                  </Link>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Budget Health by Cost Centre</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {widgets.budget_health.map((row) => (
                    <div key={row.code} className="px-6 py-3 flex items-center gap-4">
                      <div className="w-12 text-xs font-mono text-muted-foreground">{row.code}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{row.name}</p>
                        <ProgressBar pct={row.pct} />
                      </div>
                      <div className={`text-sm font-semibold w-14 text-right ${pctColor(row.pct)}`}>
                        {row.pct.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground w-20 text-right">{row.budget_fmt}</div>
                    </div>
                  ))}
                  {widgets.budget_health.length === 0 && (
                    <p className="px-6 py-4 text-sm text-muted-foreground text-center">No cost centres with budgets set.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Spend trend chart */}
        {trendData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Spend Trend (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Spend trend bar chart showing monthly expenditure over 6 months">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 100_00).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(value) => [`₦${((typeof value === 'number' ? value : 0) / 100).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`, "Spend"]}
                  />
                  <Bar dataKey="kobo" fill={colors.primary} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff: recent requests */}
        {!isExec && !isFinance && (widgets.recent ?? []).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">My Recent Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {(widgets.recent ?? []).map((r) => (
                  <Link
                    key={r.id}
                    href={`/finance/requisitions/${r.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{r.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.request_id} · {r.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{r.amount_fmt}</span>
                      <Badge variant={STATUS_COLORS[r.status] as any ?? "secondary"} className="text-xs capitalize">
                        {r.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-6 py-3 border-t">
                <Link href="/finance/requisitions" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View all requests <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
