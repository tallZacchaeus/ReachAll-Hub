import { router, useForm, usePage } from "@inertiajs/react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle,
  Send,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";

interface Posting {
  id: number;
  title: string;
  department: string;
  description: string;
  requirements: string;
  closes_at: string | null;
  status: string;
  posted_by: string;
  created_at: string | null;
}

interface JobPostingDetailPageProps {
  posting: Posting;
  hasApplied: boolean;
  applicationStatus: string | null;
}

const APP_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  applied:     { label: "Applied",     className: "bg-blue-100 text-blue-700" },
  reviewing:   { label: "Reviewing",   className: "bg-amber-100 text-amber-700" },
  shortlisted: { label: "Shortlisted", className: "bg-green-100 text-green-700" },
  rejected:    { label: "Not selected", className: "bg-red-100 text-red-700" },
};

function ApplyDialog({ postingId, onSuccess }: { postingId: number; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { flash } = usePage<{ flash?: { success?: string } }>().props;

  const { data, setData, post, processing, errors, reset } = useForm({
    cover_letter: "",
  });

  useEffect(() => {
    if (flash?.success && open) {
      setOpen(false);
      reset();
      onSuccess();
    }
  }, [flash?.success]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/jobs/${postingId}/apply`, {
      onSuccess: () => toast.success("Application submitted! Good luck."),
      onError: () => toast.error("Please check your application and try again."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-brand hover:bg-brand/90 text-white">
          <Send className="w-4 h-4 mr-2" />
          Apply Now
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand" />
            Submit Application
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="cover_letter">Cover Letter *</Label>
              <span className="text-xs text-muted-foreground">{data.cover_letter.length}/3000</span>
            </div>
            <Textarea
              id="cover_letter"
              value={data.cover_letter}
              onChange={(e) => setData("cover_letter", e.target.value)}
              placeholder="Tell us why you're a great fit for this role. Highlight relevant experience and what excites you about this position…"
              rows={8}
              maxLength={3000}
            />
            {errors.cover_letter && (
              <p className="text-xs text-destructive">{errors.cover_letter}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={processing}
            className="w-full bg-brand hover:bg-brand/90 text-white"
          >
            {processing ? "Submitting…" : "Submit Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function JobPostingDetailPage({
  posting,
  hasApplied: initialHasApplied,
  applicationStatus: initialStatus,
}: JobPostingDetailPageProps) {
  const [hasApplied, setHasApplied] = useState(initialHasApplied);
  const [appStatus, setAppStatus] = useState<string | null>(initialStatus);
  const statusConfig = appStatus ? APP_STATUS_CONFIG[appStatus] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.visit("/jobs")}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Job Openings
      </Button>

      {/* Header card */}
      <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">{posting.department}</Badge>
            <h1 className="text-2xl font-bold text-foreground leading-snug">{posting.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Posted by {posting.posted_by}
              </span>
              {posting.closes_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Closes {posting.closes_at}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {hasApplied ? (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Applied
                </div>
                {statusConfig && (
                  <Badge className={`text-xs border-0 ${statusConfig.className}`}>
                    {statusConfig.label}
                  </Badge>
                )}
              </div>
            ) : (
              <ApplyDialog
                postingId={posting.id}
                onSuccess={() => {
                  setHasApplied(true);
                  setAppStatus("applied");
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-card border-2 border-border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-foreground">About the Role</h2>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
          {posting.description}
        </p>
      </div>

      <Separator />

      {/* Requirements */}
      <div className="bg-card border-2 border-border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-foreground">Requirements</h2>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
          {posting.requirements}
        </p>
      </div>

      {/* Bottom CTA */}
      {!hasApplied && (
        <div className="flex justify-center pb-6">
          <ApplyDialog
            postingId={posting.id}
            onSuccess={() => {
              setHasApplied(true);
              setAppStatus("applied");
            }}
          />
        </div>
      )}
    </div>
  );
}

JobPostingDetailPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
