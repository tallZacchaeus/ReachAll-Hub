import { router } from "@inertiajs/react";
import { ClipboardCheck, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MainLayout from "@/layouts/MainLayout";

interface Custodian {
  name: string;
  department: string;
}

interface FloatSummary {
  limit_fmt: string;
  balance_fmt: string;
}

interface Reconciliation {
  id: number;
  period_start: string;
  period_end: string;
  total_fmt: string;
  total_kobo: number;
  status: string;
  submitted_at: string;
  transaction_count: number;
  custodian: Custodian;
  float: FloatSummary;
}

interface ReconciliationListPageProps {
  reconciliations: Reconciliation[];
}

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  submitted: { label: "Pending Review", cls: "bg-amber-100 text-amber-700",   icon: Clock },
  approved:  { label: "Approved",       cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejected:  { label: "Rejected",       cls: "bg-red-100 text-red-700",        icon: XCircle },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReconciliationListPage({ reconciliations }: ReconciliationListPageProps) {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Petty Cash Reconciliations</h1>
        <p className="text-sm text-muted-foreground">Review and approve custodian reconciliation submissions</p>
      </div>

      {reconciliations.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No pending reconciliations</p>
          <p className="text-sm mt-1">All submissions have been reviewed.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {["Custodian", "Period", "Transactions", "Total Expenses", "Submitted", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {reconciliations.map((r) => {
                const st = STATUS_STYLES[r.status] ?? STATUS_STYLES.submitted;
                const Icon = st.icon;
                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.custodian.name}</p>
                      <p className="text-xs text-muted-foreground">{r.custodian.department}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.period_start} → {r.period_end}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold">{r.transaction_count}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.total_fmt}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDate(r.submitted_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                        <Icon className="w-3 h-3" />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.visit(`/finance/reconciliation/${r.id}`)}
                      >
                        Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

ReconciliationListPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
