import { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import { Plus, Pencil, Search, Building2, Save, X, CheckCircle2, XCircle } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Vendor {
  id: number;
  name: string;
  tax_id: string | null;
  bank_name: string | null;
  bank_account: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: "active" | "inactive";
}

interface Filters {
  q?: string;
  status?: string;
}

interface VendorAdminPageProps {
  vendors: Vendor[];
  filters: Filters;
}

interface VendorFormData {
  name: string;
  tax_id: string;
  bank_name: string;
  bank_account: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  [key: string]: string;
}

function VendorDialog({
  open,
  onClose,
  vendor,
}: {
  open: boolean;
  onClose: () => void;
  vendor: Vendor | null;
}) {
  const isEdit = vendor !== null;
  const { data, setData, post, put, processing, errors, reset } =
    useForm<VendorFormData>({
      name: vendor?.name ?? "",
      tax_id: vendor?.tax_id ?? "",
      bank_name: vendor?.bank_name ?? "",
      bank_account: vendor?.bank_account ?? "",
      contact_email: vendor?.contact_email ?? "",
      contact_phone: vendor?.contact_phone ?? "",
      status: vendor?.status ?? "active",
    });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      put(`/finance/admin/vendors/${vendor!.id}`, {
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    } else {
      post("/finance/admin/vendors", {
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Vendor Name *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
              placeholder="e.g. Apex Systems Nigeria Ltd"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tax_id">Tax ID (TIN)</Label>
              <Input
                id="tax_id"
                value={data.tax_id}
                onChange={(e) => setData("tax_id", e.target.value)}
                placeholder="TIN-12345678-0001"
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">Phone</Label>
              <Input
                id="contact_phone"
                value={data.contact_phone}
                onChange={(e) => setData("contact_phone", e.target.value)}
                placeholder="08012345678"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={data.contact_email}
              onChange={(e) => setData("contact_email", e.target.value)}
              placeholder="billing@vendor.ng"
            />
            {errors.contact_email && (
              <p className="text-sm text-red-600 mt-1">{errors.contact_email}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={data.bank_name}
                onChange={(e) => setData("bank_name", e.target.value)}
                placeholder="Zenith Bank"
              />
            </div>
            <div>
              <Label htmlFor="bank_account">Account Number</Label>
              <Input
                id="bank_account"
                value={data.bank_account}
                onChange={(e) => setData("bank_account", e.target.value)}
                placeholder="2012345678"
              />
            </div>
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
              <Save className="w-4 h-4 mr-1" /> {isEdit ? "Save Changes" : "Add Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VendorAdminPage({ vendors, filters }: VendorAdminPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [search, setSearch] = useState(filters.q ?? "");
  const [statusFilter, setStatusFilter] = useState(filters.status ?? "all");

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(v: Vendor) {
    setEditing(v);
    setDialogOpen(true);
  }

  function applyFilters(q: string, status: string) {
    router.visit("/finance/admin/vendors", {
      data: {
        q: q || undefined,
        status: status !== "all" ? status : undefined,
      },
      preserveState: true,
      replace: true,
    });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-500" />
            Vendor Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage approved vendors and their banking details
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Vendor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, email, TIN…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              applyFilters(e.target.value, statusFilter);
            }}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            applyFilters(search, v);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor Name</TableHead>
              <TableHead>TIN</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No vendors found.
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.tax_id ?? "—"}</TableCell>
                  <TableCell className="text-sm">{v.bank_name ?? "—"}</TableCell>
                  <TableCell className="text-sm font-mono">{v.bank_account ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    <div>{v.contact_email ?? "—"}</div>
                    {v.contact_phone && (
                      <div className="text-muted-foreground">{v.contact_phone}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {v.status === "active" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" /> Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(v)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <VendorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        vendor={editing}
      />
    </div>
  );
}

VendorAdminPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
