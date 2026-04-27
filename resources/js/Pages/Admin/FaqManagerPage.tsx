import { router, useForm } from "@inertiajs/react";
import { Plus, Pencil, Trash2, HelpCircle, Save, X } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";

interface FaqEntry {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_published: boolean;
}

interface FaqManagerPageProps {
  faqs: FaqEntry[];
}

const CATEGORIES = ["General", "IT & Access", "Leave & Benefits", "HR Processes"];

const categoryColors: Record<string, string> = {
  General: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "IT & Access": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Leave & Benefits": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "HR Processes": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

interface FaqFormData {
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_published: boolean;
  [key: string]: string | number | boolean;
}

function FaqDialog({
  faq,
  trigger,
  onClose,
}: {
  faq?: FaqEntry;
  trigger: React.ReactNode;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!faq;

  const { data, setData, post, put, processing, errors, reset } = useForm<FaqFormData>({
    question: faq?.question ?? "",
    answer: faq?.answer ?? "",
    category: faq?.category ?? "General",
    sort_order: faq?.sort_order ?? 0,
    is_published: faq?.is_published ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      put(`/admin/faqs/${faq!.id}`, {
        onSuccess: () => {
          setOpen(false);
          onClose?.();
        },
      });
    } else {
      post("/admin/faqs", {
        onSuccess: () => {
          reset();
          setOpen(false);
          onClose?.();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={data.category} onValueChange={(v) => setData("category", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Question</Label>
            <Input
              value={data.question}
              onChange={(e) => setData("question", e.target.value)}
              placeholder="What is…?"
              required
            />
            {errors.question && <p className="text-xs text-red-500">{errors.question}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Answer</Label>
            <Textarea
              value={data.answer}
              onChange={(e) => setData("answer", e.target.value)}
              placeholder="Explain the answer clearly…"
              rows={4}
              required
            />
            {errors.answer && <p className="text-xs text-red-500">{errors.answer}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={data.sort_order}
                onChange={(e) => setData("sort_order", Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Published</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={data.is_published as boolean}
                  onCheckedChange={(v) => setData("is_published", v)}
                />
                <span className="text-sm text-muted-foreground">
                  {data.is_published ? "Visible to staff" : "Hidden"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={processing} className="bg-brand hover:bg-[#185a3c] text-white">
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? "Save Changes" : "Add FAQ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FaqManagerPage({ faqs = [] }: FaqManagerPageProps) {
  const handleDelete = (id: number) => {
    router.delete(`/admin/faqs/${id}`);
  };

  const grouped = faqs.reduce<Record<string, FaqEntry[]>>((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Manage FAQs</h1>
              <p className="text-sm text-muted-foreground">{faqs.length} total entries</p>
            </div>
          </div>
          <FaqDialog
            trigger={
              <Button className="bg-brand hover:bg-[#185a3c] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ
              </Button>
            }
          />
        </div>

        {/* FAQ list grouped by category */}
        {faqs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-border rounded-lg bg-card">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-foreground mb-1">No FAQs yet</p>
            <p className="text-sm">Add your first FAQ to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, entries]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    className={`text-xs ${categoryColors[category] ?? "bg-muted text-muted-foreground"}`}
                    variant="secondary"
                  >
                    {category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{entries.length} entries</span>
                </div>
                <div className="space-y-2">
                  {entries.map((faq) => (
                    <div
                      key={faq.id}
                      className="p-4 border border-border rounded-lg bg-card flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">{faq.question}</p>
                          {!faq.is_published && (
                            <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <FaqDialog
                          faq={faq}
                          trigger={
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the FAQ entry. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(faq.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

FaqManagerPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
