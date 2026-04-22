import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, LayoutGrid, List, Globe, Mail, Briefcase, Building2, Calendar, IdCard } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

interface DirectoryUser {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  employee_stage: string;
  joined: string;
}

interface PaginatedUsers {
  data: DirectoryUser[];
  current_page: number;
  last_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface DirectoryPageProps {
  users: PaginatedUsers;
  departments: string[];
  stages: string[];
  filters: { search: string; department: string; stage: string };
}

// Deterministic colour per department for avatar backgrounds
const DEPT_COLORS: Record<string, string> = {
  "Video & Production": "bg-purple-500",
  "Project Management": "bg-blue-600",
  "Product Team": "bg-cyan-600",
  "Content & Brand Comms": "bg-pink-500",
  Interns: "bg-orange-400",
  "Incubator Team": "bg-yellow-500",
  "Skillup Team": "bg-lime-600",
  "DAF Team": "bg-teal-600",
  "Graphics Design": "bg-violet-600",
  Accounting: "bg-red-500",
  "Business Development": "bg-emerald-600",
};

const STAGE_STYLES: Record<string, string> = {
  joiner: "border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-950/30",
  performer: "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  leader: "border-purple-300 text-purple-600 bg-purple-50 dark:bg-purple-950/30",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function avatarColor(department: string) {
  return DEPT_COLORS[department] ?? "bg-[#1F6E4A]";
}

export default function DirectoryPage({ users, departments, stages, filters }: DirectoryPageProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState(filters.search);
  const [selected, setSelected] = useState<DirectoryUser | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search.length === 0 || search.length >= 2) {
        router.get(
          "/directory",
          { ...filters, search },
          { preserveState: true, replace: true },
        );
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const applyFilter = (key: string, value: string) => {
    router.get(
      "/directory",
      { ...filters, search, [key]: value },
      { preserveState: true, replace: true },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1 flex items-center gap-3">
          <Globe className="w-8 h-8 text-[#1F6E4A]" />
          Employee Directory
        </h1>
        <p className="text-muted-foreground">
          {users.total} active {users.total === 1 ? "employee" : "employees"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or ID…"
            className="pl-9"
          />
        </div>

        {/* Department filter */}
        <div className="w-full sm:w-52">
          <Select
            value={filters.department || "__all__"}
            onValueChange={(v) => applyFilter("department", v === "__all__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage filter */}
        <div className="w-full sm:w-44">
          <Select
            value={filters.stage || "__all__"}
            onValueChange={(v) => applyFilter("stage", v === "__all__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Stages</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 w-7 p-0 ${view === "grid" ? "bg-muted" : ""}`}
            onClick={() => setView("grid")}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 w-7 p-0 ${view === "list" ? "bg-muted" : ""}`}
            onClick={() => setView("list")}
            title="List view"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.data.length === 0 && (
            <p className="col-span-full text-center py-16 text-muted-foreground">
              No employees found.
            </p>
          )}
          {users.data.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelected(user)}
              className="text-left p-5 bg-card border-2 border-border rounded-xl hover:border-[#1F6E4A] hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={`${avatarColor(user.department)} text-white text-sm`}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.position || "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.department && (
                  <Badge variant="secondary" className="text-xs truncate max-w-full">
                    {user.department}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${STAGE_STYLES[user.employee_stage] ?? ""}`}
                >
                  {user.employee_stage}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="border-2 border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-foreground">Employee</TableHead>
                <TableHead className="text-foreground">ID</TableHead>
                <TableHead className="text-foreground">Department</TableHead>
                <TableHead className="text-foreground">Position</TableHead>
                <TableHead className="text-foreground">Stage</TableHead>
                <TableHead className="text-foreground">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
              {users.data.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelected(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={`${avatarColor(user.department)} text-white text-xs`}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.employee_id || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.department || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.position || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${STAGE_STYLES[user.employee_stage] ?? ""}`}
                    >
                      {user.employee_stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.joined}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {users.last_page > 1 && (
        <div className="flex justify-center gap-1">
          {users.links.map((link) => (
            <Button
              key={link.label}
              variant={link.active ? "default" : "outline"}
              size="sm"
              disabled={!link.url}
              onClick={() => link.url && router.visit(link.url, { preserveState: true })}
              className={link.active ? "bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white" : ""}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(link.label) }}
            />
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className={`${avatarColor(selected.department)} text-white text-xl`}>
                      {getInitials(selected.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-foreground text-lg">{selected.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{selected.position || "—"}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4">
                <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={selected.email} />
                <DetailRow icon={<IdCard className="w-4 h-4" />} label="Employee ID" value={selected.employee_id || "—"} />
                <DetailRow icon={<Building2 className="w-4 h-4" />} label="Department" value={selected.department || "—"} />
                <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Position" value={selected.position || "—"} />
                <DetailRow
                  icon={<Globe className="w-4 h-4" />}
                  label="Stage"
                  value={
                    <Badge
                      variant="outline"
                      className={`capitalize ${STAGE_STYLES[selected.employee_stage] ?? ""}`}
                    >
                      {selected.employee_stage}
                    </Badge>
                  }
                />
                <DetailRow icon={<Calendar className="w-4 h-4" />} label="Joined" value={selected.joined} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

DirectoryPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
