import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ContentRow {
  id: number;
  title: string;
  slug: string;
  category: { name: string } | null;
  is_published: boolean;
  author: string;
  published_at: string | null;
  created_at: string | null;
  deleted_at: string | null;
  requires_acknowledgement: boolean;
  stage_visibility: string[];
}

interface PaginatedPages {
  data: ContentRow[];
  current_page: number;
  last_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface ContentManagerPageProps {
  pages: PaginatedPages;
  categories: Category[];
  filters: { search?: string; category?: string; status?: string };
}

export default function ContentManagerPage({ pages, categories, filters }: ContentManagerPageProps) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const [search, setSearch] = useState(filters.search ?? "");

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash?.success, flash?.error]);

  const applyFilter = (params: Record<string, string | undefined>) => {
    router.get("/admin/content", { ...filters, ...params }, { preserveScroll: true, replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter({ search });
  };

  const handleDelete = (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This can be restored later.`)) return;
    router.delete(`/admin/content/${id}`, { preserveScroll: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand" />
            Content Manager
          </h1>
          <p className="text-muted-foreground">Create and manage content pages</p>
        </div>
        <Button
          onClick={() => router.visit("/admin/content/create")}
          className="bg-brand hover:bg-brand/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-2 border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <form onSubmit={handleSearch} className="flex gap-2 md:col-span-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search pages…"
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm" className="bg-brand hover:bg-brand/90 text-white">
                Go
              </Button>
            </form>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={filters.category ?? "all"}
                onValueChange={(v) => applyFilter({ category: v === "all" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={filters.status ?? "all"}
                onValueChange={(v) => applyFilter({ status: v === "all" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Content Pages</CardTitle>
          <CardDescription className="text-muted-foreground">
            {pages.total} {pages.total === 1 ? "page" : "pages"} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="text-foreground">Title</TableHead>
                  <TableHead className="text-foreground">Category</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Visible to</TableHead>
                  <TableHead className="text-foreground">Author</TableHead>
                  <TableHead className="text-foreground">Date</TableHead>
                  <TableHead className="text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No content pages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pages.data.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      <TableCell className="text-foreground max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="line-clamp-1">{row.title}</span>
                          {row.requires_acknowledgement && (
                            <Badge
                              variant="outline"
                              className="text-xs border-orange-300 text-orange-500 shrink-0"
                            >
                              Ack
                            </Badge>
                          )}
                          {row.deleted_at && (
                            <Badge variant="outline" className="text-xs border-red-300 text-red-500 shrink-0">
                              Deleted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.category?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            row.is_published
                              ? "bg-green-100 text-green-700 border-0"
                              : "bg-yellow-100 text-yellow-700 border-0"
                          }
                        >
                          {row.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(row.stage_visibility ?? []).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs capitalize">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{row.author}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.published_at ?? row.created_at ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => router.visit(`/content/${row.slug}`)}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => router.visit(`/admin/content/${row.id}/edit`)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!row.deleted_at && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(row.id, row.title)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages.last_page > 1 && (
        <div className="flex justify-center gap-1">
          {pages.links.map((link) => (
            <Button
              key={link.label}
              variant={link.active ? "default" : "outline"}
              size="sm"
              disabled={!link.url}
              onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
              className={link.active ? "bg-brand hover:bg-brand/90 text-white" : ""}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(link.label) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

ContentManagerPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
