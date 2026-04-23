import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Users } from "lucide-react";
import { motion } from "motion/react";

export function DepartmentSpotlight() {
  const spotlights = [
    {
      department: "Marketing Team",
      achievement: "Led the punctuality chart this month!",
      metric: "98% attendance rate",
      icon: TrendingUp,
    },
    {
      department: "Tech Team",
      achievement: "Most engaged in chat discussions",
      metric: "450+ messages exchanged",
      icon: Users,
    },
    {
      department: "Sales Team",
      achievement: "Highest evaluation participation",
      metric: "100% voting completion",
      icon: Trophy,
    },
  ];

  // Rotate through departments
  const currentSpotlight = spotlights[Math.floor(Date.now() / 10000) % spotlights.length];

  return (
    <Card className="bg-gradient-to-br from-brand to-brand/90 text-white shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-40 h-40 bg-card opacity-5 rounded-full -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-card opacity-5 rounded-full -ml-16 -mb-16"></div>
      
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-brand-yellow" />
          <Badge className="bg-brand-yellow text-foreground hover:bg-brand-yellow">
            Department of the Month
          </Badge>
        </div>
        
        <motion.div
          key={currentSpotlight.department}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <currentSpotlight.icon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white mb-2">{currentSpotlight.department}</h3>
              <p className="text-white text-opacity-90 text-sm mb-3">
                {currentSpotlight.achievement}
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-yellow" />
                <span className="text-sm text-white text-opacity-90">
                  {currentSpotlight.metric}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-4 pt-4 border-t border-white border-opacity-20 flex items-center justify-between text-sm">
          <span className="text-white text-opacity-75">
            Great teamwork! Keep it up 🌟
          </span>
          <Users className="w-4 h-4 text-brand-yellow" />
        </div>
      </CardContent>
    </Card>
  );
}
