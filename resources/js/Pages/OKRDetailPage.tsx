import { router, usePage } from "@inertiajs/react";
import { ArrowLeft, Target, Save, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import MainLayout from "@/layouts/MainLayout";

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
  children: Objective[];
}

interface OKRDetailPageProps {
  objective: Objective;
  isAdmin: boolean;
}

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
    <div className="w-full bg-muted rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all ${progressColor(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── KR edit row ─────────────────────────────────────────────────────────────

function KRRow({ kr }: { kr: KeyResult }) {
  const [currentValue, setCurrentValue] = useState(String(kr.current_value));
  const [status, setStatus] = useState<KeyResult["status"]>(kr.status);
  const [saving, setSaving] = useState(false);
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error)   toast.error(flash.error);
  }, [flash]);

  const handleSave = () => {
    setSaving(true);
    router.patch(
      `/okrs/key-results/${kr.id}`,
      { current_value: parseFloat(currentValue) || 0, status },
      {
        preserveScroll: true,
        onSuccess: () => { toast.success("Key result saved."); setSaving(false); },
        onError:   () => { toast.error("Failed to save."); setSaving(false); },
      },
    );
  };

  const pct = kr.target_value > 0
    ? Math.min(100, Math.round((parseFloat(currentValue) || 0) / kr.target_value * 100))
    : 0;

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground flex-1">{kr.title}</p>
        <Badge className={`text-xs border-0 shrink-0 ${KR_STATUS_COLORS[status]}`}>
          {status.replace("_", " ")}
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Current value ({kr.unit})
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="h-8 text-sm"
              min={0}
            />
            <span className="text-xs text-muted-foreground shrink-0">/ {kr.target_value}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as KeyResult["status"])}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on_track" className="text-xs">On Track</SelectItem>
              <SelectItem value="at_risk"  className="text-xs">At Risk</SelectItem>
              <SelectItem value="behind"   className="text-xs">Behind</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={saving}
          onClick={handleSave}
          className="h-7 text-xs bg-brand hover:bg-brand/90 text-white"
        >
          <Save className="w-3 h-3 mr-1" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

// ─── Child objective row ──────────────────────────────────────────────────────

function ChildObjectiveCard({ child }: { child: Objective }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{child.title}</p>
          <p className="text-xs text-muted-foreground">{child.progress}% complete</p>
        </div>
        <Badge className={`text-xs border-0 shrink-0 ${STATUS_COLORS[child.status]}`}>{child.status}</Badge>
      </button>
      {expanded && child.key_results.length > 0 && (
        <div className="border-t border-border bg-muted/10 px-4 py-3 space-y-2">
          {child.key_results.map((kr) => (
            <KRRow key={kr.id} kr={kr} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OKRDetailPage({ objective, isAdmin }: OKRDetailPageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.visit("/okrs")}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to OKRs
      </Button>

      {/* Header card */}
      <div className="bg-card border-2 border-border rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Target className="w-5 h-5 text-brand" />
              <Badge className={`text-xs border-0 ${STATUS_COLORS[objective.status]}`}>
                {objective.status}
              </Badge>
              {objective.department && (
                <Badge variant="secondary" className="text-xs">{objective.department}</Badge>
              )}
              <Badge variant="outline" className="text-xs">{objective.period}</Badge>
            </div>
            <h1 className="text-xl font-bold text-foreground leading-snug">{objective.title}</h1>
            <p className="text-sm text-muted-foreground">Owner: {objective.owner}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-foreground">{objective.progress}%</p>
            <p className="text-xs text-muted-foreground">overall progress</p>
          </div>
        </div>

        {objective.description && (
          <p className="text-sm text-foreground leading-relaxed">{objective.description}</p>
        )}

        <div className="space-y-1">
          <ProgressBar value={objective.progress} />
        </div>
      </div>

      {/* Key Results */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Key Results ({objective.key_results.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {objective.key_results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No key results defined.</p>
          ) : (
            objective.key_results.map((kr) => <KRRow key={kr.id} kr={kr} />)
          )}
        </CardContent>
      </Card>

      {/* Child objectives */}
      {objective.children.length > 0 && (
        <>
          <Separator />
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Sub-Objectives ({objective.children.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {objective.children.map((child) => (
                <ChildObjectiveCard key={child.id} child={child} />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

OKRDetailPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
