import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, ArrowRight } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

interface JobCard {
  id: number;
  title: string;
  department: string;
  excerpt: string;
  closes_at: string | null;
  status: string;
}

interface PaginatedPostings {
  data: JobCard[];
  current_page: number;
  last_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface JobPostingsPageProps {
  postings: PaginatedPostings;
}

export default function JobPostingsPage({ postings }: JobPostingsPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-[#1F6E4A]" />
          Internal Job Openings
        </h1>
        <p className="text-muted-foreground">
          {postings.total} open position{postings.total !== 1 ? "s" : ""} — apply before the closing date
        </p>
      </div>

      {/* Grid */}
      {postings.data.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
          No open positions at the moment. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {postings.data.map((job) => (
            <button
              key={job.id}
              onClick={() => router.visit(`/jobs/${job.id}`)}
              className="text-left bg-card border-2 border-border rounded-xl p-5 hover:border-[#1F6E4A] hover:shadow-md transition-all space-y-3 flex flex-col"
            >
              {/* Department badge */}
              <Badge variant="secondary" className="text-xs self-start">
                {job.department}
              </Badge>

              {/* Title */}
              <h3 className="font-semibold text-foreground leading-snug flex-1">{job.title}</h3>

              {/* Excerpt */}
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {job.excerpt}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                {job.closes_at ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Closes {job.closes_at}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Open until filled</span>
                )}
                <span className="text-xs text-[#1F6E4A] font-medium flex items-center gap-1">
                  View & Apply
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {postings.last_page > 1 && (
        <div className="flex justify-center gap-1 pb-6">
          {postings.links.map((link) => (
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

JobPostingsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
