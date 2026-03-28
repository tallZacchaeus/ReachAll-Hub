import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResult {
    id: number;
    sender: string;
    content: string;
    timestamp: string;
    created_at: string;
}

interface SearchInterfaceProps {
    onSearch: (query: string) => void;
    results: SearchResult[];
    isSearching: boolean;
    onResultClick: (messageId: number) => void;
    onClose: () => void;
}

export function SearchInterface({
    onSearch,
    results,
    isSearching,
    onResultClick,
    onClose,
}: SearchInterfaceProps) {
    const [query, setQuery] = useState("");

    const handleSearch = (value: string) => {
        setQuery(value);
        if (value.length >= 2) {
            onSearch(value);
        }
    };

    const handleClear = () => {
        setQuery("");
        onClose();
    };

    return (
        <div className="border-b border-[#e5e7eb] bg-white">
            <div className="p-3 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                    <Input
                        placeholder="Search messages..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9 pr-9"
                        autoFocus
                    />
                    {query && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={handleClear}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {query.length >= 2 && (
                <div className="border-t border-[#e5e7eb]">
                    {isSearching ? (
                        <div className="p-4 text-center text-[#6b7280] text-sm">
                            Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <ScrollArea className="h-[200px]">
                            <div className="p-2">
                                {results.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => onResultClick(result.id)}
                                        className="w-full text-left p-3 hover:bg-[#F5F7F8] rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-[#1F2937]">
                                                {result.sender}
                                            </span>
                                            <span className="text-xs text-[#6b7280]">
                                                {result.timestamp}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#6b7280] line-clamp-2">
                                            {result.content}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="p-4 text-center text-[#6b7280] text-sm">
                            No messages found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
