import { router, useForm, usePage } from "@inertiajs/react";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  BookOpen,
  PlayCircle,
  Award,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { ContentRenderer } from "@/components/ContentRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import MainLayout from "@/layouts/MainLayout";

interface Enrollment {
  id: number;
  status: "assigned" | "in_progress" | "completed";
  progress: number;
  score: number | null;
  started_at: string | null;
  completed_at: string | null;
}

interface Course {
  id: number;
  title: string;
  description: string;
  type: "mandatory" | "optional" | "certification";
  category: string;
  content: string;
  duration_minutes: number | null;
  duration_label: string;
  stage_visibility: string[];
  is_published: boolean;
}

interface CourseViewPageProps {
  course: Course;
  enrollment: Enrollment | null;
}

const TYPE_CONFIG = {
  mandatory: { label: "Mandatory", className: "bg-red-100 text-red-700 border-red-200" },
  optional: { label: "Optional", className: "bg-blue-100 text-blue-700 border-blue-200" },
  certification: { label: "Certification", className: "bg-amber-100 text-amber-700 border-amber-200" },
} as const;

export default function CourseViewPage({ course, enrollment: initialEnrollment }: CourseViewPageProps) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(initialEnrollment);
  const [enrolling, setEnrolling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [score, setScore] = useState<string>(
    initialEnrollment?.score != null ? String(initialEnrollment.score) : "",
  );

  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  const typeConfig = TYPE_CONFIG[course.type];

  const handleEnroll = () => {
    setEnrolling(true);
    router.post(
      `/learning/${course.id}/enroll`,
      {},
      {
        onSuccess: () => {
          setEnrollment({
            id: 0,
            status: "in_progress",
            progress: 0,
            score: null,
            started_at: new Date().toISOString().split("T")[0],
            completed_at: null,
          });
        },
        onError: () => toast.error("Could not enrol. Please try again."),
        onFinish: () => setEnrolling(false),
        preserveScroll: true,
      },
    );
  };

  const handleComplete = () => {
    if (course.type === "certification") {
      const parsed = parseInt(score, 10);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        toast.error("Please enter a valid score between 0 and 100.");
        return;
      }
    }

    setCompleting(true);
    router.post(
      `/learning/${course.id}/progress`,
      { progress: 100, score: course.type === "certification" ? parseInt(score, 10) : undefined },
      {
        onSuccess: () => {
          setEnrollment((prev) =>
            prev
              ? {
                  ...prev,
                  status: "completed",
                  progress: 100,
                  score: course.type === "certification" ? parseInt(score, 10) : prev.score,
                  completed_at: new Date().toISOString().split("T")[0],
                }
              : prev,
          );
          toast.success("Course completed! Well done.");
        },
        onError: () => toast.error("Failed to update progress."),
        onFinish: () => setCompleting(false),
        preserveScroll: true,
      },
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.visit("/learning")}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Learning Hub
      </Button>

      {/* Header card */}
      <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`text-xs ${typeConfig.className}`}>
            {typeConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{course.category}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration_label}
          </span>
          {enrollment?.status === "completed" && (
            <Badge className="bg-green-100 text-green-700 border-0 text-xs ml-auto">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed{enrollment.completed_at ? ` · ${enrollment.completed_at}` : ""}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl font-bold text-foreground leading-snug">{course.title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">{course.description}</p>

        {/* Progress bar */}
        {enrollment && enrollment.status !== "assigned" && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{enrollment.progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  enrollment.status === "completed" ? "bg-green-500" : "bg-brand"
                }`}
                style={{ width: `${enrollment.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Score (certification) */}
        {enrollment?.status === "completed" && enrollment.score != null && (
          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-foreground font-medium">
              Score: {enrollment.score}/100
              {enrollment.score >= 70 ? (
                <span className="text-green-600 ml-2">— Passed</span>
              ) : (
                <span className="text-red-500 ml-2">— Did not pass (70% required)</span>
              )}
            </span>
          </div>
        )}

        {/* CTA area */}
        {!enrollment && (
          <Button
            onClick={handleEnroll}
            disabled={enrolling}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {enrolling ? "Starting…" : "Start Course"}
          </Button>
        )}

        {enrollment && enrollment.status !== "completed" && (
          <div className="flex flex-wrap items-end gap-3">
            {course.type === "certification" && (
              <div className="space-y-1">
                <Label htmlFor="score" className="text-xs">
                  Your Score (0–100)
                </Label>
                <Input
                  id="score"
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-32 text-sm"
                />
              </div>
            )}
            <Button
              onClick={handleComplete}
              disabled={completing}
              className="bg-brand hover:bg-brand/90 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {completing ? "Saving…" : "Mark as Complete"}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Course content */}
      {!enrollment && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg px-4 py-3">
          <BookOpen className="w-4 h-4 shrink-0" />
          Enrol in this course to start learning. Course materials are shown below as a preview.
        </div>
      )}

      <ContentRenderer content={course.content} />
    </div>
  );
}

CourseViewPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
