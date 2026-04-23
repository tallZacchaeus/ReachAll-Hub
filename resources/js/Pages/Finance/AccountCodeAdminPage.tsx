import { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import { Plus, Pencil, Search, Hash, Save, X, CheckCircle2 } from "lucide-react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

interface AccountCode {
  id: number;
  code: string;
  category: string;
  category_label: string;
  description: string;
  tax_vat_applicable: boolean;
  tax_wht_applicable: boolean;
  wht_rate: number | null;
  status: "active" | "inactive";
}

interface Filters {
  q?: string;
  category?: string;
  status?: string;
}

interface AccountCodeAdminPageProps {
  codes: AccountCode[];
  categories: string[];
  filters: Filters;
}

const CATEGORY_LABELS: Record<string, string> = {
  "5000": "Personnel Costs",
  "6000": "Operations",
  "7000": "Travel & Transport",
  "8000": "Programs & Production",
  "9000": "Technology & Software",
  "9500": "Capital Expenditure",
};

const CATEGORY_COLORS: Record<string, string> = {
  "5000": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "6000": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "7000": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "8000": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "9000": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "9500": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

interface CodeFormData {
  category: string;
  description: string;
  tax_vat_applicable: boolean;
  tax_wht_applicable: boolean;
  wht_rate: string;
  status: string;
  [key: string]: string | boolean;
}

function AccountCodeDialog({
  open,
  onClose,
  code,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  code: AccountCode | null;
  categories: string[];
}) {
  const isEdit = code !== null;
  const { data, setData, post, put, processing, errors, reset } =
    useForm<CodeFormData>({
      code: (code as any)?.code ?? "",
      category: code?.category ?? categories[0],
      description: code?.description ?? "",
      tax_vat_applicable: code?.tax_vat_applicable ?? false,
      tax_wht_applicable: code?.tax_wht_applicable ?? false,
      wht_rate: code?.wht_rate != null ? String(code.wht_rate) : "",
      status: code?.status ?? "active",
    });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      put(`/finance/admin/account-codes/${code!.id}`, {
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    } else {
      post("/finance/admin/account-codes", {
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
          <DialogTitle>{isEdit ? `Edit Code ${code?.code}` : "Add Account Code"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <Label htmlFor="code">Code (4 digits) *</Label>
              <Input
                id="code"
                value={(data as any).code}
                onChange={(e) => setData("code" as any, e.target.value)}
                placeholder="e.g. 6013"
                maxLength={4}
              />
              {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
            </div>
          )}
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={data.category as string} onValueChange={(v) => setData("category", v)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] ?? cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={data.description as string}
              onChange={(e) => setData("description", e.target.value)}
              placeholder="e.g. Office Supplies & Stationery"
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="vat"
                checked={data.tax_vat_applicable as boolean}
                onCheckedChange={(v) => setData("tax_vat_applicable", v)}
              />
              <Label htmlFor="vat">VAT Applicable</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="wht"
                checked={data.tax_wht_applicable as boolean}
                onCheckedChange={(v) => setData("tax_wht_applicable", v)}
              />
              <Label htmlFor="wht">WHT Applicable</Label>
            </div>
          </div>
          {data.tax_wht_applicable && (
            <div>
              <Label htmlFor="wht_rate">WHT Rate (%)</Label>
              <Input
                id="wht_rate"
                type="number"
                min={0}
                max={100}
                value={data.wht_rate as string}
                onChange={(e) => setData("wht_rate", e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
          )}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={data.status as string} onValueChange={(v) => setData("status", v)}>
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
              <Save className="w-4 h-4 mr-1" /> {isEdit ? "Save Changes" : "Add Code"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountCodeAdminPage({
  codes,
  categories,
  filters,
}: AccountCodeAdminPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AccountCode | null>(null);
  const [search, setSearch] = useState(filters.q ?? "");
  const [categoryFilter, setCategoryFilter] = useState(filters.category ?? "all");
  const [statusFilter, setStatusFilter] = useState(filters.status ?? "all");

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(ac: AccountCode) {
    setEditing(ac);
    setDialogOpen(true);
  }

  function applyFilters(q: string, category: string, status: string) {
    router.visit("/finance/admin/account-codes", {
      data: {
        q: q || undefined,
        category: category !== "all" ? category : undefined,
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
            <Hash className="w-6 h-6 text-blue-500" />
            Account Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chart of accounts — expense codes used on all payment requests
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Code
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search code or description…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              applyFilters(e.target.value, categoryFilter, statusFilter);
            }}
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            applyFilters(search, v, statusFilter);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat] ?? cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            applyFilters(search, categoryFilter, v);
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
        <div className="overflow-x-auto">

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-16 text-center">VAT</TableHead>
              <TableHead className="w-16 text-center">WHT</TableHead>
              <TableHead className="w-20 text-center">WHT Rate</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No account codes found.
                </TableCell>
              </TableRow>
            ) : (
              codes.map((ac) => (
                <TableRow key={ac.id}>
                  <TableCell className="font-mono font-semibold">{ac.code}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        CATEGORY_COLORS[ac.category] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ac.category_label}
                    </span>
                  </TableCell>
                  <TableCell>{ac.description}</TableCell>
                  <TableCell className="text-center">
                    {ac.tax_vat_applicable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {ac.tax_wht_applicable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {ac.wht_rate != null ? `${ac.wht_rate}%` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        ac.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : ""
                      }
                      variant={ac.status === "active" ? "default" : "secondary"}
                    >
                      {ac.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(ac)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AccountCodeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        code={editing}
        categories={categories}
      />
    </div>
  );
}

AccountCodeAdminPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
