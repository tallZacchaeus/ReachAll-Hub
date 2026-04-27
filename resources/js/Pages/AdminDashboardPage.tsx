import { router } from "@inertiajs/react";
import {
  Upload,
  Download,
  RefreshCw,
  Activity,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  Eye
} from "lucide-react";
import { motion } from "motion/react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MainLayout from "@/layouts/MainLayout";
import { useChartColors } from "@/lib/useChartColors";


export default function AdminDashboardPage() {
  const { colorArray } = useChartColors();
  const onNavigate = (page: string) => {
    router.visit(`/${page}`);
  };
  // UX-01: Mock data for charts uses theme-aware palette via useChartColors().
  // colorArray reactively resolves to CHART_COLOR_ARRAY_LIGHT/DARK so the
  // wedges keep contrast in both modes.
  const voteDistribution = [
    { name: "Staff of Year", value: 45, color: colorArray[0] },
    { name: "Culture Champion", value: 38, color: colorArray[1] },
    { name: "Most Punctual", value: 42, color: colorArray[5] },
    { name: "Innovation", value: 35, color: colorArray[3] },
  ];

  const topNominees = [
    { name: "Alice Johnson", votes: 45, avatar: "AJ", department: "Engineering" },
    { name: "Bob Williams", votes: 38, avatar: "BW", department: "Marketing" },
    { name: "Carol Davis", votes: 35, avatar: "CD", department: "Sales" },
    { name: "David Brown", votes: 32, avatar: "DB", department: "HR" },
    { name: "Emma Wilson", votes: 28, avatar: "EW", department: "Finance" },
  ];

  const recentActivity = [
    { id: 1, type: "leave", user: "John Smith", action: "submitted leave request", time: "5 mins ago" },
    { id: 2, type: "vote", user: "Alice Johnson", action: "voted in Staff of Year", time: "15 mins ago" },
    { id: 3, type: "task", user: "Bob Williams", action: "completed task", time: "1 hour ago" },
    { id: 4, type: "review", user: "Carol Davis", action: "submitted peer review", time: "2 hours ago" },
  ];

  const pendingApprovals = [
    { type: "Leave Request", count: 5, color: colorArray[1] },
    { type: "Task Reviews", count: 3, color: colorArray[0] },
    { type: "Evaluations", count: 2, color: colorArray[3] },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-8 border-2 border-brand shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage evaluations, tasks, and team analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2 border-brand text-brand">
              <Activity className="w-3 h-3" />
              <span>Live</span>
            </Badge>
            <span className="text-sm text-muted-foreground">Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card border-2 border-brand shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand" />
                </div>
                <Badge variant="outline" className="border-brand text-brand">124</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Staff</p>
              <p className="text-3xl text-foreground mb-2">Active</p>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">92% engagement rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card border-2 border-brand-yellow shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-brand-yellow" />
                </div>
                <TrendingUp className="w-5 h-5 text-brand" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Evaluations</p>
              <p className="text-3xl text-foreground mb-2">156</p>
              <Progress value={78} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">78% completion rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-2 border-brand shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-brand" />
                </div>
                <Badge variant="outline" className="border-brand text-brand">42</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Tasks</p>
              <p className="text-3xl text-foreground mb-2">73%</p>
              <Progress value={73} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Completion rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card border-2 border-destructive shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <Badge variant="outline" className="border-destructive text-destructive">5</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Overdue Tasks</p>
              <p className="text-3xl text-destructive mb-2">Urgent</p>
              <p className="text-xs text-destructive mt-4">Requires immediate attention</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card shadow-sm border-2 border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                className="bg-brand hover:bg-brand/90 text-white h-auto py-4 flex-col"
                onClick={() => onNavigate("staff-overview")}
              >
                <Upload className="w-6 h-6 mb-2" />
                <span className="text-sm">Upload Attendance</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col border-2"
                onClick={() => onNavigate("results")}
              >
                <Download className="w-6 h-6 mb-2 text-brand" />
                <span className="text-sm">Export Results</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col border-2"
                onClick={() => onNavigate("results")}
              >
                <Award className="w-6 h-6 mb-2 text-brand-yellow" />
                <span className="text-sm">View Reports</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col border-2"
                onClick={() => onNavigate("staff-overview")}
              >
                <Users className="w-6 h-6 mb-2 text-brand" />
                <span className="text-sm">Staff Overview</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col border-2"
                onClick={() => onNavigate("leave")}
              >
                <Calendar className="w-6 h-6 mb-2 text-muted-foreground" />
                <span className="text-sm">Leave Requests</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col border-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-6 h-6 mb-2 text-muted-foreground" />
                <span className="text-sm">Refresh Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Pending Approvals</CardTitle>
            <CardDescription className="text-muted-foreground">
              Items requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border-2 border-border rounded-lg hover:shadow-sm hover:border-brand transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <AlertCircle className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{item.type}</p>
                    <p className="text-xs text-muted-foreground">{item.count} pending</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vote Distribution */}
        <Card className="bg-card shadow-sm border-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Vote Distribution</CardTitle>
            <CardDescription className="text-muted-foreground">
              Participation by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Votes",
                },
              }}
              className="h-[300px]"
            >
              <div role="img" aria-label="Vote distribution pie chart showing votes by award category">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={voteDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {voteDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
              </div>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Nominees */}
        <Card className="bg-card shadow-sm border-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Top Nominees</CardTitle>
            <CardDescription className="text-muted-foreground">
              Leading candidates across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topNominees.map((nominee, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border-2 border-border rounded-lg hover:shadow-sm hover:border-brand transition-all"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-brand'
                    }`}>
                    {index + 1}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-brand text-white">
                      {nominee.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{nominee.name}</p>
                    <p className="text-xs text-muted-foreground">{nominee.department}</p>
                  </div>
                  <Badge variant="outline" className="border-brand text-brand">
                    {nominee.votes}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Task Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-card shadow-sm border-2 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Latest platform updates
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'leave' ? 'bg-brand-yellow' :
                      activity.type === 'vote' ? 'bg-brand' :
                        activity.type === 'task' ? 'bg-emerald-400' :
                          'bg-amber-400'
                    }`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Overview */}
        <Card className="bg-card shadow-sm border-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand" />
              Task Overview
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Team task statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-brand-subtle dark:bg-muted rounded-lg border-2 border-brand">
                <p className="text-2xl text-foreground">31</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="p-4 bg-brand-yellow/10 rounded-lg border-2 border-brand-yellow">
                <p className="text-2xl text-foreground">6</p>
                <p className="text-xs text-muted-foreground mt-1">In Progress</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">High Priority</span>
                <span className="text-destructive">8 tasks</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Medium Priority</span>
                <span className="text-brand-yellow">15 tasks</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Low Priority</span>
                <span className="text-brand">19 tasks</span>
              </div>
              <Progress value={30} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
AdminDashboardPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
