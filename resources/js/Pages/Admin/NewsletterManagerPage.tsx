import { router } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { Newspaper, Plus, Pencil, Trash2, Send } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MainLayout from "@/layouts/MainLayout";
import { sanitizeHtml } from "@/lib/sanitize";

interface NewsletterRow {
  id: number;
  title: string;
  status: string;
  target_audience: { type: string; value: string };
  author: string;
  published_at: string | null;
  created_at: string | null;
}

interface PaginatedNewsletters {
  data: NewsletterRow[];
  current_page: number;
  last_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface NewsletterManagerPageProps {
  newsletters: PaginatedNewsletters;
}

const STATUS_STYLES: Record<string, string> = {
  published:
    "border-green-300 text-green-600 bg-green-50 dark:bg-green-950/30",
  draft:
    "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30",
};

function audienceLabel(audience: { type: string; value: string }): string {
  if (audience.type === "all") return "All Employees";
  if (audience.type === "department") return `Dept: ${audience.value}`;
  if (audience.type === "stage")
    return `Stage: ${audience.value.charAt(0).toUpperCase() + audience.value.slice(1)}`;
  return audience.value;
}

export default function NewsletterManagerPage({
  newsletters,
}: NewsletterManagerPageProps) {
  const { props } = usePage<{ flash?: { success?: string } }>();

  useEffect(() => {
    if (props.flash?.success) toast.success(props.flash.success);
  }, [props.flash]);

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    router.delete(`/admin/newsletters/${id}`);
  };

  const handlePublishToggle = (id: number) => {
    router.post(`/admin/newsletters/${id}/publish`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1 flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-brand" />
            Manage Newsletters
          </h1>
          <p className="text-muted-foreground">
            {newsletters.total} {newsletters.total === 1 ? "newsletter" : "newsletters"}
          </p>
        </div>
        <Button
          className="bg-brand hover:bg-brand/90 text-white"
          onClick={() => router.visit('/admin/newsletters/create')}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Newsletter
        </Button>
      </div>

      {/* Table */}
        <div className="overflow-x-auto">

        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="text-foreground">Title</TableHead>
              <TableHead className="text-foreground">Audience</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Author</TableHead>
              <TableHead className="text-foreground">Published</TableHead>
              <TableHead className="text-foreground">Created</TableHead>
              <TableHead className="text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newsletters.data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  No newsletters yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
            {newsletters.data.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-foreground max-w-xs truncate">
                  {item.title}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {audienceLabel(item.target_audience)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${STATUS_STYLES[item.status] ?? ""}`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.author}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.published_at ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.created_at ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {/* Publish / Unpublish */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 text-xs px-2 ${
                        item.status === "published"
                          ? "text-amber-600 hover:text-amber-700"
                          : "text-green-600 hover:text-green-700"
                      }`}
                      onClick={() => handlePublishToggle(item.id)}
                      title={item.status === "published" ? "Unpublish" : "Publish"}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      {item.status === "published" ? "Unpublish" : "Publish"}
                    </Button>

                    {/* Edit */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        router.visit(`/admin/newsletters/${item.id}/edit`)
                      }
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(item.id, item.title)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {newsletters.last_page > 1 && (
        <div className="flex justify-center gap-1">
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

NewsletterManagerPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
