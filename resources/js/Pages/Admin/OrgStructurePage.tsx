import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Pencil, Trash2, MapPin, Briefcase, Users } from "lucide-react";
import { toast } from "sonner";
import type { Department, JobLevel, JobPosition, OfficeLocation } from "@/types/org";

// ─── Manager / department selector helper ────────────────────────────────────

interface Manager { id: number; name: string; employee_id: string | null; department: string | null; }

// ─── Departments Tab ─────────────────────────────────────────────────────────

function DepartmentsTab({
  departments,
  managers,
}: {
  departments: Department[];
  managers: Manager[];
}) {
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [open, setOpen] = useState(false);

  const { data, setData, post, put, processing, errors, reset } = useForm<{
    code: string;
    name: string;
    description: string;
    parent_department_id: number | null;
    head_user_id: number | null;
    is_active: boolean;
  }>({
    code: "",
    name: "",
    description: "",
    parent_department_id: null,
    head_user_id: null,
    is_active: true,
  });

  function openCreate() {
    reset();
    setEditing(null);
    setOpen(true);
  }

  function openEdit(dept: Department) {
    setData({
      code: dept.code,
      name: dept.name,
      description: dept.description ?? "",
      parent_department_id: dept.parent_department_id ?? null,
      head_user_id: dept.head_user_id ?? null,
      is_active: dept.is_active,
    });
    setEditing(dept);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      put(`/admin/org/departments/${editing.id}`, {
        onSuccess: () => { reset(); setOpen(false); },
      });
    } else {
      post("/admin/org/departments", {
        onSuccess: () => { reset(); setOpen(false); },
      });
    }
  }

  function handleDelete() {
    if (!deleting) return;
    router.delete(`/admin/org/departments/${deleting.id}`, {
      onSuccess: () => { setDeleting(null); toast.success("Department deleted."); },
      onError: (e) => toast.error(Object.values(e)[0] as string),
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{departments.length} department{departments.length !== 1 ? "s" : ""}</p>
        <Button onClick={openCreate} size="sm" className="bg-brand hover:bg-brand/90 text-white">
          <Plus className="w-4 h-4 mr-1" /> New Department
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {departments.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center py-12 text-center gap-2 text-muted-foreground">
            <Building2 className="w-10 h-10 opacity-30" />
            <p className="font-medium">No departments yet</p>
            <p className="text-xs">Create your first department to start organising your team.</p>
          </div>
        ) : departments.map((dept) => (
          <Card key={dept.id} className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm">{dept.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs font-mono">{dept.code}</Badge>
                    {!dept.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                  </div>
                  {dept.parent_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">Under: {dept.parent_name}</p>
                  )}
                  {dept.head_name && (
                    <p className="text-xs text-muted-foreground">Head: {dept.head_name}</p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(dept)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setDeleting(dept)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{dept.employee_count} employee{dept.employee_count !== 1 ? "s" : ""}</span>
                {dept.description && <span className="truncate">{dept.description}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit: ${editing.name}` : "New Department"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code <span className="text-destructive">*</span></Label>
                <Input value={data.code} onChange={(e) => setData("code", e.target.value)} placeholder="e.g. ENG" className={errors.code ? "border-destructive" : ""} />
                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
              </div>
              <div className="space-y-1">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={data.name} onChange={(e) => setData("name", e.target.value)} placeholder="Engineering" className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={data.description} onChange={(e) => setData("description", e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Parent Department</Label>
                <Select
                  value={data.parent_department_id != null ? String(data.parent_department_id) : "none"}
                  onValueChange={(v) => setData("parent_department_id", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {departments.filter((d) => d.id !== editing?.id).map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Department Head</Label>
                <Select
                  value={data.head_user_id != null ? String(data.head_user_id) : "none"}
                  onValueChange={(v) => setData("head_user_id", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={data.is_active} onCheckedChange={(v) => setData("is_active", v)} id="dept-active" />
              <Label htmlFor="dept-active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand/90 text-white">
                {processing ? "Saving…" : editing ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the department. It cannot be deleted if it has employees or sub-departments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Positions Tab ────────────────────────────────────────────────────────────

function PositionsTab({
  positions,
  levels,
  departments,
}: {
  positions: JobPosition[];
  levels: JobLevel[];
  departments: { id: number; name: string }[];
}) {
  const [editing, setEditing] = useState<JobPosition | null>(null);
  const [deleting, setDeleting] = useState<JobPosition | null>(null);
  const [open, setOpen] = useState(false);

  const { data, setData, post, put, processing, errors, reset } = useForm<{
    code: string;
    title: string;
    department_id: number | null;
    job_level_id: number | null;
    description: string;
    is_active: boolean;
  }>({
    code: "",
    title: "",
    department_id: null,
    job_level_id: null,
    description: "",
    is_active: true,
  });

  function openCreate() { reset(); setEditing(null); setOpen(true); }
  function openEdit(pos: JobPosition) {
    setData({
      code: pos.code,
      title: pos.title,
      department_id: pos.department_id ?? null,
      job_level_id: pos.job_level_id ?? null,
      description: pos.description ?? "",
      is_active: pos.is_active,
    });
    setEditing(pos);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      put(`/admin/org/positions/${editing.id}`, { onSuccess: () => { reset(); setOpen(false); } });
    } else {
      post("/admin/org/positions", { onSuccess: () => { reset(); setOpen(false); } });
    }
  }

  function handleDelete() {
    if (!deleting) return;
    router.delete(`/admin/org/positions/${deleting.id}`, {
      onSuccess: () => { setDeleting(null); toast.success("Position deleted."); },
      onError: (e) => toast.error(Object.values(e)[0] as string),
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{positions.length} position{positions.length !== 1 ? "s" : ""}</p>
        <Button onClick={openCreate} size="sm" className="bg-brand hover:bg-brand/90 text-white">
          <Plus className="w-4 h-4 mr-1" /> New Position
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {positions.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center py-12 text-center gap-2 text-muted-foreground">
            <Briefcase className="w-10 h-10 opacity-30" />
            <p className="font-medium">No positions yet</p>
            <p className="text-xs">Create job positions to assign to employees.</p>
          </div>
        ) : positions.map((pos) => (
          <Card key={pos.id} className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm">{pos.title}</CardTitle>
                    {pos.level_code && <Badge variant="secondary" className="text-xs">{pos.level_code} — {pos.level_name}</Badge>}
                    {!pos.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                  </div>
                  {pos.department_name && <p className="text-xs text-muted-foreground mt-0.5">{pos.department_name}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(pos)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleting(pos)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />{pos.employee_count} employee{pos.employee_count !== 1 ? "s" : ""}
                {pos.description && <span className="ml-2 truncate">{pos.description}</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit: ${editing.title}` : "New Job Position"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code <span className="text-destructive">*</span></Label>
                <Input value={data.code} onChange={(e) => setData("code", e.target.value)} placeholder="e.g. SWE_SEN" className={errors.code ? "border-destructive" : ""} />
                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
              </div>
              <div className="space-y-1">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input value={data.title} onChange={(e) => setData("title", e.target.value)} placeholder="Senior Engineer" className={errors.title ? "border-destructive" : ""} />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Department</Label>
                <Select
                  value={data.department_id != null ? String(data.department_id) : "none"}
                  onValueChange={(v) => setData("department_id", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any</SelectItem>
                    {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Job Level</Label>
                <Select
                  value={data.job_level_id != null ? String(data.job_level_id) : "none"}
                  onValueChange={(v) => setData("job_level_id", v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Unset" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unset</SelectItem>
                    {levels.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.code} — {l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={data.description} onChange={(e) => setData("description", e.target.value)} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={data.is_active} onCheckedChange={(v) => setData("is_active", v)} id="pos-active" />
              <Label htmlFor="pos-active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand/90 text-white">
                {processing ? "Saving…" : editing ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>Cannot delete if employees are assigned. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Locations Tab ────────────────────────────────────────────────────────────

function LocationsTab({ locations }: { locations: OfficeLocation[] }) {
  const [editing, setEditing] = useState<OfficeLocation | null>(null);
  const [deleting, setDeleting] = useState<OfficeLocation | null>(null);
  const [open, setOpen] = useState(false);

  const { data, setData, post, put, processing, errors, reset } = useForm({
    code: "", name: "", address: "", city: "", state: "", country: "Nigeria", is_active: true,
  });

  function openCreate() { reset(); setEditing(null); setOpen(true); }
  function openEdit(loc: OfficeLocation) {
    setData({ code: loc.code, name: loc.name, address: loc.address ?? "", city: loc.city ?? "", state: loc.state ?? "", country: loc.country, is_active: loc.is_active });
    setEditing(loc); setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      put(`/admin/org/locations/${editing.id}`, { onSuccess: () => { reset(); setOpen(false); } });
    } else {
      post("/admin/org/locations", { onSuccess: () => { reset(); setOpen(false); } });
    }
  }

  function handleDelete() {
    if (!deleting) return;
    router.delete(`/admin/org/locations/${deleting.id}`, {
      onSuccess: () => { setDeleting(null); toast.success("Location deleted."); },
      onError: (e) => toast.error(Object.values(e)[0] as string),
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{locations.length} location{locations.length !== 1 ? "s" : ""}</p>
        <Button onClick={openCreate} size="sm" className="bg-brand hover:bg-brand/90 text-white">
          <Plus className="w-4 h-4 mr-1" /> New Location
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {locations.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center py-12 text-center gap-2 text-muted-foreground">
            <MapPin className="w-10 h-10 opacity-30" />
            <p className="font-medium">No locations yet</p>
            <p className="text-xs">Add office locations for your team.</p>
          </div>
        ) : locations.map((loc) => (
          <Card key={loc.id} className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm">{loc.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs font-mono">{loc.code}</Badge>
                    {!loc.is_active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[loc.city, loc.state, loc.country].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(loc)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleting(loc)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />{loc.employee_count} employee{loc.employee_count !== 1 ? "s" : ""}
                {loc.address && <span className="ml-2 truncate">{loc.address}</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? `Edit: ${editing.name}` : "New Office Location"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code <span className="text-destructive">*</span></Label>
                <Input value={data.code} onChange={(e) => setData("code", e.target.value)} placeholder="HQ" className={errors.code ? "border-destructive" : ""} />
                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
              </div>
              <div className="space-y-1">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={data.name} onChange={(e) => setData("name", e.target.value)} placeholder="Head Office" className={errors.name ? "border-destructive" : ""} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input value={data.address} onChange={(e) => setData("address", e.target.value)} placeholder="123 Main Street" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={data.city} onChange={(e) => setData("city", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={data.state} onChange={(e) => setData("state", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Country</Label>
                <Input value={data.country} onChange={(e) => setData("country", e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={data.is_active} onCheckedChange={(v) => setData("is_active", v)} id="loc-active" />
              <Label htmlFor="loc-active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={processing} className="bg-brand hover:bg-brand/90 text-white">
                {processing ? "Saving…" : editing ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Cannot delete if employees are assigned to this location.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface OrgStructurePageProps {
  tab: "departments" | "positions" | "locations";
  departments?: Department[];
  managers?: Manager[];
  levels?: JobLevel[];
  positions?: JobPosition[];
  locations?: OfficeLocation[];
}

export default function OrgStructurePage({
  tab,
  departments = [],
  managers = [],
  levels = [],
  positions = [],
  locations = [],
}: OrgStructurePageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground flex items-center gap-3">
          <Building2 className="w-7 h-7 text-brand" />
          Org Structure
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage departments, job positions, and office locations.
        </p>
      </div>

      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="departments" onClick={() => router.visit("/admin/org/departments", { preserveState: true })}>
            <Building2 className="w-4 h-4 mr-1.5" />Departments
          </TabsTrigger>
          <TabsTrigger value="positions" onClick={() => router.visit("/admin/org/positions", { preserveState: true })}>
            <Briefcase className="w-4 h-4 mr-1.5" />Positions
          </TabsTrigger>
          <TabsTrigger value="locations" onClick={() => router.visit("/admin/org/locations", { preserveState: true })}>
            <MapPin className="w-4 h-4 mr-1.5" />Locations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab departments={departments} managers={managers} />
        </TabsContent>
        <TabsContent value="positions" className="mt-4">
          <PositionsTab positions={positions} levels={levels} departments={departments} />
        </TabsContent>
        <TabsContent value="locations" className="mt-4">
          <LocationsTab locations={locations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

OrgStructurePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
