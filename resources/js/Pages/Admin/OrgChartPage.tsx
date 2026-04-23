import MainLayout from "@/layouts/MainLayout";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitBranch, ChevronDown, ChevronRight, Search, Users } from "lucide-react";
import type { OrgChartEmployee } from "@/types/org";

// ─── Tree node type ───────────────────────────────────────────────────────────

interface TreeNode extends OrgChartEmployee {
    children: TreeNode[];
}

function buildTree(employees: OrgChartEmployee[]): TreeNode[] {
    const byId = new Map<number, TreeNode>();
    for (const emp of employees) {
        byId.set(emp.id, { ...emp, children: [] });
    }

    const roots: TreeNode[] = [];
    for (const node of byId.values()) {
        if (node.reports_to_id && byId.has(node.reports_to_id)) {
            byId.get(node.reports_to_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    // Sort children alphabetically
    function sort(nodes: TreeNode[]) {
        nodes.sort((a, b) => a.name.localeCompare(b.name));
        nodes.forEach((n) => sort(n.children));
    }
    sort(roots);

    return roots;
}

// ─── Role colour helper ───────────────────────────────────────────────────────

const ROLE_COLOURS: Record<string, string> = {
    superadmin:        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    ceo:               "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    general_management:"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    management:        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    hr:                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    finance:           "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    staff:             "bg-muted text-muted-foreground",
};

function roleColour(role: string): string {
    return ROLE_COLOURS[role] ?? ROLE_COLOURS.staff;
}

// ─── Single org chart node ────────────────────────────────────────────────────

function OrgNode({ node, depth, searchTerm }: { node: TreeNode; depth: number; searchTerm: string }) {
    const [expanded, setExpanded] = useState(depth < 2);

    const matchesSelf = !searchTerm || node.name.toLowerCase().includes(searchTerm) ||
        (node.title ?? "").toLowerCase().includes(searchTerm) ||
        (node.department ?? "").toLowerCase().includes(searchTerm);

    // When searching, always expand if any descendant matches
    function hasMatchingDescendant(n: TreeNode): boolean {
        return n.children.some((c) =>
            c.name.toLowerCase().includes(searchTerm) ||
            (c.title ?? "").toLowerCase().includes(searchTerm) ||
            hasMatchingDescendant(c)
        );
    }

    const shouldShow = !searchTerm || matchesSelf || hasMatchingDescendant(node);
    const forceExpanded = !!searchTerm && hasMatchingDescendant(node);

    if (!shouldShow) return null;

    const isExpanded = forceExpanded || expanded;

    return (
        <div className={depth > 0 ? "ml-6 border-l border-border pl-4 mt-2" : ""}>
            <div
                className={`group flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-default
                    ${matchesSelf && searchTerm ? "border-brand bg-brand/5" : "border-border bg-card hover:bg-muted/30"}`}
            >
                {/* Expand toggle */}
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className={`mt-0.5 shrink-0 ${node.children.length === 0 ? "invisible" : ""}`}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    }
                </button>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 text-sm font-semibold text-brand">
                    {node.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{node.name}</p>
                    {node.title && <p className="text-xs text-muted-foreground truncate">{node.title}</p>}
                    {node.department && <p className="text-xs text-muted-foreground/70 truncate">{node.department}</p>}
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={`text-[10px] px-1.5 py-0 ${roleColour(node.role)}`}>
                        {node.role.replace("_", " ")}
                    </Badge>
                    {node.children.length > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Users className="w-3 h-3" />{node.children.length}
                        </span>
                    )}
                </div>
            </div>

            {isExpanded && node.children.length > 0 && (
                <div className="mt-1">
                    {node.children.map((child) => (
                        <OrgNode key={child.id} node={child} depth={depth + 1} searchTerm={searchTerm} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface OrgChartPageProps {
    employees: OrgChartEmployee[];
}

export default function OrgChartPage({ employees }: OrgChartPageProps) {
    const [search, setSearch] = useState("");
    const [allExpanded, setAllExpanded] = useState(false);

    const tree = useMemo(() => buildTree(employees), [employees]);
    const searchTerm = search.trim().toLowerCase();

    const unassigned = employees.filter(
        (e) => !e.reports_to_id && !tree.find((r) => r.id === e.id && r.children.length > 0)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-foreground flex items-center gap-3">
                        <GitBranch className="w-7 h-7 text-brand" />
                        Org Chart
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {employees.length} active employee{employees.length !== 1 ? "s" : ""} · reporting hierarchy
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search employees…"
                            className="pl-9 w-56"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setAllExpanded((v) => !v)}>
                        {allExpanded ? "Collapse all" : "Expand all"}
                    </Button>
                </div>
            </div>

            {employees.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
                        <GitBranch className="w-12 h-12 text-muted-foreground/30" />
                        <p className="font-medium text-muted-foreground">No reporting hierarchy yet</p>
                        <p className="text-sm text-muted-foreground/70">
                            Assign "Reports To" managers on employee profiles to build the org chart.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-border">
                    <CardContent className="pt-6 overflow-x-auto">
                        {tree.length === 0 && searchTerm ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No results for "{search}"</p>
                        ) : (
                            <div className="space-y-2 min-w-0">
                                {tree.map((root) => (
                                    <OrgNode key={root.id} node={root} depth={0} searchTerm={searchTerm} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Employees without a manager and no direct reports (leaf nodes unattached) */}
            {!searchTerm && unassigned.length > 0 && (
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        No manager assigned ({unassigned.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {unassigned.map((emp) => (
                            <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                                    {emp.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{emp.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{emp.title ?? emp.department ?? "—"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

OrgChartPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
