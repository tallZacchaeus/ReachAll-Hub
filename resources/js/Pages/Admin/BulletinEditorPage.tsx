import { router, useForm } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { Newspaper, Plus, Pencil, Trash2, Pin, PinOff, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MainLayout from "@/layouts/MainLayout";

interface BulletinRow {
  id: number;
  title: string;
  body: string;
  priority: string;
  is_pinned: boolean;
  is_published: boolean;
  expires_at: string | null;
  author: string;
  published_at: string | null;
  created_at: string | null;
}

interface BulletinEditorPageProps {
  bulletin: BulletinRow | null;
  bulletins: BulletinRow[] | { data: BulletinRow[]; current_page: number; last_page: number; total: number; links: { url: string | null; label: string; active: boolean }[] };
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30",
  important: "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  info: "border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950/30",
};

type FormData = {
  title: string;
  body: string;
  priority: string;
  expires_at: string;
  is_pinned: boolean;
  is_published: boolean;
};

export default function BulletinEditorPage({ bulletin, bulletins }: BulletinEditorPageProps) {
  const isEdit = !!bulletin;
  const { props } = usePage<{ flash?: { success?: string } }>();
  const [showForm, setShowForm] = useState(isEdit);

  const bulletinList = Array.isArray(bulletins) ? bulletins : (bulletins as { data: BulletinRow[] }).data ?? [];

  const { data, setData, post, put, processing, errors, reset } = useForm<FormData>({
    title: bulletin?.title ?? "",
    body: bulletin?.body ?? "",
    priority: bulletin?.priority ?? "info",
    expires_at: bulletin?.expires_at ?? "",
    is_pinned: bulletin?.is_pinned ?? false,
    is_published: bulletin?.is_published ?? false,
  });

  useEffect(() => {
    if (props.flash?.success) toast.success(props.flash.success);
  }, [props.flash]);

  const charCount = data.body.length;
  const charMax = 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      put(`/admin/bulletins/${bulletin!.id}`, {
        onSuccess: () => router.visit('/admin/bulletins'),
      });
    } else {
      post('/admin/bulletins', {
        onSuccess: () => {
          reset();
          setShowForm(false);
        },
      });
    }
  };

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    router.delete(`/admin/bulletins/${id}`);
  };

  const handlePin = (id: number) => {
    router.patch(`/admin/bulletins/${id}/pin`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1 flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-brand" />
            {isEdit ? "Edit Bulletin" : "Manage Bulletins"}
          </h1>
        </div>
        {!isEdit && !showForm && (
          <Button
            className="bg-brand hover:bg-brand/90 text-white"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Bulletin
          </Button>
        )}
      </div>

      {/* Form (create / edit) */}
      {(showForm || isEdit) && (
        <Card className="border-2 border-brand">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {isEdit ? `Editing: ${bulletin!.title}` : "New Bulletin"}
              </CardTitle>
              {!isEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowForm(false); reset(); }}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData("title", e.target.value)}
                  placeholder="Bulletin title…"
                  className={errors.title ? "border-red-400" : ""}
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Body</Label>
                  <span className={`text-xs ${charCount > charMax ? "text-red-500" : "text-muted-foreground"}`}>
                    {charCount} / {charMax}
                  </span>
                </div>
                <textarea
                  id="body"
                  rows={4}
                  value={data.body}
                  onChange={(e) => setData("body", e.target.value)}
                  placeholder="Bulletin content…"
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none ${
                    errors.body ? "border-red-400" : "border-input"
                  }`}
                />
                {errors.body && <p className="text-xs text-red-500">{errors.body}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Priority */}
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={data.priority}
                    onValueChange={(v) => setData("priority", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expires at */}
                <div className="space-y-1.5">
                  <Label htmlFor="expires_at">Expires (optional)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={data.expires_at}
                    onChange={(e) => setData("expires_at", e.target.value)}
                    className={errors.expires_at ? "border-red-400" : ""}
                  />
                  {errors.expires_at && (
                    <p className="text-xs text-red-500">{errors.expires_at}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-6 flex-wrap">
                {/* Is pinned */}
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_pinned"
                    checked={data.is_pinned}
                    onCheckedChange={(v) => setData("is_pinned", v)}
                  />
                  <Label htmlFor="is_pinned" className="cursor-pointer">
                    Pin bulletin
                  </Label>
                </div>

                {/* Is published */}
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    checked={data.is_published}
                    onCheckedChange={(v) => setData("is_published", v)}
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">
                    Publish immediately
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {isEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.visit('/admin/bulletins')}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className="bg-brand hover:bg-brand/90 text-white"
                  disabled={processing || charCount > charMax}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? "Save Changes" : "Create Bulletin"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulletin list */}
      {!isEdit && bulletinList.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-foreground">Title</TableHead>
                <TableHead className="text-foreground">Priority</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground">Expires</TableHead>
                <TableHead className="text-foreground">Author</TableHead>
                <TableHead className="text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bulletinList.map((item) => (
                <TableRow
                  key={item.id}
                  className={`hover:bg-muted/50 ${item.is_pinned ? "bg-muted/30" : ""}`}
                >
                  <TableCell className="font-medium text-foreground max-w-xs truncate">
                    <div className="flex items-center gap-1.5">
                      {item.is_pinned && <Pin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      {item.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${PRIORITY_BADGE[item.priority] ?? ""}`}
                    >
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        item.is_published
                          ? "border-green-300 text-green-600 bg-green-50 dark:bg-green-950/30"
                          : "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                      }`}
                    >
                      {item.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.expires_at ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.author}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 w-7 p-0 ${item.is_pinned ? "text-brand" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => handlePin(item.id)}
                        title={item.is_pinned ? "Unpin" : "Pin"}
                      >
                        {item.is_pinned ? (
                          <PinOff className="w-3.5 h-3.5" />
                        ) : (
                          <Pin className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => router.visit(`/admin/bulletins/${item.id}/edit`)}
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
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
      )}

      {!isEdit && bulletinList.length === 0 && !showForm && (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          No bulletins yet.{" "}
          <button
            className="text-brand hover:underline"
            onClick={() => setShowForm(true)}
          >
            Create the first one.
          </button>
        </div>
      )}
    </div>
  );
}

BulletinEditorPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
