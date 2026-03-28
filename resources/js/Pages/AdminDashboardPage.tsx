import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
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

import { router } from "@inertiajs/react";

export default function AdminDashboardPage() {
  const onNavigate = (page: string) => {
    router.visit(`/${page}`);
  };
  // Mock data for charts
  const voteDistribution = [
    { name: "Staff of Year", value: 45, color: "#1F6E4A" },
    { name: "Culture Champion", value: 38, color: "#FFD400" },
    { name: "Most Punctual", value: 42, color: "#4ade80" },
    { name: "Innovation", value: 35, color: "#fbbf24" },
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
    { type: "Leave Request", count: 5, color: "#FFD400" },
    { type: "Task Reviews", count: 3, color: "#1F6E4A" },
    { type: "Evaluations", count: 2, color: "#fbbf24" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-8 border-2 border-[#1F6E4A] shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#1F2937] mb-2">Admin Dashboard</h1>
            <p className="text-[#6b7280]">Manage evaluations, tasks, and team analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2 border-[#1F6E4A] text-[#1F6E4A]">
              <Activity className="w-3 h-3" />
              <span>Live</span>
            </Badge>
            <span className="text-sm text-[#6b7280]">Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white border-2 border-[#1F6E4A] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-lg bg-[#1F6E4A]/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#1F6E4A]" />
                </div>
                <Badge variant="outline" className="border-[#1F6E4A] text-[#1F6E4A]">124</Badge>
              </div>
              <p className="text-sm text-[#6b7280] mb-1">Total Staff</p>
              <p className="text-3xl text-[#1F2937] mb-2">Active</p>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-[#6b7280] mt-2">92% engagement rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white border-2 border-[#FFD400] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-lg bg-[#FFD400]/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#FFD400]" />
                </div>
                <TrendingUp className="w-5 h-5 text-[#1F6E4A]" />
              </div>
              <p className="text-sm text-[#6b7280] mb-1">Evaluations</p>
              <p className="text-3xl text-[#1F2937] mb-2">156</p>
              <Progress value={78} className="h-2" />
              <p className="text-xs text-[#6b7280] mt-2">78% completion rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-white border-2 border-[#1F6E4A] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-lg bg-[#1F6E4A]/10 flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-[#1F6E4A]" />
                </div>
                <Badge variant="outline" className="border-[#1F6E4A] text-[#1F6E4A]">42</Badge>
              </div>
              <p className="text-sm text-[#6b7280] mb-1">Total Tasks</p>
              <p className="text-3xl text-[#1F2937] mb-2">73%</p>
              <Progress value={73} className="h-2" />
              <p className="text-xs text-[#6b7280] mt-2">Completion rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-white border-2 border-[#ef4444] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-[#ef4444]" />
                </div>
                <Badge variant="outline" className="border-[#ef4444] text-[#ef4444]">5</Badge>
              </div>
              <p className="text-sm text-[#6b7280] mb-1">Overdue Tasks</p>
              <p className="text-3xl text-[#ef4444] mb-2">Urgent</p>
              <p className="text-xs text-[#ef4444] mt-4">Requires immediate attention</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border-2 border-[#e5e7eb] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#1F2937]">Quick Actions</CardTitle>
            <CardDescription className="text-[#6b7280]">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white h-auto py-4 flex-col"
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
                <Download className="w-6 h-6 mb-2 text-[#1F6E4A]" />
                <span className="text-sm">Export Results</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col border-2"
                onClick={() => onNavigate("results")}
              >
                <Award className="w-6 h-6 mb-2 text-[#FFD400]" />
                <span className="text-sm">View Reports</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col border-2"
                onClick={() => onNavigate("staff-overview")}
              >
                <Users className="w-6 h-6 mb-2 text-[#1F6E4A]" />
                <span className="text-sm">Staff Overview</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col border-2"
                onClick={() => onNavigate("leave")}
              >
                <Calendar className="w-6 h-6 mb-2 text-[#6b7280]" />
                <span className="text-sm">Leave Requests</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col border-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-6 h-6 mb-2 text-[#6b7280]" />
                <span className="text-sm">Refresh Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-2 border-[#e5e7eb]">
          <CardHeader>
            <CardTitle className="text-[#1F2937]">Pending Approvals</CardTitle>
            <CardDescription className="text-[#6b7280]">
              Items requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border-2 border-[#e5e7eb] rounded-lg hover:shadow-sm hover:border-[#1F6E4A] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <AlertCircle className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm text-[#1F2937]">{item.type}</p>
                    <p className="text-xs text-[#6b7280]">{item.count} pending</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#6b7280]" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vote Distribution */}
        <Card className="bg-white shadow-sm border-2 border-[#e5e7eb]">
          <CardHeader>
            <CardTitle className="text-[#1F2937]">Vote Distribution</CardTitle>
            <CardDescription className="text-[#6b7280]">
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
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Nominees */}
        <Card className="bg-white shadow-sm border-2 border-[#e5e7eb]">
          <CardHeader>
            <CardTitle className="text-[#1F2937]">Top Nominees</CardTitle>
            <CardDescription className="text-[#6b7280]">
              Leading candidates across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topNominees.map((nominee, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border-2 border-[#e5e7eb] rounded-lg hover:shadow-sm hover:border-[#1F6E4A] transition-all"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-[#1F6E4A]'
                    }`}>
                    {index + 1}
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[#1F6E4A] text-white">
                      {nominee.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-[#1F2937]">{nominee.name}</p>
                    <p className="text-xs text-[#6b7280]">{nominee.department}</p>
                  </div>
                  <Badge variant="outline" className="border-[#1F6E4A] text-[#1F6E4A]">
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
        <Card className="bg-white shadow-sm border-2 border-[#e5e7eb]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#1F2937] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#1F6E4A]" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-[#6b7280]">
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
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'leave' ? 'bg-[#FFD400]' :
                      activity.type === 'vote' ? 'bg-[#1F6E4A]' :
                        activity.type === 'task' ? 'bg-[#4ade80]' :
                          'bg-[#fbbf24]'
                    }`} />
                  <div className="flex-1">
                    <p className="text-sm text-[#1F2937]">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-[#6b7280] flex items-center gap-1 mt-1">
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
        <Card className="bg-white shadow-sm border-2 border-[#e5e7eb]">
          <CardHeader>
            <CardTitle className="text-[#1F2937] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#1F6E4A]" />
              Task Overview
            </CardTitle>
            <CardDescription className="text-[#6b7280]">
              Team task statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#f0fdf4] rounded-lg border-2 border-[#1F6E4A]">
                <p className="text-2xl text-[#1F2937]">31</p>
                <p className="text-xs text-[#6b7280] mt-1">Completed</p>
              </div>
              <div className="p-4 bg-[#fff9e6] rounded-lg border-2 border-[#FFD400]">
                <p className="text-2xl text-[#1F2937]">6</p>
                <p className="text-xs text-[#6b7280] mt-1">In Progress</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">High Priority</span>
                <span className="text-[#ef4444]">8 tasks</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">Medium Priority</span>
                <span className="text-[#FFD400]">15 tasks</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7280]">Low Priority</span>
                <span className="text-[#1F6E4A]">19 tasks</span>
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
