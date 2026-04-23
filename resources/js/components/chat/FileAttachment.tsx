import { useState, useRef } from "react";
import { Paperclip, X, File, Image, Video, Music, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FileAttachmentButtonProps {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
}

export function FileAttachmentButton({ onFileSelect, disabled = false }: FileAttachmentButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            // Reset input so same file can be selected again
            e.target.value = '';
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
            />
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                            <Paperclip className="w-5 h-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Attach file (max 10MB)</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </>
    );
}

interface FilePreviewProps {
    file: File;
    onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFileIcon = () => {
        const type = file.type;
        if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
        if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
        if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
        if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
        return <File className="w-5 h-5" />;
    };

    return (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border">
            <div className="text-brand">{getFileIcon()}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            >
                <X className="w-4 h-4" />
            </Button>
        </div>
    );
}
