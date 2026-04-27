import { Link } from "@inertiajs/react";
import { CheckCircle2, XCircle, AlertTriangle, Clock, DollarSign, HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from "@/layouts/MainLayout";

const APPROVAL_TIERS = [
  { range: "< ₦100K",         roles: ["Line Manager"] },
  { range: "₦100K – ₦300K",   roles: ["Line Manager", "Department Head"] },
  { range: "₦300K – ₦1M",     roles: ["Line Manager", "Department Head", "Finance Director"] },
  { range: "₦1M – ₦3M",       roles: ["Line Manager", "Department Head", "Finance Director", "MD/Exec"] },
  { range: "> ₦3M or CAPEX > ₦1M", roles: ["Line Manager", "Dept Head", "Finance Director", "MD/Exec", "CEO/Board"] },
];

const DOS_DONTS = [
  { type: "do",   text: "Review the supporting documents before approving — check they match the description." },
  { type: "do",   text: "Leave a comment when rejecting explaining exactly what needs to change." },
  { type: "do",   text: "Check the requester's cost centre budget health before approving large requests." },
  { type: "do",   text: "Escalate to Finance if the request type seems unusual for the cost centre." },
  { type: "dont", text: "Don't approve requests you submitted yourself — the system will block this." },
  { type: "dont", text: "Don't approve incomplete or underdocumented requests without requesting more information." },
  { type: "dont", text: "Don't delay decisions — SLA breaches are monitored and reported to management." },
  { type: "dont", text: "Don't approve budget-exceeding requests without noting the budget override reason." },
];

const FAQ = [
  { q: "What happens if I reject a request?", a: "The requester is notified immediately. They can review the rejection comment and resubmit as a new request. The original request is closed as 'Rejected'." },
  { q: "Can I delegate my approvals when on leave?", a: "Contact Finance to arrange a temporary delegate. The system does not auto-delegate, so plan ahead for absences." },
  { q: "What is a 'Budget Override'?", a: "If a request would push a cost centre over its annual budget, the system flags it for CEO override. As an approver, you can still approve but the CEO must provide a documented reason before the request proceeds to payment." },
  { q: "How do I know which requests need my approval?", a: "You receive a notification for each new pending step. You can also see all pending approvals in Finance → Approvals Queue." },
  { q: "What is the SLA for approvals?", a: "Standard requests: 3 business days. Emergency requests: same day. Delays are reported on the Finance Dashboard and escalated to your line manager." },
];

export default function ApproversPage() {
  return (
    <MainLayout activePage="finance-help-approvers" title="Finance Help — Approvers">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/finance/dashboard" className="hover:text-foreground">Finance</Link>
            <span>/</span>
            <span>Help</span>
            <span>/</span>
            <span className="text-foreground">For Approvers</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Guide for Approvers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            How to review, approve, and reject finance requests effectively and within SLA.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap text-sm">
          <Link href="/finance/help/getting-started" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
            Guide for Staff →
          </Link>
          <Link href="/finance/help/finance-team" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
            Guide for Finance Team →
          </Link>
        </div>

        {/* How to approve */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How to Approve a Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="space-y-3">
              {[
                "Open Finance → Approvals Queue. You'll see all requests pending your decision.",
                "Click on a request to view the full details: description, amount, cost centre, account code, vendor, and supporting documents.",
                "Review the supporting documents — download and verify they match the description.",
                "Check the cost centre budget health indicator. If over 80%, add a note explaining why the spend is justified.",
                "Click Approve or Reject. For rejections, write a clear reason of at least 20 characters.",
                "You'll be notified when subsequent approval tiers complete or when payment is made.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Approval tiers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Approval Routing by Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {APPROVAL_TIERS.map((tier) => (
                <div key={tier.range} className="flex items-center gap-4">
                  <div className="w-40 text-xs font-mono text-muted-foreground shrink-0">{tier.range}</div>
                  <div className="flex flex-wrap gap-1">
                    {tier.roles.map((role, i) => (
                      <span key={role} className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">{role}</Badge>
                        {i < tier.roles.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              CAPEX requests always add at least one extra tier compared to OPEX at the same amount.
              Emergency requests follow standard OPEX tiers but are flagged for priority processing.
            </p>
          </CardContent>
        </Card>

        {/* Dos and Don'ts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dos and Don'ts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DOS_DONTS.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {item.type === "do"
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  }
                  <span className={item.type === "dont" ? "text-muted-foreground" : ""}>{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget override */}
        <Card className="border-amber-300 dark:border-amber-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Budget Override Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>When a request would push a cost centre to 100% of budget, the system automatically creates a special <strong>CEO Budget Override</strong> approval step at level 99.</p>
            <p>As the CEO, you will receive a notification and see a red banner in the Approvals Queue. You must provide a documented reason of at least 30 characters before the override is recorded.</p>
            <p className="text-muted-foreground text-xs">Override history is visible to Finance, CEO, and Superadmin in the Finance Dashboard (Exec view) and Finance Audit Log.</p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> FAQ for Approvers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="border-b last:border-b-0 pb-3 last:pb-0">
                <p className="text-sm font-medium">{item.q}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link
            href="/finance/approvals"
            className="inline-flex items-center gap-2 bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#185c3d] transition-colors"
          >
            <Clock className="w-4 h-4" /> Go to Approval Queue
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
