import { router } from "@inertiajs/react";
import { Search, ExternalLink, Users, FileText, HelpCircle, Newspaper, Radio, BookOpen, CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MainLayout from "@/layouts/MainLayout";

interface SearchItem {
  id: number;
  title: string;
  excerpt: string;
  url: string;
  badge: string;
}

interface ResultGroup {
  type: string;
  items: SearchItem[];
}

interface SearchResultsPageProps {
  query: string;
  results: ResultGroup[];
  totalCount: number;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  People: Users,
  Content: FileText,
  FAQs: HelpCircle,
  Newsletters: Newspaper,
  Bulletins: Radio,
  Courses: BookOpen,
  Tasks: CheckSquare,
};

const typeColors: Record<string, string> = {
  People: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Content: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  FAQs: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Newsletters: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Bulletins: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Courses: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Tasks: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function SearchResultsPage({ query = "", results = [], totalCount = 0 }: SearchResultsPageProps) {
  const [search, setSearch] = useState(query);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => {
      router.visit("/search", {
        data: { q: value },
        preserveState: true,
        replace: true,
      });
    }, 350);
    setTimer(t);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground mb-1">Search</h1>
          {query && (
            <p className="text-sm text-muted-foreground">
              {totalCount} result{totalCount !== 1 ? "s" : ""} for "{query}"
            </p>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search everything…"
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Results */}
        {query.length < 2 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Type at least 2 characters to search</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-foreground mb-1">No results found</p>
            <p className="text-sm">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <div className="space-y-8">
            {results.map((group) => {
              const Icon = typeIcons[group.type] ?? FileText;
              const color = typeColors[group.type] ?? "bg-muted text-muted-foreground";
              return (
                <div key={group.type}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{group.type}</span>
                    <span className="text-xs text-muted-foreground">({group.items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => router.visit(item.url)}
                        className="w-full text-left p-4 border border-border rounded-lg bg-card hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-brand transition-colors">
                                {highlightText(item.title, query)}
                              </p>
                              {item.badge && (
                                <Badge className={`text-xs shrink-0 ${color}`} variant="secondary">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            {item.excerpt && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {highlightText(item.excerpt, query)}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

SearchResultsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
