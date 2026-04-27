import { router } from "@inertiajs/react";
import {
  Users,
  CalendarCheck,
  CheckSquare,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import MainLayout from "@/layouts/MainLayout";
import { useChartColors } from "@/lib/useChartColors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: number;
  name: string;
  position: string;
  initials: string;
  attendance_pct: number;
  present: number;
  late: number;
  absent: number;
  active_tasks: number;
  completed_tasks: number;
  leave_days_used: number;
}

interface ChartEntry {
  name: string;
  attendance: number;
  tasks: number;
}

interface TeamDashboardPageProps {
  department: string;
  teamSize: number;
  avgAttendance: number;
  tasksCompletedThisWeek: number;
  pendingLeaveRequests: number;
  members: Member[];
  chartData: ChartEntry[];
}

// ─── Attendance dot ───────────────────────────────────────────────────────────

function AttendanceDot({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${color}`} title={`${pct}%`} />
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="border-2 border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${accent ?? "text-foreground"}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-brand" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Member detail sheet ──────────────────────────────────────────────────────

function MemberSheet({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  if (!member) return null;

  const stats = [
    { label: "Days Present (this month)", value: member.present, icon: CalendarCheck, color: "text-green-600" },
    { label: "Days Late",                  value: member.late,    icon: Clock,          color: "text-amber-600" },
    { label: "Days Absent",                value: member.absent,  icon: AlertCircle,    color: "text-red-600"   },
    { label: "Active Tasks",               value: member.active_tasks,    icon: CheckSquare, color: "text-blue-600"  },
    { label: "Completed Tasks",            value: member.completed_tasks, icon: TrendingUp,  color: "text-green-600" },
    { label: "Leave Days Used (this year)",value: member.leave_days_used, icon: FileText,    color: "text-purple-600"},
  ];

  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-80 space-y-5">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-brand text-white text-sm font-semibold">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-base">{member.name}</SheetTitle>
              <p className="text-xs text-muted-foreground">{member.position}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Attendance this month</span>
            <span className="font-medium">{member.attendance_pct}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                member.attendance_pct >= 90
                  ? "bg-green-500"
                  : member.attendance_pct >= 70
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${member.attendance_pct}%` }}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  {s.label}
                </div>
                <span className="text-sm font-semibold text-foreground">{s.value}</span>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamDashboardPage({
  department,
  teamSize,
  avgAttendance,
  tasksCompletedThisWeek,
  pendingLeaveRequests,
  members,
  chartData,
}: TeamDashboardPageProps) {
  const { colors } = useChartColors();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-foreground flex items-center gap-3">
          <Users className="w-7 h-7 text-brand" />
          Team Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {department} department · {teamSize} team member{teamSize !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          label="Team Size"
          value={teamSize}
          sub="active members"
        />
        <MetricCard
          icon={CalendarCheck}
          label="Avg Attendance"
          value={`${avgAttendance}%`}
          sub="this month"
          accent={
            avgAttendance >= 90
              ? "text-green-600"
              : avgAttendance >= 70
              ? "text-amber-600"
              : "text-red-600"
          }
        />
        <MetricCard
          icon={CheckSquare}
          label="Tasks Done"
          value={tasksCompletedThisWeek}
          sub="this week"
          accent="text-brand"
        />
        <MetricCard
          icon={FileText}
          label="Pending Leave"
          value={pendingLeaveRequests}
          sub="awaiting approval"
          accent={pendingLeaveRequests > 0 ? "text-amber-600" : "text-foreground"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Members table */}
        <div className="xl:col-span-3">
          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Team Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {members.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10 px-4">
                  No team members found in your department.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMember(m)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarFallback className="bg-brand/10 text-brand text-xs font-semibold">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.position}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                        <span className="hidden sm:flex items-center gap-1">
                          <AttendanceDot pct={m.attendance_pct} />
                          {m.attendance_pct}%
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {m.active_tasks} task{m.active_tasks !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <div className="xl:col-span-2">
          <Card className="border-2 border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-10">No data yet.</p>
              ) : (
                <div role="img" aria-label="Team performance bar chart showing attendance percentage and completed tasks by member">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="attendance" name="Attendance %" fill={colors.primary} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="tasks" name="Completed Tasks" fill={colors.secondary} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Member detail sheet */}
      <MemberSheet member={selectedMember} onClose={() => setSelectedMember(null)} />
    </div>
  );
}

TeamDashboardPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
