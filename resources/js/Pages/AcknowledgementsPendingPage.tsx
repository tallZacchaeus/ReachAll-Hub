import { router } from "@inertiajs/react";
import { CheckCircle, AlertTriangle, Calendar, ArrowRight, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MainLayout from "@/layouts/MainLayout";

interface PendingPolicy {
  id: number;
  title: string;
  slug: string;
  acknowledgement_deadline: string | null;
}

interface AcknowledgementsPendingPageProps {
  policies: PendingPolicy[];
}

export default function AcknowledgementsPendingPage({ policies }: AcknowledgementsPendingPageProps) {
  const today = new Date().toISOString().split("T")[0];

  const isOverdue = (deadline: string | null) =>
    deadline != null && deadline < today;

  const isDueSoon = (deadline: string | null) => {
    if (!deadline || isOverdue(deadline)) return false;
    const diff = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-brand" />
          Pending Acknowledgements
        </h1>
        <p className="text-muted-foreground">
          {policies.length === 0
            ? "You're all caught up — no pending acknowledgements."
            : `${policies.length} ${policies.length === 1 ? "policy requires" : "policies require"} your acknowledgement.`}
        </p>
      </div>

      {policies.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-foreground font-medium">All policies acknowledged</p>
          <p className="text-sm text-muted-foreground">
            You've acknowledged all required policies. Great work!
          </p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => router.visit("/content")}
          >
            Browse Content Library
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy) => {
            const overdue = isOverdue(policy.acknowledgement_deadline);
            const dueSoon = isDueSoon(policy.acknowledgement_deadline);

            return (
              <div
                key={policy.id}
                className={`bg-card border-2 rounded-xl p-5 flex items-start gap-4 transition-shadow hover:shadow-md ${
                  overdue
                    ? "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/10"
                    : dueSoon
                      ? "border-amber-200 dark:border-amber-800"
                      : "border-border"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    overdue
                      ? "bg-red-100 dark:bg-red-900/30"
                      : "bg-brand/10"
                  }`}
                >
                  {overdue ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-brand" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground mb-1">{policy.title}</p>
                  {policy.acknowledgement_deadline ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span
                        className={`text-xs ${
                          overdue
                            ? "text-red-500 font-medium"
                            : dueSoon
                              ? "text-amber-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {overdue ? "Overdue: " : "Due: "}
                        {policy.acknowledgement_deadline}
                      </span>
                      {overdue && (
                        <Badge
                          variant="outline"
                          className="text-xs border-red-300 text-red-500 ml-1"
                        >
                          Overdue
                        </Badge>
                      )}
                      {dueSoon && !overdue && (
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-300 text-amber-600 ml-1"
                        >
                          Due Soon
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No deadline set</span>
                  )}
                </div>

                <Button
                  size="sm"
                  className="bg-brand hover:bg-brand/90 text-white shrink-0"
                  onClick={() => router.visit(`/content/${policy.slug}`)}
                >
                  Read & Acknowledge
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

AcknowledgementsPendingPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
