import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Calendar, MessageSquare, Star, Trophy, Zap, Target, Heart, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  earned: boolean;
  earnedDate?: string;
}

interface BadgesDisplayProps {
  badges: BadgeData[];
  compact?: boolean;
}

export function BadgesDisplay({ badges, compact = false }: BadgesDisplayProps) {
  if (compact) {
    // Compact view for profile cards
    const earnedBadges = badges.filter(b => b.earned).slice(0, 3);
    
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {earnedBadges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                style={{ 
                  backgroundColor: badge.bgColor,
                  boxShadow: `0 0 10px ${badge.color}40`
                }}
              >
                <Icon className="w-4 h-4" style={{ color: badge.color }} />
              </div>
            </motion.div>
          );
        })}
        {badges.filter(b => b.earned).length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{badges.filter(b => b.earned).length - 3} more
          </span>
        )}
      </div>
    );
  }

  // Full view for badge gallery
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={`relative overflow-hidden transition-all ${
                badge.earned 
                  ? 'border-2 hover:shadow-lg cursor-pointer' 
                  : 'border-2 border-dashed opacity-50'
              }`}
              style={{ 
                borderColor: badge.earned ? badge.color : '#e5e7eb',
                backgroundColor: badge.earned ? badge.bgColor : '#f9fafb'
              }}
            >
              <CardContent className="p-4 text-center">
                {badge.earned && (
                  <div 
                    className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full opacity-20"
                    style={{ backgroundColor: badge.color }}
                  />
                )}
                <div 
                  className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center shadow-md relative"
                  style={{ 
                    backgroundColor: badge.earned ? badge.bgColor : '#f3f4f6',
                    boxShadow: badge.earned ? `0 0 20px ${badge.color}30` : 'none'
                  }}
                >
                  <Icon 
                    className="w-8 h-8" 
                    style={{ color: badge.earned ? badge.color : '#9ca3af' }} 
                  />
                  {badge.earned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-brand rounded-full flex items-center justify-center"
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
                <h4 className="text-sm text-foreground mb-1">{badge.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                {badge.earned && badge.earnedDate && (
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: badge.color, color: badge.color }}
                  >
                    {badge.earnedDate}
                  </Badge>
                )}
                {!badge.earned && (
                  <Badge variant="outline" className="text-xs border-border text-[#9ca3af]">
                    Not earned
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// Predefined badge definitions
export const DEFAULT_BADGES: BadgeData[] = [
  {
    id: "punctual-pro",
    name: "Punctual Pro",
    description: "100% attendance in a month",
    icon: Calendar,
    color: "var(--brand)",
    bgColor: "var(--brand-subtle)",
    earned: false,
  },
  {
    id: "active-voice",
    name: "Active Voice",
    description: "Regular chat participation",
    icon: MessageSquare,
    color: "var(--brand-yellow)",
    bgColor: "#fffbeb",
    earned: false,
  },
  {
    id: "culture-star",
    name: "Culture Star",
    description: "Multiple culture nominations",
    icon: Star,
    color: "#f59e0b",
    bgColor: "#fff7ed",
    earned: false,
  },
  {
    id: "top-performer",
    name: "Top Performer",
    description: "Top 3 in leaderboard",
    icon: Trophy,
    color: "var(--brand-yellow)",
    bgColor: "#fffbeb",
    earned: false,
  },
  {
    id: "innovation-champion",
    name: "Innovation Champion",
    description: "Won innovation award",
    icon: Zap,
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
    earned: false,
  },
  {
    id: "task-master",
    name: "Task Master",
    description: "Completed 50+ tasks",
    icon: Target,
    color: "#ef4444",
    bgColor: "#fef2f2",
    earned: false,
  },
  {
    id: "team-player",
    name: "Team Player",
    description: "Helped colleagues 20+ times",
    icon: Heart,
    color: "#ec4899",
    bgColor: "#fdf2f8",
    earned: false,
  },
  {
    id: "rising-star",
    name: "Rising Star",
    description: "Biggest rank improvement",
    icon: Sparkles,
    color: "#06b6d4",
    bgColor: "#ecfeff",
    earned: false,
  },
];
