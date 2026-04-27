import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface EditMessageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentContent: string;
    onSave: (newContent: string) => void;
    isSaving?: boolean;
}

export function EditMessageModal({
    open,
    onOpenChange,
    currentContent,
    onSave,
    isSaving = false,
}: EditMessageModalProps) {
    const [content, setContent] = useState(currentContent);

    useEffect(() => {
        setContent(currentContent);
    }, [currentContent, open]);

    const handleSave = () => {
        if (content.trim() && content !== currentContent) {
            onSave(content);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Edit Message</DialogTitle>
                    <DialogDescription>
                        Make changes to your message. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type your message..."
                        className="min-h-[100px]"
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!content.trim() || content === currentContent || isSaving}
                        className="bg-brand hover:bg-brand/90 text-white"
                    >
                        {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
