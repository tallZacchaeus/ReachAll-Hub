import { useForm } from "@inertiajs/react";
import { Plus, Pencil, GitBranch, Save, X, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import MainLayout from "@/layouts/MainLayout";

interface User {
  id: number;
  name: string;
  department: string;
}

interface CostCentreNode {
  id: number;
  code: string;
  name: string;
  parent_id: number | null;
  head_user_id: number | null;
  head_name: string | null;
  budget_kobo: number;
  status: "active" | "inactive";
  depth: number;
  children?: CostCentreNode[];
}

interface CostCentreAdminPageProps {
  tree: CostCentreNode[];
  users: User[];
}

function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(0)}K`;
  return `₦${naira.toLocaleString()}`;
}

// Flatten tree to list for parent dropdown
function flattenTree(nodes: CostCentreNode[]): CostCentreNode[] {
  const result: CostCentreNode[] = [];
  function walk(list: CostCentreNode[]) {
    for (const node of list) {
      result.push(node);
      if (node.children) walk(node.children);
    }
  }
  walk(nodes);
  return result;
}

interface CcFormData {
  code: string;
  name: string;
  parent_id: string;
  head_user_id: string;
  budget_kobo: string;
  status: string;
  [key: string]: string;
}

function CostCentreDialog({
  open,
  onClose,
  node,
  allNodes,
  users,
}: {
  open: boolean;
  onClose: () => void;
  node: CostCentreNode | null;
  allNodes: CostCentreNode[];
  users: User[];
}) {
  const isEdit = node !== null;
  const { data, setData, post, put, processing, errors, reset } =
    useForm<CcFormData>({
      code: node?.code ?? "",
      name: node?.name ?? "",
      parent_id: node?.parent_id != null ? String(node.parent_id) : "none",
      head_user_id: node?.head_user_id != null ? String(node.head_user_id) : "none",
      budget_kobo: node != null ? String(node.budget_kobo) : "",
      status: node?.status ?? "active",
    });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...data,
      parent_id: data.parent_id !== "none" ? data.parent_id : "",
      head_user_id: data.head_user_id !== "none" ? data.head_user_id : "",
    };

    if (isEdit) {
      put(`/finance/admin/cost-centres/${node!.id}`, {
        data: payload,
        onSuccess: () => {
          onClose();
          reset();
        },
      } as Parameters<typeof put>[1]);
    } else {
      post("/finance/admin/cost-centres", {
        data: payload,
        onSuccess: () => {
          onClose();
          reset();
        },
      } as Parameters<typeof post>[1]);
    }
  }

  // Exclude self and descendants from parent options to prevent cycles
  const eligibleParents = allNodes.filter((n) => !isEdit || n.id !== node!.id);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${node?.code} — ${node?.name}` : "Add Cost Centre"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <Label htmlFor="code">Code (4 digits) *</Label>
              <Input
                id="code"
                value={data.code}
                onChange={(e) => setData("code", e.target.value)}
                placeholder="e.g. 1300"
                maxLength={4}
              />
              {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
            </div>
          )}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
              placeholder="e.g. IT & Digital"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="parent_id">Parent Cost Centre</Label>
            <Select
              value={data.parent_id}
              onValueChange={(v) => setData("parent_id", v)}
            >
              <SelectTrigger id="parent_id">
                <SelectValue placeholder="None (root)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (root level)</SelectItem>
                {eligibleParents.map((n) => (
                  <SelectItem key={n.id} value={String(n.id)}>
                    {"  ".repeat(n.depth)}{n.code} — {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="head_user_id">Department Head</Label>
            <Select
              value={data.head_user_id}
              onValueChange={(v) => setData("head_user_id", v)}
            >
              <SelectTrigger id="head_user_id">
                <SelectValue placeholder="Not assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not assigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} — {u.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="budget_kobo">Annual Budget (₦) *</Label>
            <Input
              id="budget_kobo"
              type="number"
              min={0}
              value={data.budget_kobo}
              onChange={(e) => setData("budget_kobo", e.target.value)}
              placeholder="e.g. 5000000 (= ₦50,000.00)"
            />
            {data.budget_kobo && (
              <p className="text-xs text-muted-foreground mt-1">
                = {formatNaira(Number(data.budget_kobo))} (value in kobo)
              </p>
            )}
            {errors.budget_kobo && (
              <p className="text-sm text-red-600 mt-1">{errors.budget_kobo}</p>
            )}
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={data.status} onValueChange={(v) => setData("status", v)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              <Save className="w-4 h-4 mr-1" /> {isEdit ? "Save Changes" : "Add Cost Centre"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const DEPTH_COLORS = [
  "border-l-4 border-emerald-400",
  "border-l-4 border-blue-400 ml-6",
  "border-l-4 border-purple-400 ml-12",
];

const DEPTH_BG = [
  "bg-card",
  "bg-muted/30",
  "bg-muted/10",
];

function CostCentreRow({
  node,
  onEdit,
}: {
  node: CostCentreNode;
  onEdit: (n: CostCentreNode) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <div
        className={`flex items-center justify-between p-4 rounded-lg border mb-2 ${DEPTH_COLORS[node.depth] ?? ""} ${DEPTH_BG[node.depth] ?? ""}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span className="font-mono text-sm font-bold text-muted-foreground w-12 shrink-0">
            {node.code}
          </span>
          <span className="font-medium truncate">{node.name}</span>
          {node.head_name && (
            <span className="text-xs text-muted-foreground truncate hidden sm:block">
              · {node.head_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hidden sm:block">
            {formatNaira(node.budget_kobo)}
          </span>
          <Badge
            variant={node.status === "active" ? "default" : "secondary"}
            className={
              node.status === "active"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : ""
            }
          >
            {node.status}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => onEdit(node)}>
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <CostCentreRow key={child.id} node={child} onEdit={onEdit} />
          ))}
        </div>
      )}
    </>
  );
}

export default function CostCentreAdminPage({ tree, users }: CostCentreAdminPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CostCentreNode | null>(null);
  const allNodes = flattenTree(tree);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(node: CostCentreNode) {
    setEditing(node);
    setDialogOpen(true);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-emerald-500" />
            Cost Centres
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hierarchical budget structure — {allNodes.length} centres total
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Cost Centre
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Division
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Department
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-purple-400 inline-block" /> Sub-unit
        </span>
      </div>

      {/* Tree */}
      <div>
        {tree.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">No cost centres found.</p>
        ) : (
          tree.map((root) => (
            <CostCentreRow key={root.id} node={root} onEdit={openEdit} />
          ))
        )}
      </div>

      <CostCentreDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        node={editing}
        allNodes={allNodes}
        users={users}
      />
    </div>
  );
}

CostCentreAdminPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
