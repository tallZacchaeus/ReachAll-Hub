import { Smile } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface ReactionPickerProps {
    onReactionSelect: (emoji: string) => void;
}

const COMMON_EMOJIS = [
    "👍", "❤️", "😂", "😮", "😢", "🙏",
    "🎉", "🔥", "👏", "✅", "💯", "🚀"
];

export function ReactionPicker({ onReactionSelect }: ReactionPickerProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (emoji: string) => {
        onReactionSelect(emoji);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                    <Smile className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
                <div className="grid grid-cols-6 gap-1">
                    {COMMON_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleSelect(emoji)}
                            className="text-2xl p-2 hover:bg-muted rounded transition-colors"
                            title={emoji}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
