import { File, Image, Video, Music, FileText, Download } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AttachmentDisplayProps {
    attachment: {
        path: string;
        name: string;
        type: string;
        size: number;
    };
}

export function AttachmentDisplay({ attachment }: AttachmentDisplayProps) {
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFileIcon = () => {
        switch (attachment.type) {
            case 'image':
                return <Image className="w-5 h-5" />;
            case 'video':
                return <Video className="w-5 h-5" />;
            case 'audio':
                return <Music className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const renderAttachment = () => {
        // Image preview
        if (attachment.type === 'image') {
            return (
                <div className="mt-2">
                    <a href={attachment.path} target="_blank" rel="noopener noreferrer">
                        <img
                            src={attachment.path}
                            alt={attachment.name}
                            className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        />
                    </a>
                </div>
            );
        }

        // Video preview
        if (attachment.type === 'video') {
            return (
                <div className="mt-2">
                    <video
                        src={attachment.path}
                        controls
                        className="max-w-xs max-h-64 rounded-lg"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        // Audio preview
        if (attachment.type === 'audio') {
            return (
                <div className="mt-2">
                    <audio src={attachment.path} controls className="w-full max-w-xs">
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            );
        }

        // File download card
        return (
            <div className="mt-2 flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-white/20 max-w-xs">
                <div className="text-brand">{getFileIcon()}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs opacity-75">{formatFileSize(attachment.size)}</p>
                </div>
                <a
                    href={attachment.path}
                    download={attachment.name}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-white/20"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                </a>
            </div>
        );
    };

    return <>{renderAttachment()}</>;
}
