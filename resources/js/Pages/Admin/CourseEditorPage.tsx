import MainLayout from "@/layouts/MainLayout";
import { router, useForm, usePage } from "@inertiajs/react";
import { TipTapEditor } from "@/components/TipTapEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Save,
  PlusCircle,
  Pencil,
  Trash2,
  GraduationCap,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitize";

interface CourseRow {
  id: number;
  title: string;
  type: string;
  category: string;
  is_published: boolean;
  duration_minutes: number | null;
  stage_visibility: string[];
  enrollment_count: number;
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  type: string;
  category: string;
  content: string;
  duration_minutes: number | null;
  stage_visibility: string[];
  is_published: boolean;
}

interface PaginatedCourses {
  data: CourseRow[];
  current_page: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface CourseEditorPageProps {
  courses: PaginatedCourses | CourseRow[];
  course: CourseDetail | null;
}

type FormData = {
  title: string;
  description: string;
  type: string;
  category: string;
  content: string;
  duration_minutes: string;
  stage_visibility: string[];
  is_published: boolean;
};

const STAGES = [
  { value: "joiner", label: "Joiner" },
  { value: "performer", label: "Performer" },
  { value: "leader", label: "Leader" },
];

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  mandatory: { label: "Mandatory", className: "bg-red-100 text-red-700 border-red-200" },
  optional: { label: "Optional", className: "bg-blue-100 text-blue-700 border-blue-200" },
  certification: { label: "Certification", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

function CourseForm({ course }: { course: CourseDetail | null }) {
  const isEdit = !!course;
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

  const { data, setData, post, put, processing, errors, reset } = useForm<FormData>({
    title: course?.title ?? "",
    description: course?.description ?? "",
    type: course?.type ?? "optional",
    category: course?.category ?? "",
    content: course?.content ?? "",
    duration_minutes: course?.duration_minutes != null ? String(course.duration_minutes) : "",
    stage_visibility: course?.stage_visibility ?? ["joiner", "performer", "leader"],
    is_published: course?.is_published ?? false,
  });

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  const toggleStage = (stage: string) => {
    setData(
      "stage_visibility",
      data.stage_visibility.includes(stage)
        ? data.stage_visibility.filter((s) => s !== stage)
        : [...data.stage_visibility, stage],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      put(`/admin/courses/${course!.id}`, {
        onSuccess: () => toast.success("Course updated."),
        onError: () => toast.error("Please fix the errors below."),
      });
    } else {
      post("/admin/courses", {
        onSuccess: () => {
          reset();
          toast.success("Course created.");
        },
        onError: () => toast.error("Please fix the errors below."),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEdit ? `Edit: ${course!.title}` : "New Course"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => setData("title", e.target.value)}
              placeholder="e.g. Company Security Basics"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => setData("description", e.target.value)}
              placeholder="Short summary shown on the course card…"
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Type + Category + Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={data.type} onValueChange={(v) => setData("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={data.category}
                onChange={(e) => setData("category", e.target.value)}
                placeholder="e.g. Security, Engineering"
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={data.duration_minutes}
                onChange={(e) => setData("duration_minutes", e.target.value)}
                placeholder="e.g. 45 (blank = self-paced)"
              />
              {errors.duration_minutes && (
                <p className="text-xs text-destructive">{errors.duration_minutes}</p>
              )}
            </div>
          </div>

          {/* Stage visibility */}
          <div className="space-y-2">
            <Label>Visible to *</Label>
            <div className="flex gap-4">
              {STAGES.map((s) => (
                <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={data.stage_visibility.includes(s.value)}
                    onCheckedChange={() => toggleStage(s.value)}
                  />
                  <span className="text-sm">{s.label}</span>
                </label>
              ))}
            </div>
            {errors.stage_visibility && (
              <p className="text-xs text-destructive">{errors.stage_visibility}</p>
            )}
          </div>

          <Separator />

          {/* Content */}
          <div className="space-y-1.5">
            <Label>Course Content *</Label>
            <TipTapEditor
              content={data.content}
              onChange={(val) => setData("content", val)}
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
          </div>

          <Separator />

          {/* Published toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Published</p>
              <p className="text-xs text-muted-foreground">
                Unpublished courses are not visible to staff.
              </p>
            </div>
            <Switch
              checked={data.is_published}
              onCheckedChange={(v) => setData("is_published", v)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={processing}
              className="bg-brand hover:bg-brand/90 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {processing ? "Saving…" : isEdit ? "Update Course" : "Create Course"}
            </Button>
            {isEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.visit("/admin/courses")}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CourseEditorPage({ courses, course }: CourseEditorPageProps) {
  const courseList = Array.isArray(courses) ? courses : (courses as PaginatedCourses).data;
  const pagination = Array.isArray(courses) ? null : (courses as PaginatedCourses);

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    router.delete(`/admin/courses/${id}`, {
      onSuccess: () => toast.success("Course deleted."),
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-brand" />
            Manage Courses
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage learning content for staff.
          </p>
        </div>
        <Button
          onClick={() => router.visit("/admin/courses/create")}
          className="bg-brand hover:bg-brand/90 text-white"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left: course list */}
        <div className="xl:col-span-3 space-y-3">
          {courseList.length === 0 ? (
            <p className="text-muted-foreground text-sm py-10 text-center">
              No courses yet. Create your first course.
            </p>
          ) : (
            courseList.map((c) => {
              const typeConfig = TYPE_CONFIG[c.type] ?? TYPE_CONFIG.optional;
              return (
                <div
                  key={c.id}
                  className="bg-card border-2 border-border rounded-xl p-4 flex items-start gap-4 hover:border-brand/40 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${typeConfig.className}`}
                      >
                        {typeConfig.label}
                      </Badge>
                      {!c.is_published && (
                        <Badge variant="secondary" className="text-xs text-muted-foreground">
                          Draft
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{c.category}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.enrollment_count} enrolled
                      </span>
                      <span>{c.stage_visibility.join(", ")}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.visit(`/admin/courses/${c.id}/edit`)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(c.id, c.title)}
                      className="h-8 w-8 p-0 hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex justify-center gap-1 pt-2">
              {pagination.links.map((link) => (
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

        {/* Right: editor */}
        <div className="xl:col-span-2">
          <CourseForm course={course} />
        </div>
      </div>
    </div>
  );
}

CourseEditorPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
