import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award, Users, Calendar } from "lucide-react";
import { motion } from "motion/react";

export function SmartInsights() {
  const insights = [
    {
      id: 1,
      icon: TrendingUp,
      colorVar: "var(--brand)",
      trend: "up",
      title: "Engagement increased by 12%",
      description: "Compared to last month",
    },
    {
      id: 2,
      icon: Calendar,
      colorVar: "var(--brand)",
      trend: "down",
      title: "Average lateness reduced by 9%",
      description: "Great improvement this month",
    },
    {
      id: 3,
      icon: Award,
      colorVar: "var(--brand-yellow)",
      trend: "neutral",
      title: "Most nominated: Culture Champion",
      description: "234 votes received",
    },
    {
      id: 4,
      icon: Users,
      colorVar: "var(--brand)",
      trend: "up",
      title: "Team participation up 15%",
      description: "More staff engaging in evaluations",
    },
  ];

  return (
    <div className="overflow-x-auto pb-2 -mx-8 px-8 scrollbar-hide">
      <div className="flex gap-4 min-w-max">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const TrendIcon = insight.trend === "up" ? TrendingUp : TrendingDown;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0"
            >
              <Card className="bg-card shadow-sm hover:shadow-md transition-shadow w-80">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand/10"
                    >
                      <Icon className="w-6 h-6" style={{ color: insight.colorVar }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-foreground text-sm leading-tight">
                          {insight.title}
                        </h4>
                        {insight.trend !== "neutral" && (
                          <TrendIcon
                            className={`w-4 h-4 flex-shrink-0 ml-2 ${
                              insight.trend === "up" ? "text-brand" : "text-destructive"
                            }`}
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
