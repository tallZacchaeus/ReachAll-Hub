import { router, useForm } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { ArrowLeft, Save, Send, X, Upload, ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { TipTapEditor } from "@/components/TipTapEditor";
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
import MainLayout from "@/layouts/MainLayout";

interface Newsletter {
  id: number;
  title: string;
  body: string;
  featured_image: string | null;
  status: string;
  target_audience: { type: string; value: string };
}

interface NewsletterEditorPageProps {
  newsletter: Newsletter | null;
  departments: string[];
  stages: string[];
}

type AudienceType = "all" | "department" | "stage";

type FormData = {
  title: string;
  body: string;
  "target_audience[type]": AudienceType;
  "target_audience[value]": string;
  featured_image: File | null;
};

export default function NewsletterEditorPage({
  newsletter,
  departments,
  stages,
}: NewsletterEditorPageProps) {
  const isEdit = !!newsletter;
  const { props } = usePage<{ flash?: { success?: string } }>();

  const [audienceType, setAudienceType] = useState<AudienceType>(
    (newsletter?.target_audience?.type as AudienceType) ?? "all",
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    newsletter?.featured_image ?? null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, setData, post, put, processing, errors } = useForm<FormData>({
    title: newsletter?.title ?? "",
    body: newsletter?.body ?? "",
    "target_audience[type]": (newsletter?.target_audience?.type as AudienceType) ?? "all",
    "target_audience[value]": newsletter?.target_audience?.value ?? "all",
    featured_image: null,
  });

  useEffect(() => {
    if (props.flash?.success) toast.success(props.flash.success);
  }, [props.flash]);

  const audienceValueForType = (type: AudienceType): string => {
    if (type === "all") return "all";
    if (type === "department") return departments[0] ?? "";
    if (type === "stage") return stages[0] ?? "performer";
    return "all";
  };

  const handleAudienceTypeChange = (type: AudienceType) => {
    setAudienceType(type);
    setData((prev) => ({
      ...prev,
      "target_audience[type]": type,
      "target_audience[value]": audienceValueForType(type),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setData("featured_image", file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      post(route("admin.newsletters.update", newsletter.id), {
        forceFormData: true,
        _method: "put",
      } as Parameters<typeof post>[1]);
    } else {
      post(route("admin.newsletters.store"), { forceFormData: true });
    }
  };

  const handlePublish = () => {
    router.post(route("admin.newsletters.publish", newsletter!.id));
  };

  const isPublished = newsletter?.status === "published";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.visit(route("admin.newsletters.index"))}
            className="text-muted-foreground hover:text-foreground -ml-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Newsletters
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-foreground text-lg font-semibold">
            {isEdit ? "Edit Newsletter" : "New Newsletter"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && (
            <Badge
              variant="outline"
              className={
                isPublished
                  ? "border-green-300 text-green-600 bg-green-50 dark:bg-green-950/30"
                  : "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
              }
            >
              {isPublished ? "Published" : "Draft"}
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-border">
              <CardContent className="pt-6 space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    placeholder="Newsletter title…"
                    className={errors.title ? "border-red-400" : ""}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <Label>Body</Label>
                  <div
                    className={`rounded-lg border-2 overflow-hidden ${
                      errors.body ? "border-red-400" : "border-border"
                    }`}
                  >
                    <TipTapEditor
                      content={data.body}
                      onChange={(val) => setData("body", val)}
                    />
                  </div>
                  {errors.body && (
                    <p className="text-xs text-red-500">{errors.body}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Featured image */}
            <Card className="border-2 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setData("featured_image", null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg h-36 flex flex-col items-center justify-center cursor-pointer hover:border-brand transition-colors text-muted-foreground"
                  >
                    <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs">Click to upload image</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {!imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Choose Image
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Target audience */}
            <Card className="border-2 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Target Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Radio options */}
                {(["all", "department", "stage"] as AudienceType[]).map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        audienceType === type
                          ? "border-brand bg-brand"
                          : "border-border group-hover:border-brand"
                      }`}
                      onClick={() => handleAudienceTypeChange(type)}
                    >
                      {audienceType === type && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm text-foreground capitalize">
                      {type === "all"
                        ? "All Employees"
                        : type === "department"
                          ? "Specific Department"
                          : "Specific Stage"}
                    </span>
                  </label>
                ))}

                {/* Value dropdown when department or stage selected */}
                {audienceType === "department" && (
                  <Select
                    value={data["target_audience[value]"]}
                    onValueChange={(v) => setData("target_audience[value]", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {audienceType === "stage" && (
                  <Select
                    value={data["target_audience[value]"]}
                    onValueChange={(v) => setData("target_audience[value]", v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={processing}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>

              {isEdit && (
                <Button
                  type="button"
                  className={`w-full ${
                    isPublished
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-brand hover:bg-brand/90 text-white"
                  }`}
                  onClick={handlePublish}
                  disabled={processing}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isPublished ? "Unpublish" : "Publish"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

NewsletterEditorPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
