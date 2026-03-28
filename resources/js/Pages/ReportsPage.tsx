import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  FileDown,
  FileSpreadsheet,
  Users,
  CheckSquare,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";

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

const COLORS = ["#1F6E4A", "#FFD400", "#4ade80", "#f59e0b", "#60a5fa", "#ef4444"];

const summaryCardStyles = [
  { icon: Users, color: "#1F6E4A" },
  { icon: CheckSquare, color: "#2563eb" },
  { icon: AlertCircle, color: "#d97706" },
  { icon: MessageSquare, color: "#7c3aed" },
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
          <h1 className="text-[#1F2937] mb-2">{mode.title}</h1>
          <p className="text-[#6b7280]">
            {mode.description}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="text-[#1F6E4A] border-[#1F6E4A] hover:bg-[#f0fdf4]"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Period</Label>
                <Select
                  value={reportPeriod}
                  onValueChange={(value) => updateFilters({ period: value })}
                >
                  <SelectTrigger className="bg-white">
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
                  <SelectTrigger className="bg-white">
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
        {activeSummaryCards.map(({ key, summary, style }, index) => {
          const Icon = style.icon;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${style.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: style.color }} />
                    </div>
                    <Badge className="bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]">
                      {summary.meta}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#6b7280] mb-1">{summary.label}</p>
                  <p
                    className="text-[#1F2937]"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasSection("taskTrend") && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#1F2937]">Task Trend</CardTitle>
              <CardDescription className="text-[#6b7280]">
                Six-month view of created, completed, and overdue tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.taskTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#1F6E4A"
                    strokeWidth={3}
                    dot={{ fill: "#1F6E4A", r: 5 }}
                    name="Created"
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: "#2563eb", r: 5 }}
                    name="Completed"
                  />
                  <Line
                    type="monotone"
                    dataKey="overdue"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ fill: "#ef4444", r: 5 }}
                    name="Overdue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {hasSection("departmentDistribution") && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#1F2937]">Department Distribution</CardTitle>
              <CardDescription className="text-[#6b7280]">
                Active staff footprint by department
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {hasSection("statusMix") && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#1F2937]">Task Status Mix</CardTitle>
              <CardDescription className="text-[#6b7280]">
                Current task load by workflow state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" fill="#1F6E4A" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {hasSection("topPerformers") && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#1F2937]">Top Performers</CardTitle>
              <CardDescription className="text-[#6b7280]">
                Ranked by completed-task rate in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportData.topPerformers.length === 0 && (
                <div className="rounded-lg border border-dashed border-[#d1d5db] p-4 text-sm text-[#6b7280]">
                  No performer data available for this period.
                </div>
              )}
              {reportData.topPerformers.map((performer) => (
                <div
                  key={performer.rank}
                  className="flex items-center justify-between p-3 bg-[#F5F7F8] rounded-lg"
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
                      <p className="text-[#1F2937]">{performer.name}</p>
                      <p className="text-xs text-[#6b7280]">
                        {performer.staffId} • {performer.completedTasks}/
                        {performer.assignedTasks} completed
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-[#1F6E4A] text-white">
                    {performer.score}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasSection("priorityBreakdown") && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#1F2937]">Priority Breakdown</CardTitle>
              <CardDescription className="text-[#6b7280]">
                Task volume grouped by priority level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.priorityDistribution.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 bg-[#F5F7F8] rounded-lg"
                >
                  <span className="text-[#1F2937]">{item.label}</span>
                  <Badge className="bg-[#e2f3ea] text-[#1F6E4A]">
                    {item.count} tasks
                  </Badge>
                </div>
              ))}
              {reportData.priorityDistribution.length === 0 && (
                <div className="rounded-lg border border-dashed border-[#d1d5db] p-4 text-sm text-[#6b7280]">
                  No priority data available for this period.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {hasSection("departmentWorkload") && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#1F2937]">Department Workload</CardTitle>
              <CardDescription className="text-[#6b7280]">
                Departmental task volume and completion split
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.departmentWorkload.map((department) => (
                  <div
                    key={department.department}
                    className="flex items-center justify-between p-3 bg-[#F5F7F8] rounded-lg"
                  >
                    <div>
                      <p className="text-[#1F2937]">{department.department}</p>
                      <p className="text-xs text-[#6b7280]">
                        {department.completed} completed • {department.open} open
                      </p>
                    </div>
                    <Badge className="bg-[#1F6E4A] text-white">
                      {department.total} tasks
                    </Badge>
                  </div>
                ))}
                {reportData.departmentWorkload.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#d1d5db] p-4 text-sm text-[#6b7280]">
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
