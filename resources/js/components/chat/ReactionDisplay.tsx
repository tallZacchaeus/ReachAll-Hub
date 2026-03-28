import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Reaction {
    emoji: string;
    count: number;
    users: string[];
    hasReacted: boolean;
}

interface ReactionDisplayProps {
    reactions: Reaction[];
    onReactionClick: (emoji: string) => void;
}

export function ReactionDisplay({ reactions, onReactionClick }: ReactionDisplayProps) {
    if (!reactions || reactions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {reactions.map((reaction) => (
                <TooltipProvider key={reaction.emoji}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge
                                variant="secondary"
                                className={`cursor-pointer transition-all hover:scale-105 ${reaction.hasReacted
                                        ? "bg-[#1F6E4A] text-white hover:bg-[#1a5a3d]"
                                        : "bg-muted text-foreground hover:bg-[#e5e7eb]"
                                    }`}
                                onClick={() => onReactionClick(reaction.emoji)}
                            >
                                <span className="text-sm">{reaction.emoji}</span>
                                <span className="ml-1 text-xs">{reaction.count}</span>
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{reaction.users.join(", ")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </div>
    );
}
