import { router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Star,
  Users,
  Lightbulb,
  Crown,
  Megaphone,
  ArrowRight,
} from "lucide-react";

export interface RecentRecognition {
  id: number;
  badge_type: string;
  message: string;
  created_at: string;
  sender_name: string;
  sender_initials: string;
}

interface RecognitionWidgetProps {
  recentRecognitions: RecentRecognition[];
  receivedThisMonth: number;
}

const BADGE_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  shoutout:        { icon: Megaphone,  color: "text-blue-500",   label: "Shout-out" },
  teamwork:        { icon: Users,      color: "text-[#1F6E4A]",  label: "Teamwork" },
  innovation:      { icon: Lightbulb,  color: "text-amber-500",  label: "Innovation" },
  leadership:      { icon: Crown,      color: "text-purple-500", label: "Leadership" },
  above_and_beyond:{ icon: Star,       color: "text-[#FFD400]",  label: "Above & Beyond" },
};

export function RecognitionWidget({ recentRecognitions, receivedThisMonth }: RecognitionWidgetProps) {
  return (
    <Card className="bg-card border-2 border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Star className="w-4 h-4 text-[#FFD400]" />
            Recognition
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.visit("/recognition")}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
          >
            View All
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        {receivedThisMonth > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            You've received{" "}
            <span className="font-semibold text-[#1F6E4A]">{receivedThisMonth}</span>{" "}
            recognition{receivedThisMonth !== 1 ? "s" : ""} this month
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {recentRecognitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Star className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground">No recognitions yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => router.visit("/recognition")}
            >
              Give recognition
            </Button>
          </div>
        ) : (
          recentRecognitions.map((r) => {
            const badge = BADGE_ICONS[r.badge_type] ?? BADGE_ICONS.shoutout;
            const BadgeIcon = badge.icon;
            return (
              <div key={r.id} className="flex items-start gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-[#1F6E4A] text-white text-xs">
                    {r.sender_initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <BadgeIcon className={`w-3.5 h-3.5 shrink-0 ${badge.color}`} />
                    <span className="text-xs font-medium text-foreground truncate">
                      {r.sender_name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">· {badge.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {r.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{r.created_at}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
