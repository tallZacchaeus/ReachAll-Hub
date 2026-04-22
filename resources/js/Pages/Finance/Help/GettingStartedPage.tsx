import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@inertiajs/react";
import { FileText, CheckCircle2, Clock, ArrowRight, HelpCircle } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Submit Your Request",
    desc: "Go to Finance → My Requests → New Request. Fill in the type (OPEX/CAPEX/EMERG), amount, cost centre, account code, and a clear description of at least 20 characters.",
    tips: [
      "OPEX = day-to-day running costs (stationery, subscriptions, maintenance).",
      "CAPEX = asset purchases or investments (equipment, vehicles, renovations).",
      "EMERG = urgent, unplanned needs that cannot wait for normal processing.",
      "Attach at least one supporting document (quote, invoice, or justification note).",
    ],
  },
  {
    number: "02",
    title: "Your Request Goes to Approval",
    desc: "Once submitted, the system automatically routes your request to the correct approvers based on the amount and type. You'll see the status change to 'Approving'.",
    tips: [
      "Amounts under ₦100K: Line Manager only.",
      "₦100K–₦1M: Line Manager + Department Head.",
      "Over ₦1M: adds Finance Director, and MD/CEO for very large amounts.",
      "You'll receive a notification for each approval decision.",
    ],
  },
  {
    number: "03",
    title: "Approved → Payment",
    desc: "When all approvers have approved, your request moves to 'Approved'. For requests ≥ ₦500K, Finance will first do a three-way match (verifying the invoice and goods receipt). Then payment is recorded.",
    tips: [
      "Requests under ₦500K can be paid directly from the 'Approved' state.",
      "Requests ≥ ₦500K require invoice upload and goods receipt confirmation first.",
      "Once paid, the request moves to 'Paid', then 'Posted' once the ledger entry is finalised.",
    ],
  },
  {
    number: "04",
    title: "Track Your Requests",
    desc: "Visit Finance → My Requests at any time to see the full status of all your requests. You can also see approval steps and comments on each request's detail page.",
    tips: [
      "Use the Finance Dashboard for a summary of your activity.",
      "Rejected requests can be resubmitted as a new request with the issues addressed.",
      "You cannot cancel a request that is already in the approval flow — contact Finance.",
    ],
  },
];

const FAQ = [
  {
    q: "How long does approval take?",
    a: "Standard OPEX requests: 1–3 business days. CAPEX and large amounts may take longer due to additional approval tiers. Emergency requests are flagged for urgent processing.",
  },
  {
    q: "What is a 'cost centre' and which should I use?",
    a: "A cost centre is a department or activity category that tracks where money is spent. Select the cost centre that best represents your department or the project the expense relates to. If unsure, check with your line manager or Finance.",
  },
  {
    q: "What is an 'account code'?",
    a: "Account codes categorise the type of expense (e.g., travel, IT, personnel). Choosing the right code helps Finance track spending by category and apply the correct tax rules.",
  },
  {
    q: "My request was rejected — what now?",
    a: "Review the rejection comment (visible on the request detail page). Address the issue and submit a new request. Common reasons: insufficient description, wrong cost centre, missing documentation.",
  },
  {
    q: "Can I submit in a foreign currency?",
    a: "Yes. Select the appropriate currency and enter the exchange rate. The system will convert to NGN for budget tracking purposes.",
  },
];

export default function GettingStartedPage() {
  return (
    <MainLayout activePage="finance-help-getting-started" title="Finance Help — Getting Started">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/finance/dashboard" className="hover:text-foreground">Finance</Link>
            <span>/</span>
            <span>Help</span>
            <span>/</span>
            <span className="text-foreground">Getting Started</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Getting Started with Finance Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A step-by-step guide for staff on how to submit, track, and understand finance requisitions.
          </p>
        </div>

        {/* Quick nav */}
        <div className="flex gap-3 flex-wrap text-sm">
          <Link href="/finance/help/approvers" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
            Guide for Approvers →
          </Link>
          <Link href="/finance/help/finance-team" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
            Guide for Finance Team →
          </Link>
        </div>

        {/* Step-by-step */}
        <div className="space-y-4">
          {STEPS.map((step) => (
            <Card key={step.number}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#1F6E4A] text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {step.number}
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                <ul className="space-y-1">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status reference */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Request Status Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { status: "draft",     color: "secondary", desc: "Saved but not yet submitted" },
                { status: "submitted", color: "outline",   desc: "Submitted, awaiting review" },
                { status: "approving", color: "outline",   desc: "Moving through approval chain" },
                { status: "approved",  color: "default",   desc: "All approvals received" },
                { status: "matched",   color: "default",   desc: "Invoice & receipt verified" },
                { status: "paid",      color: "default",   desc: "Payment recorded" },
                { status: "posted",    color: "default",   desc: "Posted to ledger — complete" },
                { status: "rejected",  color: "destructive", desc: "Rejected — see comments" },
                { status: "cancelled", color: "secondary", desc: "Withdrawn by requester" },
              ].map((s) => (
                <div key={s.status} className="flex items-start gap-2">
                  <Badge variant={s.color as any} className="capitalize text-xs shrink-0 mt-0.5">{s.status}</Badge>
                  <span className="text-xs text-muted-foreground">{s.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
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

        {/* CTA */}
        <div className="flex gap-3">
          <Link
            href="/finance/requisitions/create"
            className="inline-flex items-center gap-2 bg-[#1F6E4A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#185c3d] transition-colors"
          >
            <FileText className="w-4 h-4" /> Submit Your First Request
          </Link>
          <Link
            href="/finance/requisitions"
            className="inline-flex items-center gap-2 border border-border rounded-lg px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Clock className="w-4 h-4" /> View My Requests
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
