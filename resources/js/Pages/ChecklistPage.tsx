import { router } from "@inertiajs/react";
import { ListChecks, CheckCircle, Circle, ChevronDown, ChevronRight, Star } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import MainLayout from "@/layouts/MainLayout";

interface ChecklistItemData {
  id: number;
  title: string;
  description: string | null;
  sort_order: number;
  is_required: boolean;
  completed_at: string | null;
}

interface ChecklistData {
  id: number;
  template: {
    id: number;
    title: string;
    description: string | null;
  };
  completion_percentage: number;
  completed_count: number;
  total_count: number;
  items: ChecklistItemData[];
}

interface ChecklistPageProps {
  checklists: ChecklistData[];
}

function ChecklistCard({ checklist }: { checklist: ChecklistData }) {
  const [open, setOpen] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  const handleToggle = (itemId: number) => {
    setToggling(itemId);
    router.post(
      `/checklists/${itemId}/toggle`,
      {},
      {
        preserveScroll: true,
        onFinish: () => setToggling(null),
      },
    );
  };

  const allDone = checklist.completion_percentage === 100;

  return (
    <div
      className={`bg-card border-2 rounded-xl overflow-hidden shadow-sm ${
        allDone ? "border-green-300 dark:border-green-700" : "border-border"
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="shrink-0">
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h2 className="text-base font-semibold text-foreground">{checklist.template.title}</h2>
            {allDone && (
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>

          {checklist.template.description && (
            <p className="text-xs text-muted-foreground mb-2">{checklist.template.description}</p>
          )}

          <div className="flex items-center gap-3">
            <Progress value={checklist.completion_percentage} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground shrink-0 font-medium">
              {checklist.completed_count}/{checklist.total_count} tasks
              ({checklist.completion_percentage}%)
            </span>
          </div>
        </div>
      </button>

      {/* Items */}
      {open && (
        <div className="border-t border-border divide-y divide-border/60">
          {checklist.items.map((item) => {
            const isDone = !!item.completed_at;
            const isTogglingThis = toggling === item.id;

            return (
              <div
                key={item.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  isDone ? "bg-muted/20" : "hover:bg-muted/10"
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  disabled={isTogglingThis}
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isDone
                      ? "bg-brand border-brand"
                      : "border-muted-foreground/40 hover:border-brand"
                  } ${isTogglingThis ? "opacity-50" : ""}`}
                  title={isDone ? "Mark incomplete" : "Mark complete"}
                >
                  {isDone && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  {!isDone && <Circle className="w-3.5 h-3.5 text-transparent" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm font-medium ${
                        isDone
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.is_required && !isDone && (
                      <Star className="w-3 h-3 text-orange-400 shrink-0" aria-label="Required" />
                    )}
                    {isDone && item.completed_at && (
                      <span className="text-xs text-muted-foreground">
                        Done {item.completed_at}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ChecklistPage({ checklists }: ChecklistPageProps) {
  const overallCompleted = checklists.reduce((s, c) => s + c.completed_count, 0);
  const overallTotal = checklists.reduce((s, c) => s + c.total_count, 0);
  const overallPct = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-brand" />
          My Checklists
        </h1>
        {overallTotal > 0 && (
          <p className="text-muted-foreground">
            {overallCompleted} of {overallTotal} tasks complete — {overallPct}% overall
          </p>
        )}
      </div>

      {checklists.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <ListChecks className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No checklists assigned yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your onboarding checklists will appear here once assigned.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map((checklist) => (
            <ChecklistCard key={checklist.id} checklist={checklist} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pb-4">
        ★ Required items must be completed before the end of your onboarding period.
      </p>
    </div>
  );
}

ChecklistPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
