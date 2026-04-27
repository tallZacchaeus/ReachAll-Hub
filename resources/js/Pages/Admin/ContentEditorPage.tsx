import { router, useForm } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { TipTapEditor } from "@/components/TipTapEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import MainLayout from "@/layouts/MainLayout";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface ContentPage {
  id: number;
  title: string;
  slug: string;
  body: string;
  category_id: number;
  stage_visibility: string[];
  is_published: boolean;
  requires_acknowledgement: boolean;
  acknowledgement_deadline: string | null;
}

interface ContentEditorPageProps {
  page: ContentPage | null;
  categories: Category[];
}

type FormData = {
  title: string;
  slug: string;
  body: string;
  category_id: string;
  stage_visibility: string[];
  is_published: boolean;
  requires_acknowledgement: boolean;
  acknowledgement_deadline: string;
  featured_image: File | null;
  new_attachments: File[];
};

const STAGES = [
  { value: "joiner", label: "Joiner" },
  { value: "performer", label: "Performer" },
  { value: "leader", label: "Leader" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ContentEditorPage({ page, categories }: ContentEditorPageProps) {
  const isEdit = !!page;
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

  const { data, setData, post, put, processing, errors, reset } = useForm<FormData>({
    title: page?.title ?? "",
    slug: page?.slug ?? "",
    body: page?.body ?? "",
    category_id: page?.category_id ? String(page.category_id) : "",
    stage_visibility: page?.stage_visibility ?? ["joiner", "performer", "leader"],
    is_published: page?.is_published ?? false,
    requires_acknowledgement: page?.requires_acknowledgement ?? false,
    acknowledgement_deadline: page?.acknowledgement_deadline ?? "",
    featured_image: null,
    new_attachments: [],
  });

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash?.success, flash?.error]);

  const handleTitleBlur = () => {
    if (!isEdit && data.title && !data.slug) {
      setData("slug", slugify(data.title));
    }
  };

  const handleStageToggle = (stage: string, checked: boolean) => {
    if (checked) {
      setData("stage_visibility", [...data.stage_visibility, stage]);
    } else {
      setData("stage_visibility", data.stage_visibility.filter((s) => s !== stage));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const options = {
      preserveScroll: true,
      forceFormData: true,
    } as const;

    if (isEdit) {
      put(`/admin/content/${page.id}`, options);
    } else {
      post("/admin/content", options);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.visit("/admin/content")}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-foreground">{isEdit ? "Edit Content" : "New Content Page"}</h1>
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <Button
              variant="outline"
              onClick={() => router.visit(`/content/${page.slug}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={processing}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {processing ? "Saving…" : isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-foreground">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => setData("title", e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Page title"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-foreground">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              value={data.slug}
              onChange={(e) => setData("slug", slugify(e.target.value))}
              placeholder="auto-generated-from-title"
            />
            <p className="text-xs text-muted-foreground">
              URL: /content/{data.slug || "page-slug"}
            </p>
          </div>

          {/* Body editor */}
          <div className="space-y-1.5">
            <Label className="text-foreground">
              Content <span className="text-red-500">*</span>
            </Label>
            <TipTapEditor
              content={data.body}
              onChange={(html) => setData("body", html)}
              placeholder="Write your content here…"
            />
            {errors.body && <p className="text-xs text-red-500">{errors.body}</p>}
          </div>
        </div>

        {/* Settings sidebar */}
        <div className="space-y-4">
          {/* Publish */}
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_published" className="text-foreground text-sm">
                  Published
                </Label>
                <Switch
                  id="is_published"
                  checked={data.is_published}
                  onCheckedChange={(v) => setData("is_published", v)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {data.is_published
                  ? "This page is visible to staff."
                  : "This page is saved as a draft."}
              </p>
            </CardContent>
          </Card>

          {/* Category */}
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={data.category_id}
                onValueChange={(v) => setData("category_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>
              )}
            </CardContent>
          </Card>

          {/* Stage visibility */}
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Visible to</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STAGES.map((stage) => (
                <div key={stage.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`stage-${stage.value}`}
                    checked={data.stage_visibility.includes(stage.value)}
                    onCheckedChange={(checked) =>
                      handleStageToggle(stage.value, checked === true)
                    }
                  />
                  <Label htmlFor={`stage-${stage.value}`} className="text-sm text-foreground">
                    {stage.label}
                  </Label>
                </div>
              ))}
              {errors.stage_visibility && (
                <p className="text-xs text-red-500">{errors.stage_visibility}</p>
              )}
            </CardContent>
          </Card>

          {/* Featured image */}
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setData("featured_image", e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              {errors.featured_image && (
                <p className="text-xs text-red-500 mt-1">{errors.featured_image}</p>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                type="file"
                multiple
                name="new_attachments"
                onChange={(e) => setData("new_attachments", e.target.files ? Array.from(e.target.files) : [])}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Up to 5 files, max 10 MB each. New uploads are appended to existing attachments.
              </p>
              {errors.new_attachments && (
                <p className="text-xs text-red-500">{errors.new_attachments}</p>
              )}
            </CardContent>
          </Card>

          {/* Acknowledgement */}
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-foreground">Acknowledgement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="requires_ack" className="text-sm text-foreground">
                  Requires acknowledgement
                </Label>
                <Switch
                  id="requires_ack"
                  checked={data.requires_acknowledgement}
                  onCheckedChange={(v) => setData("requires_acknowledgement", v)}
                />
              </div>
              {data.requires_acknowledgement && (
                <div className="space-y-1.5">
                  <Label htmlFor="ack_deadline" className="text-xs text-muted-foreground">
                    Deadline (optional)
                  </Label>
                  <Input
                    id="ack_deadline"
                    type="date"
                    value={data.acknowledgement_deadline}
                    onChange={(e) => setData("acknowledgement_deadline", e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

ContentEditorPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
