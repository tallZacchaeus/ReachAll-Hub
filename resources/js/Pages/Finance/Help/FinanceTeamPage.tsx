import { Link } from "@inertiajs/react";
import {
  CheckCircle2, AlertTriangle, FileText, GitBranch,
  Wallet, Lock, BarChart3, HelpCircle, ArrowRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from "@/layouts/MainLayout";

const WORKFLOW_STEPS = [
  {
    icon: FileText,
    title: "1. Requisition Submission",
    desc: "Staff submit requisitions via Finance → My Requests → New Request. The system auto-routes to approvers based on amount and type. Finance receives visibility on all submissions.",
    actions: ["Monitor the Approvals Queue for validation exceptions", "Ensure cost centres and account codes are correct before approving"],
  },
  {
    icon: CheckCircle2,
    title: "2. Approval Flow",
    desc: "Multi-tier approval chain: Line Manager → Dept Head → Finance Director → Exec. Finance Director (or Finance role) is in the chain for amounts ≥ ₦300K.",
    actions: ["Approve or reject at your tier with a clear comment", "Budget enforcement runs automatically — 80/90/100% thresholds trigger alerts"],
  },
  {
    icon: GitBranch,
    title: "3. Three-Way Match (≥ ₦500K)",
    desc: "For requisitions ≥ ₦500K, Finance must upload the vendor invoice and confirm goods receipt. The system checks vendor consistency and amount tolerance (±₦1,000).",
    actions: [
      "Go to Finance → Three-Way Match for the pending queue",
      "Upload invoice: enter invoice number, amount, date, and upload PDF",
      "Upload goods receipt: note, date, and upload delivery confirmation",
      "Click Match — system flags VARIANCE or VENDOR_MISMATCH automatically",
      "For variances, CEO must accept with ≥30 char documented reason",
    ],
  },
  {
    icon: Wallet,
    title: "4. Payment Recording",
    desc: "Once matched (or approved for <₦500K), Finance records payment in Finance → Payments.",
    actions: [
      "Select payment method: Bank Transfer / Cheque / Cash",
      "Enter transaction reference number and payment date",
      "Upload proof of payment (bank receipt or cheque scan)",
      "Net payable = Gross + VAT − WHT (computed automatically)",
    ],
  },
  {
    icon: CheckCircle2,
    title: "5. Ledger Posting",
    desc: "The PostLedgerEntry job runs automatically after payment. It creates double-entry bookkeeping records, records WHT liabilities, and marks the requisition as 'Posted'.",
    actions: [
      "Monitor for any failed postings in the system log",
      "WHT liabilities accumulate in the ledger for remittance reporting",
    ],
  },
  {
    icon: Lock,
    title: "6. Period Close",
    desc: "At month-end, Finance initiates the close via Finance → Period Close. The pre-close checklist must be resolved or waived. CEO provides second authorisation; Finance finalises.",
    actions: [
      "Resolve all unreconciled petty cash floats before initiating close",
      "Waive any unpaid-but-acceptable items with documented reasons",
      "Period close requires: Finance initiation + CEO/Superadmin co-authorisation",
      "Close report PDF is auto-generated and stored",
    ],
  },
];

const PETTY_CASH = [
  "Each float has: daily cap (₦20K default), single-expense cap (₦20K), weekly cap (₦50K), reconciliation due date.",
  "Custodians log expenses via Finance → My Float → Log Expense.",
  "Reconciliation must be submitted before the due date (typically monthly).",
  "Finance approves reconciliation and the float is automatically replenished to its starting balance.",
  "Low-float alerts fire when balance < 20% of initial — visible on the Finance Dashboard.",
];

const KEY_REPORTS = [
  { name: "Budget vs Actual",      desc: "Cost centre budget utilisation — key for month-end review and exec reporting." },
  { name: "Spend by Cost Centre",  desc: "Drill into where money is being spent across the organisation." },
  { name: "Tax Summary",           desc: "VAT collected and WHT withheld MTD/YTD — required for tax filings." },
  { name: "Approval Throughput",   desc: "Days from submission to decision — identifies bottlenecks in the approval chain." },
  { name: "Full Transaction Listing", desc: "All fields for every requisition — use for audit and reconciliation." },
];

export default function FinanceTeamPage() {
  return (
    <MainLayout activePage="finance-help-finance-team" title="Finance Help — Finance Team">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/finance/dashboard" className="hover:text-foreground">Finance</Link>
            <span>/</span>
            <span>Help</span>
            <span>/</span>
            <span className="text-foreground">For Finance Team</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Full Finance Workflow Guide</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive documentation for the Finance team covering the full requisition-to-posting workflow,
            petty cash management, reporting, and period close.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap text-sm">
          <Link href="/finance/help/getting-started" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
            Guide for Staff →
          </Link>
          <Link href="/finance/help/approvers" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
            Guide for Approvers →
          </Link>
        </div>

        {/* Main workflow */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Requisition Lifecycle</h2>
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className="w-4 h-4 text-brand" />
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                  <ul className="space-y-1">
                    {step.actions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Petty Cash */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Petty Cash Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PETTY_CASH.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                {item}
              </div>
            ))}
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Period Close Blocker
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Any float without an approved reconciliation for the period will appear in the pre-close checklist.
                It must be reconciled or explicitly waived (with reason) before the period can be closed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Reporting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Access Finance → Reports to generate, preview, and export any of the five standard reports.
              All reports respect data-access levels — staff only see their own cost centres.
            </p>
            <div className="space-y-2">
              {KEY_REPORTS.map((r) => (
                <div key={r.name} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{r.name}</Badge>
                  <span className="text-muted-foreground">{r.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Export to Excel for accounting software integration (compatible column structure) or PDF for record-keeping.
            </p>
          </CardContent>
        </Card>

        {/* Tax guidance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tax Handling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>VAT (7.5%):</strong> Applied to account codes flagged as VAT-applicable. Added to gross amount. Reported in Tax Summary report.</p>
            <p><strong>WHT (Withholding Tax):</strong> Rate set per account code (commonly 5% or 10%). Deducted from gross on payment. Creates a WHT liability entry in the ledger for remittance.</p>
            <p><strong>Formula:</strong> Net Payable = Gross + VAT − WHT</p>
            <p className="text-muted-foreground text-xs">
              Tax is recomputed on payment recording in case the account code changed since submission.
              WHT liabilities accumulate and should be reviewed monthly for FIRS remittance.
            </p>
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: "/finance/approvals",     label: "Approvals Queue" },
            { href: "/finance/matching",       label: "Three-Way Match" },
            { href: "/finance/payments",       label: "Payments" },
            { href: "/finance/reconciliation", label: "Petty Cash Reconciliation" },
            { href: "/finance/period-close",   label: "Period Close" },
            { href: "/finance/reports",        label: "Reports" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="p-3 border rounded-lg text-sm font-medium hover:border-primary hover:bg-muted transition-colors flex items-center gap-2"
            >
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
