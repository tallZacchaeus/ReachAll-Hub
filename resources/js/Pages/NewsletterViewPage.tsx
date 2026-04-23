import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ContentRenderer } from "@/components/ContentRenderer";
import { ArrowLeft, Calendar, User } from "lucide-react";

interface Newsletter {
  id: number;
  title: string;
  body: string;
  featured_image: string | null;
  author: string;
  author_initials: string;
  published_at: string | null;
  status: string;
  target_audience: { type: string; value: string };
}

interface NewsletterViewPageProps {
  newsletter: Newsletter;
}

export default function NewsletterViewPage({ newsletter }: NewsletterViewPageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-0">
      {/* Back */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.visit("/newsletters")}
          className="text-muted-foreground hover:text-foreground -ml-1"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          All Newsletters
        </Button>
      </div>

      {/* Featured image banner */}
      {newsletter.featured_image && (
        <div className="w-full h-64 sm:h-80 overflow-hidden rounded-xl bg-muted mb-6">
          <img
            src={newsletter.featured_image}
            alt={newsletter.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article */}
      <article className="bg-card border-2 border-border rounded-xl p-6 sm:p-8 space-y-6">
        {/* Title */}
        <h1 className="text-foreground text-2xl sm:text-3xl font-bold leading-tight">
          {newsletter.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-brand text-white text-xs">
                {newsletter.author_initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {newsletter.author}
            </span>
          </div>
          {newsletter.published_at && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {newsletter.published_at}
            </span>
          )}
        </div>

        {/* Body */}
        <ContentRenderer content={newsletter.body} />
      </article>
    </div>
  );
}

NewsletterViewPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
