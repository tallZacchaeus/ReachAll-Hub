import MainLayout from "@/layouts/MainLayout";
import { router, useForm, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Target, ChevronDown, ChevronRight, PlusCircle, ArrowRight, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeyResult {
  id: number;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  status: "on_track" | "at_risk" | "behind";
  progress: number;
}

interface Objective {
  id: number;
  title: string;
  description: string | null;
  department: string | null;
  period: string;
  status: "draft" | "active" | "completed";
  progress: number;
  owner: string;
  key_results: KeyResult[];
}

interface OKRPageProps {
  objectives: Objective[];
  periods: string[];
  departments: string[];
  filters: { period?: string; department?: string };
  isAdmin: boolean;
}

type KRFormRow = { title: string; target_value: string; unit: string };

type ObjFormData = {
  title: string;
  description: string;
  department: string;
  period: string;
  status: string;
  key_results: KRFormRow[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  active:    "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
};

const KR_STATUS_COLORS: Record<string, string> = {
  on_track: "bg-green-100 text-green-700",
  at_risk:  "bg-amber-100 text-amber-700",
  behind:   "bg-red-100 text-red-700",
};

function progressColor(pct: number): string {
  if (pct > 66) return "bg-green-500";
  if (pct > 33) return "bg-amber-500";
  return "bg-red-500";
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${progressColor(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── Objective card ───────────────────────────────────────────────────────────

function ObjectiveCard({ obj }: { obj: Objective }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border-2 border-border rounded-xl overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{obj.title}</p>
              <Badge className={`text-xs border-0 shrink-0 ${STATUS_COLORS[obj.status]}`}>
                {obj.status}
              </Badge>
              {obj.department && (
                <Badge variant="secondary" className="text-xs shrink-0">{obj.department}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{obj.period} · {obj.owner}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.visit(`/okrs/${obj.id}`)}
            className="h-8 w-8 p-0 shrink-0"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="pl-7 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Progress</span>
            <span className="font-medium">{obj.progress}%</span>
          </div>
          <ProgressBar value={obj.progress} />
          <p className="text-xs text-muted-foreground">
            {obj.key_results.length} key result{obj.key_results.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Expanded KRs */}
      {expanded && obj.key_results.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
          {obj.key_results.map((kr) => (
            <div key={kr.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground flex-1 min-w-0 truncate">{kr.title}</p>
                <Badge className={`text-xs border-0 shrink-0 ${KR_STATUS_COLORS[kr.status]}`}>
                  {kr.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar value={kr.progress} />
                <span className="text-xs text-muted-foreground shrink-0">
                  {kr.current_value}/{kr.target_value} {kr.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create objective dialog ──────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const PERIOD_OPTIONS = ["Q1", "Q2", "Q3", "Q4"].flatMap((q) =>
  [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => `${q} ${y}`)
);

function CreateObjectiveDialog() {
  const [open, setOpen] = useState(false);
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

  const { data, setData, post, processing, errors, reset } = useForm<ObjFormData>({
    title: "",
    description: "",
    department: "",
    period: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${CURRENT_YEAR}`,
    status: "active",
    key_results: [{ title: "", target_value: "", unit: "" }],
  });

  useEffect(() => {
    if (flash?.success && open) {
      toast.success(flash.success);
      setOpen(false);
      reset();
    }
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  const addKR = () =>
    setData("key_results", [...data.key_results, { title: "", target_value: "", unit: "" }]);

  const removeKR = (i: number) =>
    setData("key_results", data.key_results.filter((_, idx) => idx !== i));

  const updateKR = (i: number, field: keyof KRFormRow, value: string) => {
    const next = [...data.key_results];
    next[i] = { ...next[i], [field]: value };
    setData("key_results", next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/okrs", {
      onSuccess: () => { toast.success("Objective created."); setOpen(false); reset(); },
      onError: () => toast.error("Please fix the errors below."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white">
          <PlusCircle className="w-4 h-4 mr-2" />
          New Objective
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#1F6E4A]" />
            Create Objective
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="o-title">Title *</Label>
            <Input id="o-title" value={data.title} onChange={(e) => setData("title", e.target.value)} placeholder="e.g. Improve customer retention" />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="o-desc">Description</Label>
            <Textarea id="o-desc" value={data.description} onChange={(e) => setData("description", e.target.value)} rows={2} placeholder="Optional context or motivation…" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="o-dept">Department</Label>
              <Input id="o-dept" value={data.department} onChange={(e) => setData("department", e.target.value)} placeholder="e.g. Engineering" />
            </div>
            <div className="space-y-1.5">
              <Label>Period *</Label>
              <Select value={data.period} onValueChange={(v) => setData("period", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.period && <p className="text-xs text-destructive">{errors.period}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={data.status} onValueChange={(v) => setData("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Key Results</Label>
              <Button type="button" size="sm" variant="outline" onClick={addKR} className="h-7 text-xs">
                <PlusCircle className="w-3 h-3 mr-1" /> Add KR
              </Button>
            </div>
            {data.key_results.map((kr, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_80px_auto] gap-2 items-end">
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs text-muted-foreground">Title</Label>}
                  <Input
                    value={kr.title}
                    onChange={(e) => updateKR(i, "title", e.target.value)}
                    placeholder="e.g. Reduce churn to 5%"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs text-muted-foreground">Target</Label>}
                  <Input
                    type="number"
                    value={kr.target_value}
                    onChange={(e) => updateKR(i, "target_value", e.target.value)}
                    placeholder="100"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs text-muted-foreground">Unit</Label>}
                  <Input
                    value={kr.unit}
                    onChange={(e) => updateKR(i, "unit", e.target.value)}
                    placeholder="%"
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeKR(i)}
                  disabled={data.key_results.length === 1}
                  className="h-8 w-8 p-0 hover:text-destructive mt-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={processing} className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white">
              {processing ? "Creating…" : "Create Objective"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OKRPage({
  objectives,
  periods,
  departments,
  filters,
  isAdmin,
}: OKRPageProps) {
  const [period, setPeriod] = useState(filters.period ?? "");
  const [department, setDepartment] = useState(filters.department ?? "");

  const applyFilters = () => {
    router.get("/okrs", { period: period || undefined, department: department || undefined }, { preserveState: true });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-foreground flex items-center gap-3">
            <Target className="w-7 h-7 text-[#1F6E4A]" />
            OKRs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Objectives & Key Results — track strategic progress.
          </p>
        </div>
        {isAdmin && <CreateObjectiveDialog />}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Period</Label>
          <Select value={period || "_all"} onValueChange={(v) => setPeriod(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All periods</SelectItem>
              {periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Department</Label>
          <Select value={department || "_all"} onValueChange={(v) => setDepartment(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" onClick={applyFilters} className="h-8 text-xs">
          Apply
        </Button>
        {(period || department) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setPeriod(""); setDepartment(""); router.get("/okrs"); }}
            className="h-8 text-xs text-muted-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Objectives list */}
      {objectives.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
          {isAdmin ? "No objectives yet. Create your first one." : "No objectives available for the selected filters."}
        </div>
      ) : (
        <div className="space-y-3">
          {objectives.map((obj) => (
            <ObjectiveCard key={obj.id} obj={obj} />
          ))}
        </div>
      )}
    </div>
  );
}

OKRPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
