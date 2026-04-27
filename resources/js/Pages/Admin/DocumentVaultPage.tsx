import { Head, router, useForm } from "@inertiajs/react";
import { Upload, Download, Search, Filter, FileText, Trash2, Eye } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type { DocumentCategory } from "@/types/documents";

interface Employee {
    id: number;
    name: string;
    employee_id: string;
}

interface DocumentRow {
    id: number;
    title: string;
    version: number;
    status: string;
    requires_signature: boolean;
    effective_date: string | null;
    expires_at: string | null;
    created_at: string;
    employee: { id: number; name: string; employee_id: string } | null;
    category: { id: number; name: string; code: string } | null;
    uploaded_by: { id: number; name: string } | null;
}

interface PaginatedDocuments {
    data: DocumentRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta?: {
        current_page: number;
        last_page: number;
        total: number;
    };
    current_page?: number;
    last_page?: number;
    total?: number;
}

interface Props {
    documents: PaginatedDocuments;
    categories: DocumentCategory[];
    employees: Employee[];
    filters: {
        search?: string;
        category_id?: string;
        status?: string;
        user_id?: string;
    };
}

const STATUS_COLOURS: Record<string, string> = {
    active:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    draft:      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    superseded: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    expired:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DocumentVaultPage({ documents, categories, employees, filters }: Props) {
    const [uploadOpen, setUploadOpen] = useState(false);
    const [search, setSearch] = useState(filters.search ?? "");

    const total = documents.meta?.total ?? documents.total ?? 0;

    const uploadForm = useForm<{
        user_id: number | null;
        category_id: number | null;
        title: string;
        file: File | null;
        requires_signature: boolean;
        effective_date: string;
        expires_at: string;
        notes: string;
        signees: number[];
    }>({
        user_id: null,
        category_id: null,
        title: "",
        file: null,
        requires_signature: false,
        effective_date: "",
        expires_at: "",
        notes: "",
        signees: [],
    });

    function applyFilter(key: string, value: string) {
        router.get(
            "/admin/hr/documents",
            { ...filters, [key]: value || undefined, page: undefined },
            { preserveState: true, replace: true }
        );
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter("search", search);
    }

    function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        uploadForm.post("/admin/hr/documents", {
            forceFormData: true,
            onSuccess: () => {
                setUploadOpen(false);
                uploadForm.reset();
            },
        });
    }

    function handleDelete(doc: DocumentRow) {
        if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
        router.delete(`/admin/hr/documents/${doc.id}`, { preserveScroll: true });
    }

    // Determine which category is selected to auto-set requires_signature
    function handleCategoryChange(value: string) {
        if (value === "none") {
            uploadForm.setData("category_id", null);
            return;
        }
        const id = Number(value);
        const cat = categories.find((c) => c.id === id);
        uploadForm.setData("category_id", id);
        if (cat) {
            uploadForm.setData("requires_signature", cat.requires_signature);
        }
    }

    return (
        <MainLayout activePage="document-vault">
            <Head title="Document Vault" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Document Vault</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {total} document{total !== 1 ? "s" : ""} across all employees
                        </p>
                    </div>
                    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Upload className="h-4 w-4" />
                                Upload Document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Upload HR Document</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpload} className="space-y-4">
                                {/* Employee */}
                                <div className="space-y-1.5">
                                    <Label>Employee *</Label>
                                    <Select
                                        value={uploadForm.data.user_id != null ? String(uploadForm.data.user_id) : "none"}
                                        onValueChange={(v) => uploadForm.setData("user_id", v === "none" ? null : Number(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Select employee</SelectItem>
                                            {employees.map((e) => (
                                                <SelectItem key={e.id} value={String(e.id)}>
                                                    {e.name} ({e.employee_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {uploadForm.errors.user_id && (
                                        <p className="text-xs text-destructive">{uploadForm.errors.user_id}</p>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="space-y-1.5">
                                    <Label>Category *</Label>
                                    <Select
                                        value={uploadForm.data.category_id != null ? String(uploadForm.data.category_id) : "none"}
                                        onValueChange={handleCategoryChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Select category</SelectItem>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {uploadForm.errors.category_id && (
                                        <p className="text-xs text-destructive">{uploadForm.errors.category_id}</p>
                                    )}
                                </div>

                                {/* Title */}
                                <div className="space-y-1.5">
                                    <Label>Document Title *</Label>
                                    <Input
                                        value={uploadForm.data.title}
                                        onChange={(e) => uploadForm.setData("title", e.target.value)}
                                        placeholder="e.g. Employment Contract 2026"
                                    />
                                    {uploadForm.errors.title && (
                                        <p className="text-xs text-destructive">{uploadForm.errors.title}</p>
                                    )}
                                </div>

                                {/* File */}
                                <div className="space-y-1.5">
                                    <Label>File * (PDF, DOC, DOCX, PNG, JPG — max 20 MB)</Label>
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                        onChange={(e) => uploadForm.setData("file", e.target.files?.[0] ?? null)}
                                    />
                                    {uploadForm.errors.file && (
                                        <p className="text-xs text-destructive">{uploadForm.errors.file}</p>
                                    )}
                                </div>

                                {/* Requires signature */}
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="requires_sig"
                                        checked={uploadForm.data.requires_signature}
                                        onCheckedChange={(v) => uploadForm.setData("requires_signature", Boolean(v))}
                                    />
                                    <Label htmlFor="requires_sig">Requires employee signature</Label>
                                </div>

                                {/* Signees (shown when sig required) */}
                                {uploadForm.data.requires_signature && (
                                    <div className="space-y-1.5">
                                        <Label>Signee(s)</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Select one or more employees who must sign. The document owner is automatically included.
                                        </p>
                                        <div className="max-h-36 overflow-y-auto border rounded-md p-2 space-y-1">
                                            {employees.map((e) => (
                                                <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <Checkbox
                                                        checked={uploadForm.data.signees.includes(e.id)}
                                                        onCheckedChange={(v) => {
                                                            const current = uploadForm.data.signees;
                                                            uploadForm.setData(
                                                                "signees",
                                                                v ? [...current, e.id] : current.filter((id) => id !== e.id)
                                                            );
                                                        }}
                                                    />
                                                    {e.name} ({e.employee_id})
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Effective Date</Label>
                                        <Input
                                            type="date"
                                            value={uploadForm.data.effective_date}
                                            onChange={(e) => uploadForm.setData("effective_date", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Expires At</Label>
                                        <Input
                                            type="date"
                                            value={uploadForm.data.expires_at}
                                            onChange={(e) => uploadForm.setData("expires_at", e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-1.5">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={uploadForm.data.notes}
                                        onChange={(e) => uploadForm.setData("notes", e.target.value)}
                                        rows={2}
                                        placeholder="Optional internal note"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={uploadForm.processing} className="gap-2">
                                        <Upload className="h-4 w-4" />
                                        {uploadForm.processing ? "Uploading…" : "Upload"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <Input
                                    placeholder="Search by name, ID, or title…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-64"
                                />
                                <Button type="submit" variant="outline" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>

                            <Select
                                value={filters.category_id ?? "all"}
                                onValueChange={(v) => applyFilter("category_id", v === "all" ? "" : v)}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All categories</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.status ?? "all"}
                                onValueChange={(v) => applyFilter("status", v === "all" ? "" : v)}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="superseded">Superseded</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.user_id ?? "all"}
                                onValueChange={(v) => applyFilter("user_id", v === "all" ? "" : v)}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All employees" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All employees</SelectItem>
                                    {employees.map((e) => (
                                        <SelectItem key={e.id} value={String(e.id)}>
                                            {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Document</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Effective</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            No documents found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.data.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <div>
                                                        <p className="font-medium text-sm">{doc.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            v{doc.version}
                                                            {doc.requires_signature && (
                                                                <span className="ml-1.5 text-amber-600 dark:text-amber-400">• sig required</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {doc.employee ? (
                                                    <div>
                                                        <p className="text-sm font-medium">{doc.employee.name}</p>
                                                        <p className="text-xs text-muted-foreground">{doc.employee.employee_id}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{doc.category?.name ?? "—"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOURS[doc.status] ?? ""}`}>
                                                    {doc.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {doc.effective_date ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {doc.expires_at ? (
                                                    <span className={new Date(doc.expires_at) < new Date() ? "text-destructive" : ""}>
                                                        {doc.expires_at}
                                                    </span>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        title="Download"
                                                    >
                                                        <a href={`/admin/hr/documents/${doc.id}/download`} target="_blank" rel="noreferrer">
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        title="Delete"
                                                        onClick={() => handleDelete(doc)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {documents.links && documents.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {documents.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? "default" : "outline"}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
