import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Search, Clock, CheckCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

interface Enrollment {
  id: number;
  status: "assigned" | "in_progress" | "completed";
  progress: number;
  score: number | null;
  started_at: string | null;
  completed_at: string | null;
}

interface CourseCard {
  id: number;
  title: string;
  description: string;
  type: "mandatory" | "optional" | "certification";
  category: string;
  duration_label: string;
  stage_visibility: string[];
  enrollment: Enrollment | null;
}

interface PaginatedCourses {
  data: CourseCard[];
  current_page: number;
  last_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface LearningHubPageProps {
  courses: PaginatedCourses;
  filters: { type: string; search: string };
}

const TYPE_CONFIG = {
  mandatory: { label: "Mandatory", className: "bg-red-100 text-red-700 border-red-200" },
  optional: { label: "Optional", className: "bg-blue-100 text-blue-700 border-blue-200" },
  certification: { label: "Certification", className: "bg-amber-100 text-amber-700 border-amber-200" },
} as const;

const STATUS_CONFIG = {
  assigned: { label: "Assigned", className: "bg-gray-100 text-gray-600" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
} as const;

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "mandatory", label: "Mandatory" },
  { value: "optional", label: "Optional" },
  { value: "certification", label: "Certification" },
];

export default function LearningHubPage({ courses, filters }: LearningHubPageProps) {
  const [search, setSearch] = useState(filters.search);

  const applyFilter = (patch: Partial<{ type: string; search: string }>) => {
    router.get(
      "/learning",
      { ...filters, ...patch },
      { preserveState: true, replace: true },
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter({ search });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-[#1F6E4A]" />
          Learning Hub
        </h1>
        <p className="text-muted-foreground">
          {courses.total} {courses.total === 1 ? "course" : "courses"} available
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Type tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => applyFilter({ type: tab.value, search })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filters.type === tab.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-xs">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="text-sm"
          />
          <Button type="submit" size="sm" variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Course grid */}
      {courses.data.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No courses found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.data.map((course) => {
            const typeConfig = TYPE_CONFIG[course.type];
            const enrollment = course.enrollment;
            const statusConfig = enrollment ? STATUS_CONFIG[enrollment.status] : null;

            return (
              <button
                key={course.id}
                onClick={() => router.visit(`/learning/${course.id}`)}
                className="text-left bg-card border-2 border-border rounded-xl p-5 hover:border-[#1F6E4A] hover:shadow-md transition-all space-y-3 flex flex-col"
              >
                {/* Type badge + status */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${typeConfig.className}`}
                  >
                    {typeConfig.label}
                  </Badge>
                  {statusConfig && (
                    <Badge variant="secondary" className={`text-xs ${statusConfig.className}`}>
                      {enrollment?.status === "completed" && (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {statusConfig.label}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-foreground leading-snug text-sm line-clamp-2 flex-1">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                {/* Progress bar (if enrolled) */}
                {enrollment && enrollment.status !== "assigned" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{enrollment.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          enrollment.status === "completed"
                            ? "bg-green-500"
                            : "bg-[#1F6E4A]"
                        }`}
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta: category + duration */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>{course.category}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {course.duration_label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {courses.last_page > 1 && (
        <div className="flex justify-center gap-1 pb-6">
          {courses.links.map((link) => (
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

LearningHubPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
