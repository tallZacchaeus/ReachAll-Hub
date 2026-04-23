import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { useChartColors } from "@/lib/useChartColors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Calendar, TrendingUp, Award, CheckSquare, Users, Download, FileText } from "lucide-react";
import { motion } from "motion/react";

interface ProgressReportPageProps {
  userRole: string;
}

export default function ProgressReportPage({ userRole }: ProgressReportPageProps) {
  const { colors } = useChartColors();
  const [selectedStaff, setSelectedStaff] = useState("john-smith");
  const [selectedYear, setSelectedYear] = useState("2024");

  // Mock staff data
  const staffList = [
    { id: "john-smith", name: "John Smith", department: "Tech", position: "Frontend Developer" },
    { id: "sarah-jones", name: "Sarah Jones", department: "Design", position: "UI/UX Designer" },
    { id: "mike-wilson", name: "Mike Wilson", department: "Tech", position: "Backend Developer" },
    { id: "emily-brown", name: "Emily Brown", department: "Marketing", position: "Content Manager" },
    { id: "david-lee", name: "David Lee", department: "Operations", position: "Project Manager" },
  ];

  // Mock monthly performance data
  const monthlyPerformance = [
    { month: "Jan", tasksCompleted: 12, attendance: 95, engagement: 88, score: 85 },
    { month: "Feb", tasksCompleted: 15, attendance: 98, engagement: 92, score: 88 },
    { month: "Mar", tasksCompleted: 18, attendance: 92, engagement: 85, score: 82 },
    { month: "Apr", tasksCompleted: 14, attendance: 96, engagement: 90, score: 87 },
    { month: "May", tasksCompleted: 20, attendance: 100, engagement: 95, score: 92 },
    { month: "Jun", tasksCompleted: 16, attendance: 94, engagement: 88, score: 86 },
    { month: "Jul", tasksCompleted: 19, attendance: 97, engagement: 93, score: 90 },
    { month: "Aug", tasksCompleted: 17, attendance: 96, engagement: 89, score: 88 },
    { month: "Sep", tasksCompleted: 21, attendance: 98, engagement: 94, score: 91 },
    { month: "Oct", tasksCompleted: 18, attendance: 95, engagement: 91, score: 89 },
    { month: "Nov", tasksCompleted: 16, attendance: 97, engagement: 90, score: 88 },
  ];

  // Mock quarterly data
  const quarterlyData = [
    { quarter: "Q1", performance: 85, projects: 8, teamwork: 88 },
    { quarter: "Q2", performance: 88, projects: 10, teamwork: 92 },
    { quarter: "Q3", performance: 90, projects: 12, teamwork: 90 },
    { quarter: "Q4", performance: 89, projects: 9, teamwork: 91 },
  ];

  const selectedStaffData = staffList.find(s => s.id === selectedStaff);

  const handleDownloadPDF = () => {
    const params = new URLSearchParams({
      staff_id: selectedStaff,
      year: selectedYear
    });
    window.location.href = `/reports/progress/export-pdf?${params.toString()}`;
  };

  const handleDownloadCSV = () => {
    const params = new URLSearchParams({
      staff_id: selectedStaff,
      year: selectedYear
    });
    window.location.href = `/reports/progress/export-csv?${params.toString()}`;
  };

  // Calculate summary stats
  const avgTasksCompleted = Math.round(monthlyPerformance.reduce((sum, m) => sum + m.tasksCompleted, 0) / monthlyPerformance.length);
  const avgAttendance = Math.round(monthlyPerformance.reduce((sum, m) => sum + m.attendance, 0) / monthlyPerformance.length);
  const avgEngagement = Math.round(monthlyPerformance.reduce((sum, m) => sum + m.engagement, 0) / monthlyPerformance.length);
  const avgScore = Math.round(monthlyPerformance.reduce((sum, m) => sum + m.score, 0) / monthlyPerformance.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Staff Progress Report</h1>
          <p className="text-muted-foreground">
            Track individual staff performance, attendance, and engagement over time
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDownloadCSV}
            variant="outline"
            className="border-brand text-brand hover:bg-brand hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="bg-brand text-white hover:bg-brand/90"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-2 block">Select Staff Member</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} - {staff.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="text-sm text-muted-foreground mb-2 block">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Info Card */}
      {selectedStaffData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center text-white text-xl">
                    {selectedStaffData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-foreground mb-1">{selectedStaffData.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{selectedStaffData.position}</p>
                    <Badge className="bg-brand text-white">
                      {selectedStaffData.department}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-2xl text-brand mb-1">{avgTasksCompleted}</p>
                    <p className="text-xs text-muted-foreground">Avg Tasks/Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl text-brand mb-1">{avgAttendance}%</p>
                    <p className="text-xs text-muted-foreground">Avg Attendance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl text-brand mb-1">{avgEngagement}%</p>
                    <p className="text-xs text-muted-foreground">Avg Engagement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl text-brand mb-1">{avgScore}%</p>
                    <p className="text-xs text-muted-foreground">Overall Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts */}
      <Tabs defaultValue="annual" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="annual">Annual Progress</TabsTrigger>
          <TabsTrigger value="tasks">Tasks Completed</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly Review</TabsTrigger>
        </TabsList>

        {/* Annual Progress Chart */}
        <TabsContent value="annual">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Annual Performance Overview</CardTitle>
              <CardDescription>
                Combined view of tasks, attendance, engagement, and overall score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Annual performance area chart: overall score and attendance percentage over the year">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                  <XAxis dataKey="month" stroke={colors.axisText} />
                  <YAxis stroke={colors.axisText} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stackId="1"
                    stroke={colors.primary}
                    fill={colors.primary}
                    fillOpacity={0.6}
                    name="Overall Score"
                  />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stackId="2"
                    stroke={colors.secondary}
                    fill={colors.secondary}
                    fillOpacity={0.4}
                    name="Attendance %"
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Chart */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Tasks Completed Over Time</CardTitle>
              <CardDescription>Monthly task completion trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Tasks completed bar chart showing monthly task completion trend">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                  <XAxis dataKey="month" stroke={colors.axisText} />
                  <YAxis stroke={colors.axisText} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasksCompleted" fill={colors.primary} name="Tasks Completed" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Chart */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Attendance Record</CardTitle>
              <CardDescription>Monthly attendance percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Attendance record line chart showing monthly attendance percentage">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                  <XAxis dataKey="month" stroke={colors.axisText} />
                  <YAxis stroke={colors.axisText} domain={[80, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke={colors.primary}
                    strokeWidth={3}
                    name="Attendance %"
                    dot={{ fill: colors.primary, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Chart */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Engagement Score</CardTitle>
              <CardDescription>Team engagement and participation metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Engagement score line chart showing monthly team engagement and participation">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                  <XAxis dataKey="month" stroke={colors.axisText} />
                  <YAxis stroke={colors.axisText} domain={[80, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke={colors.secondary}
                    strokeWidth={3}
                    name="Engagement Score"
                    dot={{ fill: colors.secondary, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarterly Review */}
        <TabsContent value="quarterly">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Quarterly Performance Review</CardTitle>
              <CardDescription>Performance metrics by quarter</CardDescription>
            </CardHeader>
            <CardContent>
              <div role="img" aria-label="Quarterly performance bar chart: performance score, projects completed, and teamwork score by quarter">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                  <XAxis dataKey="quarter" stroke={colors.axisText} />
                  <YAxis stroke={colors.axisText} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="performance" fill={colors.primary} name="Performance Score" />
                  <Bar dataKey="projects" fill={colors.secondary} name="Projects Completed" />
                  <Bar dataKey="teamwork" fill={colors.quaternary} name="Teamwork Score" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

ProgressReportPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
