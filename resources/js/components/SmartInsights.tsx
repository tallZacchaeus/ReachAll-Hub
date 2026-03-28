import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award, Users, Calendar } from "lucide-react";
import { motion } from "motion/react";

export function SmartInsights() {
  const insights = [
    {
      id: 1,
      icon: TrendingUp,
      color: "#1F6E4A",
      trend: "up",
      title: "Engagement increased by 12%",
      description: "Compared to last month",
    },
    {
      id: 2,
      icon: Calendar,
      color: "#1F6E4A",
      trend: "down",
      title: "Average lateness reduced by 9%",
      description: "Great improvement this month",
    },
    {
      id: 3,
      icon: Award,
      color: "#FFD400",
      trend: "neutral",
      title: "Most nominated: Culture Champion",
      description: "234 votes received",
    },
    {
      id: 4,
      icon: Users,
      color: "#1F6E4A",
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
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow w-80">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${insight.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: insight.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-[#1F2937] text-sm leading-tight">
                          {insight.title}
                        </h4>
                        {insight.trend !== "neutral" && (
                          <TrendIcon
                            className={`w-4 h-4 flex-shrink-0 ml-2 ${
                              insight.trend === "up" ? "text-[#1F6E4A]" : "text-[#ef4444]"
                            }`}
                          />
                        )}
                      </div>
                      <p className="text-xs text-[#6b7280]">{insight.description}</p>
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
