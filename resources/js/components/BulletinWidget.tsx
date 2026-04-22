import { Link } from "@inertiajs/react";
import { Pin } from "lucide-react";

export interface BulletinItem {
  id: number;
  title: string;
  body: string;
  priority: "info" | "important" | "urgent";
  is_pinned: boolean;
  expires_at: string | null;
  author: string;
  published_at: string | null;
}

interface BulletinWidgetProps {
  bulletins: BulletinItem[];
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  important: "bg-amber-500",
  info: "bg-blue-500",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  important: "Important",
  info: "Info",
};

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function BulletinWidget({ bulletins }: BulletinWidgetProps) {
  return (
    <div className="bg-card border-2 border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">News &amp; Bulletins</h3>
        <Link
          href="/bulletins"
          className="text-xs text-[#1F6E4A] hover:underline font-medium"
        >
          View All
        </Link>
      </div>

      {bulletins.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          No active bulletins.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {bulletins.map((b) => (
            <div
              key={b.id}
              className={`px-4 py-3 ${b.priority === "urgent" ? "bg-red-50 dark:bg-red-950/20" : ""}`}
            >
              {/* Priority dot + title row */}
              <div className="flex items-start gap-2 mb-1">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[b.priority] ?? "bg-blue-500"}`}
                  title={PRIORITY_LABEL[b.priority]}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground leading-snug truncate">
                      {b.title}
                    </p>
                    {b.is_pinned && (
                      <Pin className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {truncate(b.body, 80)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
