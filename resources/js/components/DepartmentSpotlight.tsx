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
      icon: "📈",
      color: "#1F6E4A",
    },
    {
      department: "Tech Team",
      achievement: "Most engaged in chat discussions",
      metric: "450+ messages exchanged",
      icon: "💬",
      color: "#FFD400",
    },
    {
      department: "Sales Team",
      achievement: "Highest evaluation participation",
      metric: "100% voting completion",
      icon: "🗳️",
      color: "#1F6E4A",
    },
  ];

  // Rotate through departments
  const currentSpotlight = spotlights[Math.floor(Date.now() / 10000) % spotlights.length];

  return (
    <Card className="bg-gradient-to-br from-[#1F6E4A] to-[#165938] text-white shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>
      
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-[#FFD400]" />
          <Badge className="bg-[#FFD400] text-[#1F2937] hover:bg-[#FFD400]">
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
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
              {currentSpotlight.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-white mb-2">{currentSpotlight.department}</h3>
              <p className="text-white text-opacity-90 text-sm mb-3">
                {currentSpotlight.achievement}
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FFD400]" />
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
          <Users className="w-4 h-4 text-[#FFD400]" />
        </div>
      </CardContent>
    </Card>
  );
}
