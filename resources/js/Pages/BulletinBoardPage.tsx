import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Pin, Calendar, User } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

interface BulletinItem {
  id: number;
  title: string;
  body: string;
  priority: "info" | "important" | "urgent";
  is_pinned: boolean;
  expires_at: string | null;
  author: string;
  published_at: string | null;
}

interface PaginatedBulletins {
  data: BulletinItem[];
  current_page: number;
  last_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface BulletinBoardPageProps {
  bulletins: PaginatedBulletins;
}

const PRIORITY_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  urgent: {
    label: "Urgent",
    className:
      "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30",
  },
  important: {
    label: "Important",
    className:
      "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  },
  info: {
    label: "Info",
    className:
      "border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  },
};

const PRIORITY_BORDER: Record<string, string> = {
  urgent: "border-l-4 border-l-red-500",
  important: "border-l-4 border-l-amber-500",
  info: "border-l-4 border-l-blue-500",
};

export default function BulletinBoardPage({ bulletins }: BulletinBoardPageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-[#1F6E4A]" />
          News &amp; Bulletins
        </h1>
        <p className="text-muted-foreground">
          {bulletins.total} active {bulletins.total === 1 ? "bulletin" : "bulletins"}
        </p>
      </div>

      {/* Feed */}
      {bulletins.data.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No active bulletins at this time.
        </div>
      ) : (
        <div className="space-y-3">
          {bulletins.data.map((item) => {
            const badge = PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.info;
            const pinBorder = item.is_pinned ? PRIORITY_BORDER[item.priority] ?? "" : "";

            return (
              <div
                key={item.id}
                className={`bg-card border-2 border-border rounded-xl overflow-hidden transition-shadow hover:shadow-md ${
                  item.priority === "urgent"
                    ? "bg-red-50/40 dark:bg-red-950/10"
                    : ""
                }`}
              >
                {/* Left accent border wrapper */}
                <div className={`flex ${pinBorder}`}>
                  <div className="flex-1 p-5">
                    {/* Top row: badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${badge.className}`}
                      >
                        {badge.label}
                      </Badge>
                      {item.is_pinned && (
                        <Badge
                          variant="secondary"
                          className="text-xs flex items-center gap-1"
                        >
                          <Pin className="w-2.5 h-2.5" />
                          Pinned
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-semibold text-foreground mb-1.5">
                      {item.title}
                    </h2>

                    {/* Body */}
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {item.body}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.author}
                      </span>
                      {item.published_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.published_at}
                        </span>
                      )}
                      {item.expires_at && (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires: {item.expires_at}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {bulletins.last_page > 1 && (
        <div className="flex justify-center gap-1 pb-6">
          {bulletins.links.map((link) => (
            <Button
              key={link.label}
              variant={link.active ? "default" : "outline"}
              size="sm"
              disabled={!link.url}
              onClick={() => link.url && router.visit(link.url, { preserveState: true })}
              className={link.active ? "bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white" : ""}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(link.label) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

BulletinBoardPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
