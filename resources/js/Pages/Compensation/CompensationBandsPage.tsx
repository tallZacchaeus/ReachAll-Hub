import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { CompensationBand, BandCategory } from "@/types/compensation";

interface Props {
    bands: CompensationBand[];
}

const CATEGORY_LABELS: Record<BandCategory, string> = {
    individual_contributor: "Individual Contributor",
    manager:   "Manager",
    executive: "Executive",
};

const CATEGORY_COLOURS: Record<BandCategory, string> = {
    individual_contributor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    manager:   "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    executive: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

type BandForm = {
    grade: string; title: string; category: BandCategory;
    min_naira: string; midpoint_naira: string; max_naira: string;
    effective_date: string; notes: string;
};

const BLANK: BandForm = {
    grade: "", title: "", category: "individual_contributor",
    min_naira: "0", midpoint_naira: "0", max_naira: "0",
    effective_date: "", notes: "",
};

function toKobo(v: string): number {
    return Math.round(parseFloat(v || "0") * 100);
}

function toNaira(k: number): string {
    return (k / 100).toFixed(2);
}

export default function CompensationBandsPage({ bands }: Props) {
    const [open, setOpen]         = useState(false);
    const [editing, setEditing]   = useState<CompensationBand | null>(null);
    const [form, setForm]         = useState<BandForm>(BLANK);
    const [processing, setProc]   = useState(false);
    const [errors, setErrors]     = useState<Record<string, string>>({});

    function set(key: keyof BandForm, value: string) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function openCreate() {
        setForm(BLANK); setEditing(null); setErrors({}); setOpen(true);
    }

    function openEdit(band: CompensationBand) {
        setForm({
            grade:          band.grade,
            title:          band.title,
            category:       band.category,
            min_naira:      toNaira(band.min_kobo),
            midpoint_naira: toNaira(band.midpoint_kobo),
            max_naira:      toNaira(band.max_kobo),
            effective_date: band.effective_date,
            notes:          band.notes ?? "",
        });
        setEditing(band); setErrors({}); setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            grade:          form.grade,
            title:          form.title,
            category:       form.category,
            min_kobo:       toKobo(form.min_naira),
            midpoint_kobo:  toKobo(form.midpoint_naira),
            max_kobo:       toKobo(form.max_naira),
            effective_date: form.effective_date,
            notes:          form.notes,
        };
        setProc(true);
        const opts = {
            onSuccess: () => { setOpen(false); setProc(false); },
            onError: (errs: Record<string, string>) => { setErrors(errs); setProc(false); },
        };
        if (editing) {
            router.put(`/compensation/bands/${editing.id}`, payload, opts);
        } else {
            router.post("/compensation/bands", payload, opts);
        }
    }

    function handleDelete(band: CompensationBand) {
        if (!confirm(`Delete band "${band.grade} — ${band.title}"?`)) return;
        router.delete(`/compensation/bands/${band.id}`, { preserveScroll: true });
    }

    const grouped = Object.groupBy(bands, (b) => b.category) as
        Partial<Record<BandCategory, CompensationBand[]>>;

    return (
        <MainLayout activePage="compensation-bands">
            <Head title="Salary Bands" />

            <div className="p-6 space-y-8 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Salary Bands</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Grade-based pay ranges used across compensation review cycles.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Band
                    </Button>
                </div>

                {bands.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        No salary bands defined yet. Add the first one to get started.
                    </p>
                ) : (
                    (Object.keys(CATEGORY_LABELS) as BandCategory[]).map((cat) => {
                        const catBands = grouped[cat];
                        if (!catBands?.length) return null;
                        return (
                            <section key={cat} className="space-y-2">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    {CATEGORY_LABELS[cat]}
                                </h2>
                                <div className="space-y-2">
                                    {catBands.map((band) => (
                                        <Card key={band.id} className={!band.is_active ? "opacity-60" : ""}>
                                            <CardContent className="flex items-center gap-4 py-3">
                                                <div className="w-16 shrink-0">
                                                    <p className="text-sm font-bold">{band.grade}</p>
                                                    <p className="text-xs text-muted-foreground">Grade</p>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{band.title}</p>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium ${CATEGORY_COLOURS[band.category]}`}>
                                                        {CATEGORY_LABELS[band.category]}
                                                    </span>
                                                </div>
                                                <div className="hidden md:flex items-center gap-6 text-right text-xs text-muted-foreground">
                                                    <div>
                                                        <p className="font-medium text-foreground">₦{(band.min_kobo / 100).toLocaleString()}</p>
                                                        <p>Min</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">₦{(band.midpoint_kobo / 100).toLocaleString()}</p>
                                                        <p>Mid</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">₦{(band.max_kobo / 100).toLocaleString()}</p>
                                                        <p>Max</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground hidden lg:block w-24 shrink-0">
                                                    Eff. {band.effective_date}
                                                </p>
                                                <div className="flex gap-1 shrink-0">
                                                    <Button size="sm" variant="ghost" className="gap-1"
                                                        onClick={() => openEdit(band)}>
                                                        <Edit className="h-3.5 w-3.5" /> Edit
                                                    </Button>
                                                    <Button size="sm" variant="ghost"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(band)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        );
                    })
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Salary Band" : "Add Salary Band"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Grade *</Label>
                                <Input placeholder="e.g. L3, M2" value={form.grade}
                                    onChange={(e) => set("grade", e.target.value)} />
                                {errors.grade && <p className="text-xs text-destructive">{errors.grade}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Category *</Label>
                                <Select value={form.category}
                                    onValueChange={(v) => set("category", v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Title / Label *</Label>
                            <Input placeholder="e.g. Senior Engineer" value={form.title}
                                onChange={(e) => set("title", e.target.value)} />
                            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {(["min_naira", "midpoint_naira", "max_naira"] as const).map((key) => (
                                <div key={key} className="space-y-1.5">
                                    <Label>
                                        {key === "min_naira" ? "Min (₦)" : key === "midpoint_naira" ? "Mid (₦)" : "Max (₦)"} *
                                    </Label>
                                    <Input type="number" min="0" step="0.01" value={form[key]}
                                        onChange={(e) => set(key, e.target.value)} />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Effective Date *</Label>
                            <Input type="date" value={form.effective_date}
                                onChange={(e) => set("effective_date", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea rows={2} value={form.notes}
                                onChange={(e) => set("notes", e.target.value)} />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? "Saving…" : editing ? "Update Band" : "Create Band"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
