import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { useChartColors } from "@/lib/useChartColors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Users, TrendingUp, Calendar, Award, Building2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "motion/react";

export default function DepartmentAnalyticsPage() {
  const { colors } = useChartColors();
  const [selectedDepartment, setSelectedDepartment] = useState("engineering");
  const [dateRange, setDateRange] = useState("month");
  const [metricType, setMetricType] = useState("all");

  const departments = {
    engineering: {
      name: "Engineering",
      staffCount: 32,
      attendance: 96,
      engagement: 88,
      topPerformers: [
        { id: "EMP001", name: "John Smith", avatar: "JS", score: 96 },
        { id: "EMP015", name: "Mike Chen", avatar: "MC", score: 94 },
        { id: "EMP027", name: "Lisa Park", avatar: "LP", score: 92 },
      ],
    },
    marketing: {
      name: "Marketing",
      staffCount: 18,
      attendance: 94,
      engagement: 92,
      topPerformers: [
        { id: "EMP023", name: "Sarah Johnson", avatar: "SJ", score: 98 },
        { id: "EMP031", name: "David Kim", avatar: "DK", score: 93 },
        { id: "EMP045", name: "Emma Wilson", avatar: "EW", score: 91 },
      ],
    },
    sales: {
      name: "Sales",
      staffCount: 25,
      attendance: 92,
      engagement: 85,
      topPerformers: [
        { id: "EMP042", name: "Emily Davis", avatar: "ED", score: 95 },
        { id: "EMP052", name: "Tom Brown", avatar: "TB", score: 90 },
        { id: "EMP061", name: "Anna Lee", avatar: "AL", score: 88 },
      ],
    },
    hr: {
      name: "Human Resources",
      staffCount: 8,
      attendance: 98,
      engagement: 90,
      topPerformers: [
        { id: "EMP008", name: "Alex Wong", avatar: "AW", score: 97 },
        { id: "EMP019", name: "Grace Liu", avatar: "GL", score: 94 },
        { id: "EMP033", name: "Chris Martin", avatar: "CM", score: 91 },
      ],
    },
  };

  const currentDept = departments[selectedDepartment as keyof typeof departments];

  const attendanceTrend = [
    { month: "Jul", rate: 89 },
    { month: "Aug", rate: 91 },
    { month: "Sep", rate: 93 },
    { month: "Oct", rate: 94 },
    { month: "Nov", rate: currentDept.attendance },
  ];

  const engagementTrend = [
    { month: "Jul", score: 78 },
    { month: "Aug", score: 82 },
    { month: "Sep", score: 85 },
    { month: "Oct", score: 86 },
    { month: "Nov", score: currentDept.engagement },
  ];

  const performanceMetrics = [
    { metric: "Attendance", value: currentDept.attendance },
    { metric: "Engagement", value: currentDept.engagement },
    { metric: "Collaboration", value: 85 },
    { metric: "Punctuality", value: 92 },
    { metric: "Innovation", value: 88 },
  ];

  const comparisonData = [
    { department: "Engineering", score: 88 },
    { department: "Marketing", score: 92 },
    { department: "Sales", score: 85 },
    { department: "HR", score: 90 },
    { department: "Operations", score: 83 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground mb-2">Department Analytics</h1>
        <p className="text-muted-foreground">
          Detailed performance insights by department
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Metric Type</Label>
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center bg-brand/10"
                >
                  <Users className="w-6 h-6 text-brand" />
                </div>
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Staff</p>
              <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                {currentDept.staffCount}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center bg-brand/10"
                >
                  <Calendar className="w-6 h-6 text-brand" />
                </div>
                <Badge className="bg-brand-subtle dark:bg-muted text-brand">+2%</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
              <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                {currentDept.attendance}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center bg-brand-yellow/10"
                >
                  <TrendingUp className="w-6 h-6 text-brand-yellow" />
                </div>
                <Badge className="bg-brand-yellow/10 dark:bg-brand-yellow/20 text-foreground">+5%</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Engagement Score</p>
              <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                {currentDept.engagement}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center bg-brand/10"
                >
                  <Award className="w-6 h-6 text-brand" />
                </div>
                <Badge className="bg-brand-subtle dark:bg-muted text-brand">New</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Badges Earned</p>
              <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                24
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Attendance Trend</CardTitle>
            <CardDescription className="text-muted-foreground">
              Monthly attendance rate for {currentDept.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div role="img" aria-label="Attendance trend line chart showing monthly attendance rate">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrend}>
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
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke={colors.primary}
                  strokeWidth={3}
                  dot={{ fill: colors.primary, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Engagement Trend</CardTitle>
            <CardDescription className="text-muted-foreground">
              Team engagement score over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div role="img" aria-label="Engagement trend line chart showing team engagement score over time">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementTrend}>
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
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={colors.secondary}
                  strokeWidth={3}
                  dot={{ fill: colors.secondary, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Performance Metrics</CardTitle>
            <CardDescription className="text-muted-foreground">
              Multi-dimensional performance view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div role="img" aria-label="Performance metrics radar chart showing multi-dimensional scores">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceMetrics}>
                <PolarGrid stroke={colors.gridLine} />
                <PolarAngleAxis dataKey="metric" stroke={colors.axisText} />
                <PolarRadiusAxis stroke={colors.axisText} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke={colors.primary}
                  fill={colors.primary}
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Comparison */}
        <Card className="bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Department Comparison</CardTitle>
            <CardDescription className="text-muted-foreground">
              Performance across all departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div role="img" aria-label="Department comparison bar chart showing performance scores across departments">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                <XAxis dataKey="department" stroke={colors.axisText} />
                <YAxis stroke={colors.axisText} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `1px solid ${colors.tooltipBorder}`,
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="score"
                  fill={colors.primary}
                  radius={[8, 8, 0, 0]}
                  activeBar={{ fill: colors.secondary }}
                />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">
            Top 3 Performers - {currentDept.name}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Highest performing team members this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentDept.topPerformers.map((performer, index) => (
              <Card key={performer.id} className="bg-muted shadow-sm">
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                        : index === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-500"
                        : "bg-gradient-to-br from-orange-400 to-orange-600"
                    }`}
                  >
                    <span className="text-2xl font-semibold">{index + 1}</span>
                  </div>
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    <AvatarFallback className="bg-brand text-brand-foreground text-lg">
                      {performer.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-foreground mb-1">{performer.name}</p>
                  <p className="text-xs text-muted-foreground mb-3">{performer.id}</p>
                  <Badge className="bg-brand text-white">
                    {performer.score}% Score
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

DepartmentAnalyticsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
