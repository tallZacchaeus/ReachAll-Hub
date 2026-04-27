import { router } from "@inertiajs/react";
import {
  FileDown,
  FileSpreadsheet,
  Users,
  CheckSquare,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { KpiCardSkeleton, ChartSkeleton } from "@/components/ui/page-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MainLayout from "@/layouts/MainLayout";
import { useChartColors } from "@/lib/useChartColors";

interface SummaryCard {
  label: string;
  value: string;
  meta: string;
}

interface TrendPoint {
  month: string;
  created: number;
  completed: number;
  overdue: number;
}

interface DistributionItem {
  name: string;
  value: number;
}

interface PriorityItem {
  label: string;
  count: number;
}

interface DepartmentWorkloadItem {
  department: string;
  total: number;
  completed: number;
  open: number;
}

interface TopPerformer {
  rank: number;
  staffId: string;
  name: string;
  score: number;
  completedTasks: number;
  assignedTasks: number;
}

type ReportMode = "comprehensive" | "tasks" | "staff" | "performance";

interface ReportsPageProps {
  reportPeriod: string;
  reportType: ReportMode;
  reportData: {
    summaryCards: SummaryCard[];
    taskTrend: TrendPoint[];
    departmentData: DistributionItem[];
    statusDistribution: DistributionItem[];
    priorityDistribution: PriorityItem[];
    departmentWorkload: DepartmentWorkloadItem[];
    topPerformers: TopPerformer[];
  };
}

const COLORS = ["#1F6E4A", "#d97706", "#4ade80", "#f59e0b", "#60a5fa", "#dc2626"];

const summaryCardStyles = [
  { icon: Users, colorClass: "bg-brand/10", iconClass: "text-brand" },
  { icon: CheckSquare, colorClass: "bg-blue-500/10", iconClass: "text-blue-600 dark:text-blue-400" },
  { icon: AlertCircle, colorClass: "bg-amber-500/10", iconClass: "text-amber-600 dark:text-amber-400" },
  { icon: MessageSquare, colorClass: "bg-violet-500/10", iconClass: "text-violet-600 dark:text-violet-400" },
];

interface ActiveSummaryCard {
  key: string;
  summary: SummaryCard;
  style: (typeof summaryCardStyles)[number];
}

const reportModeConfig: Record<
  ReportMode,
  {
    title: string;
    description: string;
    badge: string;
    summaryIndexes: number[];
    sections: Array<
      "taskTrend" | "departmentDistribution" | "statusMix" | "topPerformers" | "priorityBreakdown" | "departmentWorkload"
    >;
  }
> = {
  comprehensive: {
    title: "Comprehensive Operations Report",
    description: "Full platform view across task execution, staff footprint, and delivery performance.",
    badge: "Full View",
    summaryIndexes: [0, 1, 2, 3],
    sections: [
      "taskTrend",
      "departmentDistribution",
      "statusMix",
      "topPerformers",
      "priorityBreakdown",
      "departmentWorkload",
    ],
  },
  tasks: {
    title: "Task Operations Report",
    description: "Focused on workload, throughput, bottlenecks, and priority pressure in the selected period.",
    badge: "Execution Focus",
    summaryIndexes: [1, 2, 3],
    sections: ["taskTrend", "statusMix", "priorityBreakdown", "departmentWorkload"],
  },
  staff: {
    title: "Staff Coverage Report",
    description: "Focused on department footprint, workload ownership, and strongest delivery contributors.",
    badge: "Workforce Focus",
    summaryIndexes: [0, 1, 2],
    sections: ["departmentDistribution", "topPerformers", "departmentWorkload"],
  },
  performance: {
    title: "Performance Snapshot",
    description: "Focused on completion efficiency, standout contributors, and where momentum is slipping.",
    badge: "Performance Focus",
    summaryIndexes: [1, 2, 3],
    sections: ["taskTrend", "topPerformers", "priorityBreakdown", "departmentWorkload"],
  },
};

export default function ReportsPage({
  reportPeriod,
  reportType,
  reportData,
}: ReportsPageProps) {
  const [loading, setLoading] = useState(false);
  const { colors } = useChartColors();
  const mode = reportModeConfig[reportType] ?? reportModeConfig.comprehensive;
  const activeSummaryCards = mode.summaryIndexes
    .map((index) => {
      const summary = reportData.summaryCards[index];
      const style = summaryCardStyles[index] ?? summaryCardStyles[0];

      if (!summary) {
        return null;
      }

      return {
        key: `${reportType}-${summary.label}`,
        summary,
        style,
      };
    })
    .filter((entry): entry is ActiveSummaryCard => entry !== null);

  const topPerformer = reportData.topPerformers[0];
  const highestWorkloadDepartment = reportData.departmentWorkload[0];
  const largestDepartment = reportData.departmentData[0];
  const busiestPriority = [...reportData.priorityDistribution].sort(
    (left, right) => right.count - left.count
  )[0];
  const dominantStatus = [...reportData.statusDistribution].sort(
    (left, right) => right.value - left.value
  )[0];

  const focusItems: Record<ReportMode, string[]> = {
    comprehensive: [
      topPerformer
        ? `${topPerformer.name} leads delivery at ${topPerformer.score}% completion efficiency.`
        : "No performer data is available yet for this period.",
      highestWorkloadDepartment
        ? `${highestWorkloadDepartment.department} carries the heaviest workload with ${highestWorkloadDepartment.total} tasks.`
        : "Department workload data is not available yet.",
      largestDepartment
        ? `${largestDepartment.name} has the largest active staff footprint.`
        : "Department distribution data is not available yet.",
    ],
    tasks: [
      dominantStatus
        ? `${dominantStatus.name} is the dominant workflow state right now.`
        : "Task status data is not available yet.",
      busiestPriority
        ? `${busiestPriority.label} is the heaviest priority band in this period.`
        : "Priority distribution data is not available yet.",
      highestWorkloadDepartment
        ? `${highestWorkloadDepartment.department} is currently the busiest delivery lane.`
        : "Department workload data is not available yet.",
    ],
    staff: [
      largestDepartment
        ? `${largestDepartment.name} has the largest active team footprint.`
        : "Department distribution data is not available yet.",
      topPerformer
        ? `${topPerformer.name} is the top visible contributor in the selected period.`
        : "Top performer data is not available yet.",
      highestWorkloadDepartment
        ? `${highestWorkloadDepartment.department} owns the largest share of active task load.`
        : "Department workload data is not available yet.",
    ],
    performance: [
      topPerformer
        ? `${topPerformer.name} sets the current pace at ${topPerformer.score}% completion.`
        : "Top performer data is not available yet.",
      dominantStatus
        ? `${dominantStatus.name} is the current dominant execution state.`
        : "Task status data is not available yet.",
      highestWorkloadDepartment
        ? `${highestWorkloadDepartment.department} is where the largest delivery burden sits.`
        : "Department workload data is not available yet.",
    ],
  };

  const hasSection = (
    section:
      | "taskTrend"
      | "departmentDistribution"
      | "statusMix"
      | "topPerformers"
      | "priorityBreakdown"
      | "departmentWorkload"
  ) => mode.sections.includes(section);

  const updateFilters = (next: Partial<{ period: string; type: string }>) => {
    setLoading(true);
    router.get(
      "/reports",
      {
        period: next.period ?? reportPeriod,
        type: next.type ?? reportType,
      },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onFinish: () => setLoading(false),
      }
    );
  };

  const handleExportPDF = () => {
    const params = new URLSearchParams({
      period: reportPeriod,
      type: reportType,
    });

    window.location.href = `/reports/export-pdf?${params.toString()}`;
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      period: reportPeriod,
      type: reportType,
    });

    window.location.href = `/reports/export-csv?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">{mode.title}</h1>
          <p className="text-muted-foreground">
            {mode.description}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="text-brand border-brand hover:bg-muted"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6">
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Period</Label>
                <Select
                  value={reportPeriod}
                  onValueChange={(value) => updateFilters({ period: value })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Month</SelectItem>
                    <SelectItem value="last">Last Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => updateFilters({ type: value })}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                    <SelectItem value="tasks">Task Operations</SelectItem>
                    <SelectItem value="staff">Staff Coverage</SelectItem>
                    <SelectItem value="performance">Performance Snapshot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] text-white shadow-sm border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-white text-lg">Report Focus</CardTitle>
                <CardDescription className="text-slate-300">
                  What this mode is surfacing first.
                </CardDescription>
              </div>
              <Badge className="bg-white/10 text-white border border-white/15">
                {mode.badge}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusItems[reportType].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          : activeSummaryCards.map(({ key, summary, style }, index) => {
          const Icon = style.icon;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${style.colorClass}`}
                    >
                      <Icon className={`w-6 h-6 ${style.iconClass}`} />
                    </div>
                    <Badge className="bg-muted text-muted-foreground border border-border">
                      {summary.meta}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{summary.label}</p>
                  <p
                    className="text-foreground"
                    style={{ fontSize: "1.75rem", fontWeight: "600" }}
                  >
                    {summary.value}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      ) : null}

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${loading ? "hidden" : ""}`}>
        {hasSection("taskTrend") && (
          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Task Trend</CardTitle>
              <CardDescription className="text-muted-foreground">
                Six-month view of created, completed, and overdue tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Task trend line chart: created, completed, and overdue tasks over six months">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.taskTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                  <XAxis dataKey="month" stroke={colors.axisText} />
                  <YAxis stroke={colors.axisText} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke={colors.primary}
                    strokeWidth={3}
                    dot={{ fill: colors.primary, r: 5 }}
                    name="Created"
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={colors.tertiary}
                    strokeWidth={3}
                    dot={{ fill: colors.tertiary, r: 5 }}
                    name="Completed"
                  />
                  <Line
                    type="monotone"
                    dataKey="overdue"
                    stroke={colors.danger}
                    strokeWidth={3}
                    dot={{ fill: colors.danger, r: 5 }}
                    name="Overdue"
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {hasSection("departmentDistribution") && (
          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Department Distribution</CardTitle>
              <CardDescription className="text-muted-foreground">
                Active staff footprint by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Department distribution pie chart showing active staff by department">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.departmentData as unknown as Array<Record<string, string | number>>}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.departmentData.map((entry, index) => (
                      <Cell
                        key={`department-${entry.name}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {hasSection("statusMix") && (
          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Task Status Mix</CardTitle>
              <CardDescription className="text-muted-foreground">
                Current task load by workflow state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Task status mix bar chart showing task count by workflow state">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                  <XAxis dataKey="name" stroke={colors.axisText} />
                  <YAxis stroke={colors.axisText} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill={colors.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {hasSection("topPerformers") && (
          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Top Performers</CardTitle>
              <CardDescription className="text-muted-foreground">
                Ranked by completed-task rate in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportData.topPerformers.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No performer data available for this period.
                </div>
              )}
              {reportData.topPerformers.map((performer) => (
                <div
                  key={performer.rank}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                        performer.rank === 1
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                          : performer.rank === 2
                            ? "bg-gradient-to-br from-gray-300 to-gray-500"
                            : "bg-gradient-to-br from-orange-400 to-orange-600"
                      }`}
                    >
                      <span className="text-sm font-semibold">{performer.rank}</span>
                    </div>
                    <div>
                      <p className="text-foreground">{performer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {performer.staffId} • {performer.completedTasks}/
                        {performer.assignedTasks} completed
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-brand text-white">
                    {performer.score}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${loading ? "hidden" : ""}`}>
        {hasSection("priorityBreakdown") && (
          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Priority Breakdown</CardTitle>
              <CardDescription className="text-muted-foreground">
                Task volume grouped by priority level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.priorityDistribution.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="text-foreground">{item.label}</span>
                  <Badge className="bg-brand-subtle text-brand dark:bg-brand/20">
                    {item.count} tasks
                  </Badge>
                </div>
              ))}
              {reportData.priorityDistribution.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No priority data available for this period.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {hasSection("departmentWorkload") && (
          <Card className="bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Department Workload</CardTitle>
              <CardDescription className="text-muted-foreground">
                Departmental task volume and completion split
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.departmentWorkload.map((department) => (
                  <div
                    key={department.department}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="text-foreground">{department.department}</p>
                      <p className="text-xs text-muted-foreground">
                        {department.completed} completed • {department.open} open
                      </p>
                    </div>
                    <Badge className="bg-brand text-white">
                      {department.total} tasks
                    </Badge>
                  </div>
                ))}
                {reportData.departmentWorkload.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No departmental workload data available for this period.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

ReportsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
