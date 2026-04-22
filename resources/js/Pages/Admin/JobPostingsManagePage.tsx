import MainLayout from "@/layouts/MainLayout";
import { router, useForm, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  PlusCircle,
  Save,
  Users,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitize";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Application {
  id: number;
  status: string;
  applied_at: string | null;
  applicant: { name: string; department: string | null; position: string | null; initials: string };
}

interface PostingRow {
  id: number;
  title: string;
  department: string;
  status: string;
  closes_at: string | null;
  application_count: number;
  description: string;
  requirements: string;
  applications: Application[];
}

interface PaginatedPostings {
  data: PostingRow[];
  current_page: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface JobPostingsManagePageProps {
  postings: PaginatedPostings | PostingRow[];
  posting: PostingRow | null;
}

type FormData = {
  title: string;
  department: string;
  description: string;
  requirements: string;
  status: string;
  closes_at: string;
};

const APP_STATUS_OPTIONS = [
  { value: "applied",     label: "Applied" },
  { value: "reviewing",   label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected",    label: "Rejected" },
];

const APP_STATUS_COLORS: Record<string, string> = {
  applied:     "bg-blue-100 text-blue-700",
  reviewing:   "bg-amber-100 text-amber-700",
  shortlisted: "bg-green-100 text-green-700",
  rejected:    "bg-red-100 text-red-700",
};

// ─── Job form ─────────────────────────────────────────────────────────────────

function JobForm({ posting }: { posting: PostingRow | null }) {
  const isEdit = !!posting;
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

  const { data, setData, post, put, processing, errors, reset } = useForm<FormData>({
    title:        posting?.title        ?? "",
    department:   posting?.department   ?? "",
    description:  posting?.description  ?? "",
    requirements: posting?.requirements ?? "",
    status:       posting?.status       ?? "open",
    closes_at:    posting?.closes_at    ?? "",
  });

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error)   toast.error(flash.error);
  }, [flash]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      put(`/admin/jobs/${posting!.id}`, {
        onSuccess: () => toast.success("Job posting updated."),
        onError: () => toast.error("Please fix the errors below."),
      });
    } else {
      post("/admin/jobs", {
        onSuccess: () => { reset(); toast.success("Job posting created."); },
        onError: () => toast.error("Please fix the errors below."),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEdit ? `Edit: ${posting!.title}` : "New Job Posting"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="j-title">Job Title *</Label>
            <Input id="j-title" value={data.title} onChange={(e) => setData("title", e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="j-dept">Department *</Label>
              <Input id="j-dept" value={data.department} onChange={(e) => setData("department", e.target.value)} placeholder="e.g. Engineering" />
              {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-closes">Closes On</Label>
              <Input id="j-closes" type="date" value={data.closes_at} onChange={(e) => setData("closes_at", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{data.status === "open" ? "Open" : "Closed"}</span>
              <Switch
                checked={data.status === "open"}
                onCheckedChange={(v) => setData("status", v ? "open" : "closed")}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="j-desc">Description *</Label>
            <Textarea id="j-desc" value={data.description} onChange={(e) => setData("description", e.target.value)} rows={4} placeholder="Describe the role, responsibilities, and team…" />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="j-req">Requirements *</Label>
            <Textarea id="j-req" value={data.requirements} onChange={(e) => setData("requirements", e.target.value)} rows={4} placeholder="List required skills, experience, and qualifications…" />
            {errors.requirements && <p className="text-xs text-destructive">{errors.requirements}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={processing} className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white">
              <Save className="w-4 h-4 mr-2" />
              {processing ? "Saving…" : isEdit ? "Update" : "Create"}
            </Button>
            {isEdit && (
              <Button type="button" variant="outline" onClick={() => router.visit("/admin/jobs")}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Application row ─────────────────────────────────────────────────────────

function ApplicationRow({ app }: { app: Application }) {
  const [status, setStatus] = useState(app.status);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    router.patch(
      `/admin/jobs/applications/${app.id}`,
      { status: newStatus },
      {
        preserveScroll: true,
        onSuccess: () => toast.success("Status updated."),
        onError: () => { setStatus(app.status); toast.error("Failed to update status."); },
      },
    );
  };

  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className="bg-muted text-foreground text-xs">
          {app.applicant.initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{app.applicant.name}</p>
        <p className="text-xs text-muted-foreground">{app.applicant.department ?? app.applicant.position ?? "—"}</p>
      </div>
      {app.applied_at && (
        <span className="text-xs text-muted-foreground hidden sm:block shrink-0">{app.applied_at}</span>
      )}
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-32 h-7 text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {APP_STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Posting row ─────────────────────────────────────────────────────────────

function PostingRow({ row }: { row: PostingRow }) {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = () => {
    if (!confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    router.delete(`/admin/jobs/${row.id}`, { onSuccess: () => toast.success("Posting deleted.") });
  };

  return (
    <div className="bg-card border-2 border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Toggle applications"
        >
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{row.title}</p>
            <Badge variant="secondary" className="text-xs shrink-0">{row.department}</Badge>
            <Badge
              className={`text-xs border-0 shrink-0 ${row.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
            >
              {row.status === "open" ? "Open" : "Closed"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {row.application_count} application{row.application_count !== 1 ? "s" : ""}
            </span>
            {row.closes_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Closes {row.closes_at}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.visit(`/admin/jobs/${row.id}/edit`)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-8 w-8 p-0 hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded applications */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-1">
          {row.applications.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">No applications yet.</p>
          ) : (
            row.applications.map((app) => (
              <div key={app.id}>
                <ApplicationRow app={app} />
                <Separator className="last:hidden" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobPostingsManagePage({ postings, posting }: JobPostingsManagePageProps) {
  const postingList = Array.isArray(postings) ? postings : (postings as PaginatedPostings).data;
  const pagination = Array.isArray(postings) ? null : (postings as PaginatedPostings);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-[#1F6E4A]" />
            Manage Job Postings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create positions and review applications from staff.
          </p>
        </div>
        <Button
          onClick={() => router.visit("/admin/jobs")}
          className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Posting
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left: postings list */}
        <div className="xl:col-span-3 space-y-3">
          {postingList.length === 0 ? (
            <p className="text-muted-foreground text-sm py-10 text-center">
              No job postings yet. Create your first one.
            </p>
          ) : (
            postingList.map((row) => <PostingRow key={row.id} row={row} />)
          )}

          {pagination && pagination.last_page > 1 && (
            <div className="flex justify-center gap-1 pt-2">
              {pagination.links.map((link) => (
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

        {/* Right: form */}
        <div className="xl:col-span-2">
          <JobForm posting={posting} />
        </div>
      </div>
    </div>
  );
}

JobPostingsManagePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
