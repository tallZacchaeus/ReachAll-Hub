import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, router } from "@inertiajs/react";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

interface Check {
  status: "pass" | "warn" | "fail";
  label: string;
  detail: string;
}

interface Props {
  checks: Check[];
  all_passed: boolean;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pass: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  warn: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  fail: <XCircle className="w-4 h-4 text-red-500" />,
};

const STATUS_ROW: Record<string, string> = {
  pass: "",
  warn: "bg-amber-50 dark:bg-amber-950/30",
  fail: "bg-red-50 dark:bg-red-950/30",
};

export default function GoLiveChecklistPage({ checks, all_passed }: Props) {
  const passed  = checks.filter((c) => c.status === "pass").length;
  const warned  = checks.filter((c) => c.status === "warn").length;
  const failed  = checks.filter((c) => c.status === "fail").length;

  return (
    <MainLayout activePage="finance-go-live" title="Go-Live Checklist">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Go-Live Checklist</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Superadmin only. Verifies all finance module components are functional and configured.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Re-run Checks
          </Button>
        </div>

        {/* Summary banner */}
        {all_passed ? (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">All {checks.length} checks passed</p>
              <p className="text-sm text-green-700 dark:text-green-300">The Finance module is ready for go-live.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              {passed} passed &nbsp;·&nbsp;
              {warned > 0 && <span className="text-amber-600">{warned} warnings &nbsp;·&nbsp;</span>}
              {failed > 0 && <span className="text-red-600">{failed} failures</span>}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
              Resolve all failures before deploying. Warnings are recommended but not blocking.
            </p>
          </div>
        )}

        {/* Checks */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {checks.map((check, i) => (
                <div key={i} className={`flex items-start gap-3 px-6 py-3 ${STATUS_ROW[check.status]}`}>
                  <span className="mt-0.5 shrink-0">{STATUS_ICON[check.status]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{check.label}</p>
                    {check.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{check.detail}</p>
                    )}
                  </div>
                  <Badge
                    variant={check.status === "pass" ? "default" : check.status === "warn" ? "outline" : "destructive"}
                    className="text-xs shrink-0"
                  >
                    {check.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deployment notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Deployment Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Before Go-Live</p>
              <ul className="mt-1 space-y-1 text-muted-foreground text-xs">
                <li>• Run <code className="bg-muted px-1 rounded">php artisan migrate --force</code> on production</li>
                <li>• Run <code className="bg-muted px-1 rounded">php artisan db:seed</code> for reference data (periods, codes, vendors)</li>
                <li>• Run <code className="bg-muted px-1 rounded">php artisan storage:link</code> for file uploads</li>
                <li>• Set queue driver to <code className="bg-muted px-1 rounded">database</code> or <code className="bg-muted px-1 rounded">redis</code> for background posting jobs</li>
                <li>• Configure mail/notification channel for production alerts</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Role Assignments</p>
              <ul className="mt-1 space-y-1 text-muted-foreground text-xs">
                <li>• Assign <code className="bg-muted px-1 rounded">finance</code> role to finance team members via Staff Enrollment</li>
                <li>• Assign <code className="bg-muted px-1 rounded">ceo</code> role to CEO for budget override and period close co-auth</li>
                <li>• Petty cash custodians need a float assigned by Finance Admin</li>
                <li>• Cost centre heads: assign <code className="bg-muted px-1 rounded">head_user_id</code> in cost centre admin</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Known Limitations</p>
              <ul className="mt-1 space-y-1 text-muted-foreground text-xs">
                <li>• Multi-currency: exchange rates must be entered manually — no live feed</li>
                <li>• Email notifications: only database channel active; configure SMTP for email delivery</li>
                <li>• Board approval flag: stored but no separate board workflow page yet</li>
                <li>• Bulk import of historical transactions: not yet available — manual entry required</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link
            href="/finance/dashboard"
            className="inline-flex items-center gap-2 bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#185c3d] transition-colors"
          >
            Go to Finance Dashboard
          </Link>
          <Link
            href="/finance/period-close"
            className="inline-flex items-center gap-2 border border-border rounded-lg px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            Period Close
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
