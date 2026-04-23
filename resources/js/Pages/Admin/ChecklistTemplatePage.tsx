import MainLayout from "@/layouts/MainLayout";
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ListChecks,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Save,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePage } from "@inertiajs/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface TemplateRow {
  id: number;
  title: string;
  description: string | null;
  stage: string;
  is_default: boolean;
  item_count: number;
  assignment_count: number;
}

interface ChecklistTemplatePageProps {
  templates: TemplateRow[];
}

interface ItemFormData {
  id?: number;
  title: string;
  description: string;
  is_required: boolean;
}

type FormData = {
  title: string;
  description: string;
  stage: string;
  is_default: boolean;
  items: ItemFormData[];
};

const ITEM_TYPE = "CHECKLIST_ITEM";

const STAGE_STYLES: Record<string, string> = {
  joiner: "border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  performer: "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  leader: "border-purple-300 text-purple-600 bg-purple-50 dark:bg-purple-950/30",
};

// Draggable item row
function DraggableItem({
  item,
  index,
  onUpdate,
  onDelete,
  onMove,
}: {
  item: ItemFormData;
  index: number;
  onUpdate: (index: number, field: keyof ItemFormData, value: string | boolean) => void;
  onDelete: (index: number) => void;
  onMove: (from: number, to: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(dragged: { index: number }) {
      if (dragged.index !== index) {
        onMove(dragged.index, index);
        dragged.index = index;
      }
    },
  });

  preview(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-start gap-3 p-3 border border-border rounded-lg bg-background ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {/* Drag handle */}
      <div ref={(node) => { drag(node); }} className="mt-2.5 cursor-grab shrink-0 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Fields */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          value={item.title}
          onChange={(e) => onUpdate(index, "title", e.target.value)}
          placeholder="Item title *"
          className="text-sm"
        />
        <Input
          value={item.description}
          onChange={(e) => onUpdate(index, "description", e.target.value)}
          placeholder="Description (optional)"
          className="text-sm"
        />
      </div>

      {/* Required toggle */}
      <div className="flex items-center gap-1.5 shrink-0 mt-2">
        <Switch
          checked={item.is_required}
          onCheckedChange={(v) => onUpdate(index, "is_required", v)}
          className="scale-90"
        />
        <span className="text-xs text-muted-foreground">Req.</span>
      </div>

      {/* Delete */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 shrink-0 mt-1"
        onClick={() => onDelete(index)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function TemplateForm({
  initial,
  onCancel,
  isEdit,
}: {
  initial?: TemplateRow;
  onCancel: () => void;
  isEdit: boolean;
}) {
  const { data, setData, post, put, processing, errors } = useForm<FormData>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    stage: initial?.stage ?? "joiner",
    is_default: initial?.is_default ?? false,
    items: [],
  });

  const [items, setItems] = useState<ItemFormData[]>([]);

  const addItem = () =>
    setItems((prev) => [...prev, { title: "", description: "", is_required: true }]);

  const updateItem = (index: number, field: keyof ItemFormData, value: string | boolean) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const deleteItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const moveItem = useCallback((from: number, to: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...data, items };
    if (isEdit && initial) {
      put(route("admin.checklists.update", initial.id), {
        data: payload,
        onSuccess: onCancel,
      } as Parameters<typeof put>[1]);
    } else {
      post(route("admin.checklists.store"), {
        data: payload,
        onSuccess: () => { onCancel(); setItems([]); },
      } as Parameters<typeof post>[1]);
    }
  };

  return (
    <Card className="border-2 border-brand">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {isEdit ? `Editing: ${initial?.title}` : "New Checklist Template"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Template fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => setData("title", e.target.value)}
                placeholder="e.g. First Week Onboarding"
                className={errors.title ? "border-red-400" : ""}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={data.stage} onValueChange={(v) => setData("stage", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joiner">Joiner</SelectItem>
                  <SelectItem value="performer">Performer</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={2}
              value={data.description}
              onChange={(e) => setData("description", e.target.value)}
              placeholder="Brief description of this checklist…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_default"
              checked={data.is_default}
              onCheckedChange={(v) => setData("is_default", v)}
            />
            <Label htmlFor="is_default" className="cursor-pointer">
              Auto-assign to all new employees at this stage
            </Label>
          </div>

          <Separator />

          {/* Items editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Checklist Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                No items yet — click "Add Item" to start building the checklist.
              </p>
            ) : (
              <DndProvider backend={HTML5Backend}>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <DraggableItem
                      key={index}
                      item={item}
                      index={index}
                      onUpdate={updateItem}
                      onDelete={deleteItem}
                      onMove={moveItem}
                    />
                  ))}
                </div>
              </DndProvider>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand hover:bg-brand/90 text-white"
              disabled={processing}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? "Save Changes" : "Create Template"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ChecklistTemplatePage({ templates }: ChecklistTemplatePageProps) {
  const { props } = usePage<{ flash?: { success?: string } }>();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (props.flash?.success) toast.success(props.flash.success);
  }, [props.flash]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1 flex items-center gap-3">
            <ListChecks className="w-8 h-8 text-brand" />
            Checklist Templates
          </h1>
          <p className="text-muted-foreground">
            {templates.length} {templates.length === 1 ? "template" : "templates"}
          </p>
        </div>
        {!showCreate && (
          <Button
            className="bg-brand hover:bg-brand/90 text-white"
            onClick={() => { setShowCreate(true); setEditingId(null); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <TemplateForm isEdit={false} onCancel={() => setShowCreate(false)} />
      )}

      {/* Edit form */}
      {editingId !== null && (
        <TemplateForm
          isEdit
          initial={templates.find((t) => t.id === editingId)}
          onCancel={() => setEditingId(null)}
        />
      )}

      {/* Templates table */}
      {templates.length === 0 && !showCreate ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl text-muted-foreground">
          No templates yet.{" "}
          <button className="text-brand hover:underline" onClick={() => setShowCreate(true)}>
            Create the first one.
          </button>
        </div>
      ) : (
          <div className="overflow-x-auto">

          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-foreground">Title</TableHead>
                <TableHead className="text-foreground">Stage</TableHead>
                <TableHead className="text-foreground">Default</TableHead>
                <TableHead className="text-foreground">Items</TableHead>
                <TableHead className="text-foreground">Assigned</TableHead>
                <TableHead className="text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">{t.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${STAGE_STYLES[t.stage] ?? ""}`}
                    >
                      {t.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t.is_default ? (
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                        Default
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.item_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.assignment_count} users
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditingId(t.id); setShowCreate(false); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

ChecklistTemplatePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
