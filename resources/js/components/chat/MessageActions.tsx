import { MoreVertical, Edit2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageActionsProps {
    onEdit: () => void;
    onDelete: () => void;
}

export function MessageActions({ onEdit, onDelete }: MessageActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <MoreVertical className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit message
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={onDelete}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete message
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
