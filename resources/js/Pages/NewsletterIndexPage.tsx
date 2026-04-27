import { router } from "@inertiajs/react";
import { Newspaper, Calendar, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import MainLayout from "@/layouts/MainLayout";
import { sanitizeHtml } from "@/lib/sanitize";

interface NewsletterCard {
  id: number;
  title: string;
  excerpt: string;
  featured_image: string | null;
  author: string;
  author_initials: string;
  published_at: string | null;
  target_audience: { type: string; value: string };
}

interface PaginatedNewsletters {
  data: NewsletterCard[];
  current_page: number;
  last_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface NewsletterIndexPageProps {
  newsletters: PaginatedNewsletters;
}

export default function NewsletterIndexPage({ newsletters }: NewsletterIndexPageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-brand" />
          Newsletters
        </h1>
        <p className="text-muted-foreground">
          {newsletters.total} {newsletters.total === 1 ? "newsletter" : "newsletters"}
        </p>
      </div>

      {/* Feed */}
      {newsletters.data.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No newsletters yet. Check back soon.
        </div>
      ) : (
        <div className="space-y-6">
          {newsletters.data.map((item) => (
            <button
              key={item.id}
              onClick={() => router.visit(`/newsletters/${item.id}`)}
              className="w-full text-left bg-card border-2 border-border rounded-xl overflow-hidden hover:border-brand hover:shadow-md transition-all"
            >
              {/* Featured image */}
              {item.featured_image && (
                <div className="w-full h-52 overflow-hidden bg-muted">
                  <img
                    src={item.featured_image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Body */}
              <div className="p-6 space-y-3">
                <h2 className="text-lg font-semibold text-foreground leading-snug">
                  {item.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-brand text-white text-xs">
                        {item.author_initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.author}
                    </span>
                  </div>
                  {item.published_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.published_at}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {newsletters.last_page > 1 && (
        <div className="flex justify-center gap-1 pb-6">
          {newsletters.links.map((link) => (
            <Button
              key={link.label}
              variant={link.active ? "default" : "outline"}
              size="sm"
              disabled={!link.url}
              onClick={() => link.url && router.visit(link.url, { preserveState: true })}
              className={link.active ? "bg-brand hover:bg-brand/90 text-white" : ""}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(link.label) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

NewsletterIndexPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
