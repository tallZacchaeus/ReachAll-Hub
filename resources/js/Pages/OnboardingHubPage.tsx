import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ContentRenderer } from "@/components/ContentRenderer";
import {
  ListChecks,
  ScrollText,
  GraduationCap,
  Globe,
  Monitor,
  Briefcase,
  Sparkles,
  CheckCircle,
  MessageSquare,
} from "lucide-react";

interface OnboardingHubPageProps {
  userName: string;
  checklistPercentage: number;
  completedItems: number;
  totalItems: number;
  ceoWelcomeBody: string | null;
}

const QUICK_LINKS = [
  {
    icon: ListChecks,
    title: "First-Day Checklist",
    description: "Track your onboarding tasks step by step",
    href: "/checklists",
    color: "text-brand",
    bg: "bg-brand/10",
  },
  {
    icon: ScrollText,
    title: "Company Policies",
    description: "Read and acknowledge required policies",
    href: "/content?category=policies",
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    icon: GraduationCap,
    title: "Learning Hub",
    description: "Complete your mandatory onboarding courses",
    href: "/learning",
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    icon: Globe,
    title: "Employee Directory",
    description: "Meet your colleagues across all departments",
    href: "/directory",
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    icon: Monitor,
    title: "IT Setup Guide",
    description: "Get your tools, accounts and devices ready",
    href: "/content?category=it-setup",
    color: "text-cyan-500",
    bg: "bg-cyan-100 dark:bg-cyan-900/20",
  },
  {
    icon: Briefcase,
    title: "HR Essentials",
    description: "Leave, payroll, benefits and more",
    href: "/content?category=hr-essentials",
    color: "text-pink-500",
    bg: "bg-pink-100 dark:bg-pink-900/20",
  },
];

export default function OnboardingHubPage({
  userName,
  checklistPercentage,
  completedItems,
  totalItems,
  ceoWelcomeBody,
}: OnboardingHubPageProps) {
  const firstName = userName.split(" ")[0] || "there";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="bg-card border-2 border-brand rounded-2xl p-8 shadow-sm">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-brand-yellow" />
              <Badge className="bg-brand-yellow/20 text-brand border-0">New Joiner</Badge>
            </div>
            <h1 className="text-foreground mb-2 text-2xl sm:text-3xl font-bold">
              Welcome to the team, {firstName}!
            </h1>
            <p className="text-muted-foreground text-base max-w-lg">
              Everything you need to get started is right here. Take it one step at a time —
              we're thrilled to have you on board.
            </p>
          </div>
          <div className="w-20 h-20 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-10 h-10 text-brand" />
          </div>
        </div>
      </div>

      {/* Progress + CEO message */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Onboarding progress */}
        <Card className="lg:col-span-2 border-2 border-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-brand" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Your Onboarding Progress</h2>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {completedItems} of {totalItems} tasks complete
                </span>
                <span className="font-semibold text-foreground">{checklistPercentage}%</span>
              </div>
              <Progress value={checklistPercentage} className="h-3" />
            </div>

            {checklistPercentage === 100 ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  All tasks complete — great work!
                </p>
              </div>
            ) : totalItems === 0 ? (
              <p className="text-xs text-muted-foreground text-center pt-1">
                No checklists assigned yet. Check back soon.
              </p>
            ) : (
              <button
                onClick={() => router.visit("/checklists")}
                className="w-full text-sm text-brand hover:underline font-medium text-left"
              >
                Continue onboarding checklist →
              </button>
            )}
          </CardContent>
        </Card>

        {/* CEO welcome */}
        <Card className="lg:col-span-3 border-2 border-border shadow-sm">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-brand-yellow" />
              </div>
              <h2 className="text-base font-semibold text-foreground">A Message from Leadership</h2>
            </div>

            {ceoWelcomeBody ? (
              <div className="max-h-48 overflow-y-auto">
                <ContentRenderer content={ceoWelcomeBody} />
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground space-y-2">
                <p className="text-sm italic">
                  CEO welcome message will appear here.
                </p>
                <p className="text-xs">
                  Create a content page with slug{" "}
                  <code className="bg-muted px-1 rounded text-xs">ceo-welcome</code> to
                  populate this area.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-foreground font-semibold text-lg mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                onClick={() => router.visit(link.href)}
                className="text-left bg-card border-2 border-border rounded-xl p-5 hover:border-brand hover:shadow-md transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${link.bg}`}
                >
                  <Icon className={`w-5 h-5 ${link.color}`} />
                </div>
                <p className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors mb-1">
                  {link.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{link.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

OnboardingHubPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
