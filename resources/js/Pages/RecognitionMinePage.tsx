import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, Users, Lightbulb, Crown, Megaphone, ArrowLeft, ArrowRight } from "lucide-react";

interface RecognitionEntry {
  id: number;
  badge_type: string;
  message: string;
  created_at: string;
}

interface ReceivedEntry extends RecognitionEntry {
  sender: { name: string; department: string | null; initials: string };
}

interface SentEntry extends RecognitionEntry {
  receiver: { name: string; department: string | null; initials: string };
}

interface RecognitionMinePageProps {
  received: ReceivedEntry[];
  sent: SentEntry[];
}

const BADGE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; pill: string }
> = {
  shoutout:         { label: "Shout-out",     icon: Megaphone,  color: "text-blue-500",   pill: "bg-blue-100 text-blue-700 border-blue-200" },
  teamwork:         { label: "Teamwork",       icon: Users,      color: "text-[#1F6E4A]",  pill: "bg-green-100 text-green-700 border-green-200" },
  innovation:       { label: "Innovation",     icon: Lightbulb,  color: "text-amber-500",  pill: "bg-amber-100 text-amber-700 border-amber-200" },
  leadership:       { label: "Leadership",     icon: Crown,      color: "text-purple-500", pill: "bg-purple-100 text-purple-700 border-purple-200" },
  above_and_beyond: { label: "Above & Beyond", icon: Star,       color: "text-yellow-500", pill: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

export default function RecognitionMinePage({ received, sent }: RecognitionMinePageProps) {
  const renderCard = (r: RecognitionEntry, person: { name: string; department: string | null; initials: string }, direction: "from" | "to") => {
    const badge = BADGE_CONFIG[r.badge_type] ?? BADGE_CONFIG.shoutout;
    const BadgeIcon = badge.icon;
    return (
      <div key={r.id} className="bg-card border-2 border-border rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-[#1F6E4A] text-white text-xs">
              {person.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground leading-none">{person.name}</p>
            {person.department && (
              <p className="text-xs text-muted-foreground">{person.department}</p>
            )}
          </div>
          <Badge variant="outline" className={`text-xs shrink-0 ${badge.pill}`}>
            <BadgeIcon className="w-3 h-3 mr-1" />
            {badge.label}
          </Badge>
        </div>
        <p className="text-sm text-foreground leading-relaxed border-l-2 border-[#1F6E4A]/30 pl-3 italic">
          "{r.message}"
        </p>
        <p className="text-xs text-muted-foreground">{r.created_at}</p>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.visit("/recognition")}
          className="text-muted-foreground hover:text-foreground -ml-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Feed
        </Button>
        <h1 className="text-foreground flex items-center gap-3 mb-1">
          <Star className="w-8 h-8 text-[#FFD400]" />
          My Recognitions
        </h1>
      </div>

      {/* Received */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Received ({received.length})
          </h2>
        </div>
        {received.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No recognitions received yet.
          </p>
        ) : (
          received.map((r) => renderCard(r, r.sender, "from"))
        )}
      </div>

      <Separator />

      {/* Sent */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Given ({sent.length})
          </h2>
          <Button
            size="sm"
            className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white text-xs"
            onClick={() => router.visit("/recognition")}
          >
            Give Recognition
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
        {sent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            You haven't given any recognitions yet.
          </p>
        ) : (
          sent.map((r) => renderCard(r, r.receiver, "to"))
        )}
      </div>
    </div>
  );
}

RecognitionMinePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
