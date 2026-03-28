import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Calendar, TrendingUp, MessageSquare, ArrowRight, CheckSquare, Clock, Trophy, Users, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { DepartmentSpotlight } from "@/components/DepartmentSpotlight";
import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";

export default function DashboardPage() {
  const onNavigate = (page: string) => {
    router.visit(`/${page}`);
  };

  const stats = [
    {
      title: "Evaluation Progress",
      value: "4/5",
      subtitle: "1 vote remaining",
      icon: Award,
      color: "#1F6E4A",
      progress: 80,
      action: "evaluation",
    },
    {
      title: "My Tasks",
      value: "3/6",
      subtitle: "3 tasks pending",
      icon: CheckSquare,
      color: "#FFD400",
      progress: 50,
      action: "tasks",
    },
    {
      title: "Team Engagement",
      value: "85%",
      subtitle: "+5% from last month",
      icon: TrendingUp,
      color: "#1F6E4A",
      progress: 85,
      action: null,
    },
  ];

  const upcomingTasks = [
    { id: "1", title: "Design user dashboard mockups", due: "Nov 10", priority: "high", progress: 65 },
    { id: "2", title: "Update user authentication flow", due: "Nov 8", priority: "high", progress: 80 },
    { id: "3", title: "Implement new reporting dashboard", due: "Nov 12", priority: "medium", progress: 0 },
  ];

  const recentAnnouncements = [
    { id: "1", title: "Q4 Town Hall Meeting", date: "Nov 8", type: "Company", icon: Users },
    { id: "2", title: "Benefits Enrollment Open", date: "Nov 10", type: "HR", icon: Award },
    { id: "3", title: "Holiday Schedule Released", date: "Nov 12", type: "HR", icon: Calendar },
  ];

  const leaveStatus = {
    annual: { remaining: 12, total: 20 },
    pending: 1,
    upcoming: "Nov 10-15",
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "#ef4444";
      case "medium": return "#FFD400";
      case "low": return "#1F6E4A";
      default: return "#6b7280";
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-8 border-2 border-[#1F6E4A] shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2">Welcome back!</h1>
            <p className="text-muted-foreground">Here's what's happening with your work today</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Wednesday</p>
            <p className="text-xl text-foreground">November 5, 2025</p>
          </div>
        </div>
      </motion.div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`bg-card border-2 shadow-sm hover:shadow-md transition-all ${stat.action ? 'cursor-pointer' : ''}`}
                style={{ borderColor: stat.color }}
                onClick={() => stat.action && onNavigate(stat.action)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                    {stat.action && (
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl text-foreground mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mb-3">{stat.subtitle}</p>
                  <Progress value={stat.progress} className="h-2" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-muted-foreground">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => onNavigate("evaluation")}
                  className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white justify-start h-auto py-4"
                >
                  <Award className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="text-sm">Cast Your Vote</p>
                    <p className="text-xs opacity-80">1 remaining</p>
                  </div>
                </Button>
                <Button
                  onClick={() => onNavigate("tasks")}
                  variant="outline"
                  className="justify-start h-auto py-4 border-2"
                >
                  <CheckSquare className="w-5 h-5 mr-3 text-[#1F6E4A]" />
                  <div className="text-left">
                    <p className="text-sm text-foreground">View Tasks</p>
                    <p className="text-xs text-muted-foreground">3 pending</p>
                  </div>
                </Button>
                <Button
                  onClick={() => onNavigate("leave")}
                  variant="outline"
                  className="justify-start h-auto py-4 border-2"
                >
                  <Calendar className="w-5 h-5 mr-3 text-[#FFD400]" />
                  <div className="text-left">
                    <p className="text-sm text-foreground">Request Leave</p>
                    <p className="text-xs text-muted-foreground">12 days left</p>
                  </div>
                </Button>
                <Button
                  onClick={() => onNavigate("chat")}
                  variant="outline"
                  className="justify-start h-auto py-4 border-2"
                >
                  <MessageSquare className="w-5 h-5 mr-3 text-[#1F6E4A]" />
                  <div className="text-left">
                    <p className="text-sm text-foreground">Team Chat</p>
                    <p className="text-xs text-muted-foreground">3 unread</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Tasks */}
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-[#1F6E4A]" />
                    My Tasks
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Tasks assigned to you
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate("tasks")}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border-2 border-border rounded-lg hover:shadow-md hover:border-[#1F6E4A] transition-all cursor-pointer"
                    onClick={() => onNavigate("tasks")}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-foreground flex-1">{task.title}</h4>
                      <Badge
                        variant="outline"
                        style={{ borderColor: getPriorityColor(task.priority), color: getPriorityColor(task.priority) }}
                        className="ml-2"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Due {task.due}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Progress value={task.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{task.progress}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Peer Review Status */}
          <Card className="bg-card border-2 border-[#1F6E4A] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#1F6E4A]/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#1F6E4A]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-foreground mb-1">Peer Review</h3>
                  <p className="text-sm text-muted-foreground">Share feedback on your teammates</p>
                </div>
                <Button
                  onClick={() => onNavigate("peer-review")}
                  className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
                >
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          {/* Department Spotlight */}
          <DepartmentSpotlight />

          {/* Leaderboard Position */}
          <Card className="bg-card border-2 border-[#FFD400] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#FFD400]/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-[#FFD400]" />
                </div>
                <Badge variant="outline" className="border-[#FFD400] text-[#FFD400]">
                  #5
                </Badge>
              </div>
              <h3 className="text-foreground mb-1">Your Ranking</h3>
              <p className="text-sm text-muted-foreground mb-4">Team engagement leaderboard</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onNavigate("leaderboard")}
              >
                View Leaderboard
              </Button>
            </CardContent>
          </Card>

          {/* Recent Announcements */}
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAnnouncements.map((announcement, index) => {
                  const Icon = announcement.icon;
                  return (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 border-2 border-border rounded-lg hover:shadow-sm hover:border-[#1F6E4A] transition-all cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#1F6E4A]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#1F6E4A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground mb-1">{announcement.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {announcement.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{announcement.date}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

DashboardPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;