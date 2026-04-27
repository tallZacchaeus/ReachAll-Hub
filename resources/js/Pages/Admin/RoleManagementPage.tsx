import { router, useForm } from "@inertiajs/react";
import { Shield, Plus, Pencil, Trash2, Lock, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PermissionItem {
  id: number;
  name: string;
  label: string;
  module: string;
  description: string;
}

interface RoleItem {
  id: number;
  name: string;
  label: string;
  description: string;
  is_system: boolean;
  permissions: string[];
}

interface RoleManagementPageProps {
  roles: RoleItem[];
  permissions: PermissionItem[];
}

// ─── Permission group component ───────────────────────────────────────────────

function PermissionGroup({
  module,
  perms,
  selected,
  onChange,
}: {
  module: string;
  perms: PermissionItem[];
  selected: string[];
  onChange: (name: string, checked: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const allChecked = perms.every((p) => selected.includes(p.name));

  function toggleAll() {
    const names = perms.map((p) => p.name);
    if (allChecked) {
      names.forEach((n) => onChange(n, false));
    } else {
      names.forEach((n) => onChange(n, true));
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-sm font-semibold capitalize text-foreground">{module}</span>
          <Badge variant="secondary" className="text-xs">{perms.length}</Badge>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleAll(); }}
          className="text-xs text-brand hover:underline"
        >
          {allChecked ? "Deselect all" : "Select all"}
        </button>
      </button>
      {open && (
        <div className="p-3 grid grid-cols-1 gap-2">
          {perms.map((p) => (
            <div key={p.name} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/30">
              <Checkbox
                id={p.name}
                checked={selected.includes(p.name)}
                onCheckedChange={(checked) => onChange(p.name, !!checked)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor={p.name} className="text-sm font-medium cursor-pointer">
                  {p.label}
                </Label>
                <p className="text-xs text-muted-foreground">{p.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Role Form Dialog ─────────────────────────────────────────────────────────

function RoleFormDialog({
  open,
  onClose,
  permissions,
  editingRole,
}: {
  open: boolean;
  onClose: () => void;
  permissions: PermissionItem[];
  editingRole: RoleItem | null;
}) {
  const isEdit = !!editingRole;
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: editingRole?.name ?? "",
    label: editingRole?.label ?? "",
    description: editingRole?.description ?? "",
    permissions: editingRole?.permissions ?? [] as string[],
  });

  // Group permissions by module
  const grouped = permissions.reduce<Record<string, PermissionItem[]>>((acc, p) => {
    (acc[p.module] = acc[p.module] ?? []).push(p);
    return acc;
  }, {});

  function togglePermission(name: string, checked: boolean) {
    setData("permissions", checked
      ? [...data.permissions, name]
      : data.permissions.filter((p) => p !== name)
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit && editingRole) {
      put(`/admin/roles/${editingRole.id}`, {
        onSuccess: () => { reset(); onClose(); },
      });
    } else {
      post("/admin/roles", {
        onSuccess: () => { reset(); onClose(); },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Role: ${editingRole?.label}` : "Create New Role"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <div className="space-y-1">
                <Label htmlFor="role-name">Role Slug <span className="text-destructive">*</span></Label>
                <Input
                  id="role-name"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="e.g. dept_head"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                <p className="text-xs text-muted-foreground">Lowercase, underscores only. Cannot be changed after creation.</p>
              </div>
            )}
            <div className={`space-y-1 ${isEdit ? "col-span-2" : ""}`}>
              <Label htmlFor="role-label">Display Name <span className="text-destructive">*</span></Label>
              <Input
                id="role-label"
                value={data.label}
                onChange={(e) => setData("label", e.target.value)}
                placeholder="e.g. Department Head"
                className={errors.label ? "border-destructive" : ""}
              />
              {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea
              id="role-desc"
              value={data.description}
              onChange={(e) => setData("description", e.target.value)}
              placeholder="What is this role used for?"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Permissions</Label>
            <p className="text-xs text-muted-foreground">{data.permissions.length} of {permissions.length} selected</p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {Object.entries(grouped).map(([module, perms]) => (
                <PermissionGroup
                  key={module}
                  module={module}
                  perms={perms}
                  selected={data.permissions}
                  onChange={togglePermission}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand/90 text-white">
              {processing ? "Saving…" : isEdit ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoleManagementPage({ roles, permissions }: RoleManagementPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);

  function openCreate() {
    setEditingRole(null);
    setFormOpen(true);
  }

  function openEdit(role: RoleItem) {
    setEditingRole(role);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deletingRole) return;
    router.delete(`/admin/roles/${deletingRole.id}`, {
      onSuccess: () => { setDeletingRole(null); toast.success("Role deleted."); },
    });
  }

  // Group permissions by module for the legend
  const modules = [...new Set(permissions.map((p) => p.module))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground flex items-center gap-3">
            <Shield className="w-7 h-7 text-brand" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage roles and their permissions. System roles cannot be deleted.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-brand hover:bg-brand/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Role
        </Button>
      </div>

      {/* Roles grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="border-2 border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base">{role.label}</CardTitle>
                    {role.is_system && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 gap-1">
                        <Lock className="w-3 h-3" /> System
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{role.name}</p>
                  {role.description && (
                    <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(role)}
                    aria-label={`Edit ${role.label}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {!role.is_system && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setDeletingRole(role)}
                      aria-label={`Delete ${role.label}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {role.permissions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No permissions assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs font-mono">
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission legend */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">All Available Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{module}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
                  {permissions.filter((p) => p.module === module).map((p) => (
                    <div key={p.name} className="p-2 rounded-md bg-muted/30">
                      <p className="text-xs font-mono text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <RoleFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingRole(null); }}
        permissions={permissions}
        editingRole={editingRole}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingRole} onOpenChange={(o) => !o && setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role "{deletingRole?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role and remove all its permission assignments.
              Users currently assigned this role will lose the associated access immediately.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

RoleManagementPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
