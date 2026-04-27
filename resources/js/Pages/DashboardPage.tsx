import { router } from "@inertiajs/react";
import {
  Award,
  Calendar,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CheckSquare,
  Clock,
  Trophy,
  Users,
  Target,
  BookOpen,
  ListChecks,
  ScrollText,
  AlertCircle,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { motion } from "motion/react";

import { BulletinWidget, BulletinItem } from "@/components/BulletinWidget";
import { DepartmentSpotlight } from "@/components/DepartmentSpotlight";
import { PendingAcknowledgementsWidget } from "@/components/PendingAcknowledgementsWidget";
import { RecognitionWidget, RecentRecognition } from "@/components/RecognitionWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import MainLayout from "@/layouts/MainLayout";


interface EnrolledCourse {
  title: string;
  type: string;
  progress: number;
}

interface OKRSummaryItem {
  title: string;
  progress: number;
}

interface DashboardPageProps {
  employeeStage?: "joiner" | "performer" | "leader";
  userName?: string;
  daysHere?: number;
  bulletins?: BulletinItem[];
  pendingAckCount?: number;
  recentRecognitions?: RecentRecognition[];
  receivedThisMonth?: number;
  // Joiner
  checklistCompletePct?: number;
  checklistCompletedItems?: number;
  checklistTotalItems?: number;
  mandatoryCoursesRemaining?: number;
  // Performer
  learningInProgress?: number;
  learningCompleted?: number;
  enrolledCourses?: EnrolledCourse[];
  // Leader
  teamSize?: number;
  pendingApprovals?: number;
  activeOKRsCount?: number;
  onTrackKRsCount?: number;
  activeOKRList?: OKRSummaryItem[];
}

export default function DashboardPage({
  employeeStage = "performer",
  userName = "",
  daysHere = 0,
  bulletins = [],
  pendingAckCount = 0,
  recentRecognitions = [],
  receivedThisMonth = 0,
  checklistCompletePct = 0,
  checklistCompletedItems = 0,
  checklistTotalItems = 0,
  mandatoryCoursesRemaining = 0,
  learningInProgress = 0,
  learningCompleted = 0,
  enrolledCourses = [],
  teamSize = 0,
  pendingApprovals = 0,
  activeOKRsCount = 0,
  onTrackKRsCount = 0,
  activeOKRList = [],
}: DashboardPageProps) {
  const onNavigate = (path: string) => {
    router.visit(path);
  };

  const firstName = userName.split(" ")[0] || "there";

  // ─── Joiner Dashboard ───────────────────────────────────────────────────────
  if (employeeStage === "joiner") {
    return (
      <div className="space-y-8">
        {/* Welcome hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-8 border-2 border-brand shadow-sm"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-brand-yellow" />
                <Badge className="bg-brand-yellow/20 text-brand border-0 text-xs">New Joiner</Badge>
              </div>
              <h1 className="text-foreground mb-2">Welcome, {firstName}! 👋</h1>
              <p className="text-muted-foreground max-w-lg">
                We're so glad you're here. This is your home base for getting started — everything
                you need for your first days is right here.
              </p>
            </div>
            <div className="bg-brand/10 rounded-xl px-6 py-4 text-center">
              <p className="text-3xl font-bold text-brand">{daysHere}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {daysHere === 1 ? "day" : "days"} with us
              </p>
            </div>
          </div>
        </motion.div>

        <PendingAcknowledgementsWidget count={pendingAckCount} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Onboarding checklist progress — placeholder */}
            <Card className="bg-card border-2 border-border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-brand" />
                      Onboarding Checklist
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Track your onboarding progress
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onNavigate("/checklists")}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="text-foreground font-medium">{checklistCompletedItems} / {checklistTotalItems} tasks</span>
                    </div>
                    <Progress value={checklistCompletePct} className="h-2" />
                  </div>
                  {checklistTotalItems === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No checklist items assigned yet.
                    </p>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-foreground">{checklistCompletePct}% complete</span>
                      <Badge
                        variant="outline"
                        className={checklistCompletePct === 100 ? "border-green-400 text-green-600" : "border-amber-300 text-amber-600"}
                      >
                        {checklistCompletePct === 100 ? "Done!" : "In Progress"}
                      </Badge>
                    </div>
                  )}
                  {mandatoryCoursesRemaining > 0 && (
                    <div
                      className="flex items-center gap-3 p-3 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50/50"
                      onClick={() => onNavigate("/learning")}
                    >
                      <BookOpen className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-sm text-foreground flex-1">
                        {mandatoryCoursesRemaining} mandatory course{mandatoryCoursesRemaining !== 1 ? "s" : ""} remaining
                      </span>
                      <Badge variant="outline" className="text-xs border-red-300 text-red-500">Required</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="bg-card border-2 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => onNavigate("/onboarding")}
                    className="bg-brand hover:bg-brand/90 text-white justify-start h-auto py-4"
                  >
                    <Sparkles className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <p className="text-sm">Welcome Hub</p>
                      <p className="text-xs opacity-80">Start here</p>
                    </div>
                  </Button>
                  <Button
                    onClick={() => onNavigate("/content?category=policies")}
                    variant="outline"
                    className="justify-start h-auto py-4 border-2"
                  >
                    <ScrollText className="w-5 h-5 mr-3 text-brand" />
                    <div className="text-left">
                      <p className="text-sm text-foreground">Policies</p>
                      <p className="text-xs text-muted-foreground">Read & acknowledge</p>
                    </div>
                  </Button>
                  <Button
                    onClick={() => onNavigate("/chat")}
                    variant="outline"
                    className="justify-start h-auto py-4 border-2"
                  >
                    <MessageSquare className="w-5 h-5 mr-3 text-brand" />
                    <div className="text-left">
                      <p className="text-sm text-foreground">Team Chat</p>
                      <p className="text-xs text-muted-foreground">Say hi to the team</p>
                    </div>
                  </Button>
                  <Button
                    onClick={() => onNavigate("/learning")}
                    variant="outline"
                    className="justify-start h-auto py-4 border-2"
                  >
                    <BookOpen className="w-5 h-5 mr-3 text-brand-yellow" />
                    <div className="text-left">
                      <p className="text-sm text-foreground">Learning</p>
                      <p className="text-xs text-muted-foreground">Mandatory courses</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Pending policies */}
            <Card className={`bg-card border-2 shadow-sm ${pendingAckCount > 0 ? "border-orange-200 dark:border-orange-800" : "border-border"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2 text-base">
                  <AlertCircle className={`w-4 h-4 ${pendingAckCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                  Pending Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingAckCount === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">All policies acknowledged. ✓</p>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg mb-3">
                    <span className="text-sm text-foreground">{pendingAckCount} policy{pendingAckCount !== 1 ? " items" : ""} need acknowledgement</span>
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-500 shrink-0">Action required</Badge>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onNavigate("/content?category=policies")}
                >
                  View Policies
                </Button>
              </CardContent>
            </Card>

            <DepartmentSpotlight />

            <BulletinWidget bulletins={bulletins} />
          </div>
        </div>
      </div>
    );
  }

  // ─── Leader Dashboard ────────────────────────────────────────────────────────
  if (employeeStage === "leader") {
    const stats = [
      {
        title: "My Performance",
        value: "4/5",
        subtitle: "1 vote remaining",
        icon: Award,
        borderClass: "border-brand",
        iconBgClass: "bg-brand/10",
        iconColorClass: "text-brand",
        progress: 80,
        action: "/evaluation",
      },
      {
        title: "My Tasks",
        value: "3/6",
        subtitle: "3 tasks pending",
        icon: CheckSquare,
        borderClass: "border-brand-yellow",
        iconBgClass: "bg-brand-yellow/10",
        iconColorClass: "text-brand-yellow",
        progress: 50,
        action: "/tasks",
      },
      {
        title: "Team Engagement",
        value: "85%",
        subtitle: "+5% from last month",
        icon: TrendingUp,
        borderClass: "border-brand",
        iconBgClass: "bg-brand/10",
        iconColorClass: "text-brand",
        progress: 85,
        action: null,
      },
    ];

    return (
      <div className="space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-8 border-2 border-brand shadow-sm"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-100 text-purple-700 border-0 text-xs dark:bg-purple-900 dark:text-purple-200">
                  Leader
                </Badge>
              </div>
              <h1 className="text-foreground mb-2">Welcome back, {firstName}!</h1>
              <p className="text-muted-foreground">Here's your leadership overview for today.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", { weekday: "long" })}
              </p>
              <p className="text-xl text-foreground">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </motion.div>

        <PendingAcknowledgementsWidget count={pendingAckCount} />

        {/* Stats */}
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
                  className={`bg-card border-2 shadow-sm hover:shadow-md transition-all ${stat.borderClass} ${stat.action ? "cursor-pointer" : ""}`}
                  onClick={() => stat.action && onNavigate(stat.action)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.iconBgClass}`}>
                        <Icon className={`w-6 h-6 ${stat.iconColorClass}`} />
                      </div>
                      {stat.action && <ArrowRight className="w-5 h-5 text-muted-foreground" />}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Team Overview — placeholder */}
            <Card className="bg-card border-2 border-purple-200 dark:border-purple-800 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Team Overview
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Your direct reports at a glance
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onNavigate("/team")}>
                    Full Dashboard
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate("/team")}
                    className="text-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="text-2xl font-bold text-purple-600">{teamSize}</p>
                    <p className="text-xs text-muted-foreground mt-1">Direct Reports</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate("/okrs")}
                    className="text-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="text-2xl font-bold text-brand">{activeOKRsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Active OKRs</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate("/requests")}
                    className="text-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className={`text-2xl font-bold ${pendingApprovals > 0 ? "text-orange-500" : "text-foreground"}`}>{pendingApprovals}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pending Approvals</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* OKR Summary — placeholder */}
            <Card className="bg-card border-2 border-border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Target className="w-5 h-5 text-brand" />
                      OKR Summary
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Objectives & Key Results — current period
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onNavigate("/okrs")}>
                    View OKRs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeOKRList.length === 0 ? (
                  <div className="flex flex-col items-center py-6 gap-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-brand" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No active OKRs</p>
                    <p className="text-xs text-muted-foreground">Set objectives for this period to track your progress.</p>
                    <Button size="sm" variant="outline" className="mt-1" onClick={() => onNavigate("/okrs")}>
                      Create OKR
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeOKRList.map((okr) => (
                      <div key={okr.title} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-foreground truncate flex-1">{okr.title}</p>
                          <span className="text-xs text-muted-foreground ml-2 shrink-0">{okr.progress}%</span>
                        </div>
                        <Progress value={okr.progress} className="h-1.5" />
                      </div>
                    ))}
                    {activeOKRsCount > 3 && (
                      <p className="text-xs text-muted-foreground text-center">+{activeOKRsCount - 3} more</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <DepartmentSpotlight />

            <Card className="bg-card border-2 border-brand-yellow shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-brand-yellow" />
                  </div>
                  <Badge variant="outline" className="border-brand-yellow text-brand-yellow">#5</Badge>
                </div>
                <h3 className="text-foreground mb-1">Your Ranking</h3>
                <p className="text-sm text-muted-foreground mb-4">Team engagement leaderboard</p>
                <Button variant="outline" className="w-full" onClick={() => onNavigate("/leaderboard")}>
                  View Leaderboard
                </Button>
              </CardContent>
            </Card>

            <RecognitionWidget
              recentRecognitions={recentRecognitions}
              receivedThisMonth={receivedThisMonth}
            />

            <BulletinWidget bulletins={bulletins} />
          </div>
        </div>
      </div>
    );
  }

  // ─── Performer Dashboard (default) ──────────────────────────────────────────
  const stats = [
    {
      title: "Evaluation Progress",
      value: "4/5",
      subtitle: "1 vote remaining",
      icon: Award,
      borderClass: "border-brand",
      iconBgClass: "bg-brand/10",
      iconColorClass: "text-brand",
      progress: 80,
      action: "/evaluation",
    },
    {
      title: "My Tasks",
      value: "3/6",
      subtitle: "3 tasks pending",
      icon: CheckSquare,
      borderClass: "border-brand-yellow",
      iconBgClass: "bg-brand-yellow/10",
      iconColorClass: "text-brand-yellow",
      progress: 50,
      action: "/tasks",
    },
    {
      title: "Team Engagement",
      value: "85%",
      subtitle: "+5% from last month",
      icon: TrendingUp,
      borderClass: "border-brand",
      iconBgClass: "bg-brand/10",
      iconColorClass: "text-brand",
      progress: 85,
      action: null,
    },
  ];

  const upcomingTasks = [
    { id: "1", title: "Design user dashboard mockups", due: "Nov 10", priority: "high", progress: 65 },
    { id: "2", title: "Update user authentication flow", due: "Nov 8", priority: "high", progress: 80 },
    { id: "3", title: "Implement new reporting dashboard", due: "Nov 12", priority: "medium", progress: 0 },
  ];

  const leaveStatus = { annual: { remaining: 12, total: 20 } };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high": return "border-red-500 text-red-500";
      case "medium": return "border-brand-yellow text-brand-yellow";
      case "low": return "border-brand text-brand";
      default: return "border-gray-500 text-gray-500";
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-8 border-2 border-brand shadow-sm"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs dark:bg-blue-900 dark:text-blue-200">
                Performer
              </Badge>
            </div>
            <h1 className="text-foreground mb-2">Welcome back, {firstName}!</h1>
            <p className="text-muted-foreground">Here's what's happening with your work today.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </p>
            <p className="text-xl text-foreground">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </motion.div>

      <PendingAcknowledgementsWidget count={pendingAckCount} />

      {/* Stats */}
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
                className={`bg-card border-2 shadow-sm hover:shadow-md transition-all ${stat.borderClass} ${stat.action ? "cursor-pointer" : ""}`}
                onClick={() => stat.action && onNavigate(stat.action)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.iconBgClass}`}>
                      <Icon className={`w-6 h-6 ${stat.iconColorClass}`} />
                    </div>
                    {stat.action && <ArrowRight className="w-5 h-5 text-muted-foreground" />}
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

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription className="text-muted-foreground">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => onNavigate("/evaluation")}
                  className="bg-brand hover:bg-brand/90 text-white justify-start h-auto py-4"
                >
                  <Award className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="text-sm">Cast Your Vote</p>
                    <p className="text-xs opacity-80">1 remaining</p>
                  </div>
                </Button>
                <Button
                  onClick={() => onNavigate("/tasks")}
                  variant="outline"
                  className="justify-start h-auto py-4 border-2"
                >
                  <CheckSquare className="w-5 h-5 mr-3 text-brand" />
                  <div className="text-left">
                    <p className="text-sm text-foreground">View Tasks</p>
                    <p className="text-xs text-muted-foreground">3 pending</p>
                  </div>
                </Button>
                <Button
                  onClick={() => onNavigate("/leave")}
                  variant="outline"
                  className="justify-start h-auto py-4 border-2"
                >
                  <Calendar className="w-5 h-5 mr-3 text-brand-yellow" />
                  <div className="text-left">
                    <p className="text-sm text-foreground">Request Leave</p>
                    <p className="text-xs text-muted-foreground">
                      {leaveStatus.annual.remaining} days left
                    </p>
                  </div>
                </Button>
                <Button
                  onClick={() => onNavigate("/chat")}
                  variant="outline"
                  className="justify-start h-auto py-4 border-2"
                >
                  <MessageSquare className="w-5 h-5 mr-3 text-brand" />
                  <div className="text-left">
                    <p className="text-sm text-foreground">Team Chat</p>
                    <p className="text-xs text-muted-foreground">3 unread</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card className="bg-card shadow-sm border-2 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-brand" />
                    My Tasks
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Tasks assigned to you</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => onNavigate("/tasks")}>
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
                    className="p-4 border-2 border-border rounded-lg hover:shadow-md hover:border-brand transition-all cursor-pointer"
                    onClick={() => onNavigate("/tasks")}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-foreground flex-1">{task.title}</h4>
                      <Badge
                        variant="outline"
                        className={`ml-2 ${getPriorityClass(task.priority)}`}
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

          {/* Peer Review CTA */}
          <Card className="bg-card border-2 border-brand shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand" />
                </div>
                <div className="flex-1">
                  <h3 className="text-foreground mb-1">Peer Review</h3>
                  <p className="text-sm text-muted-foreground">Share feedback on your teammates</p>
                </div>
                <Button
                  onClick={() => onNavigate("/peer-review")}
                  className="bg-brand hover:bg-brand/90 text-white shrink-0"
                >
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>

          <RecognitionWidget
            recentRecognitions={recentRecognitions}
            receivedThisMonth={receivedThisMonth}
          />

          {/* Learning progress */}
          <Card className="bg-card border-2 border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand" />
                    Learning Progress
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {learningInProgress} in progress · {learningCompleted} completed
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => onNavigate("/learning")}>
                  Go to Learning
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {enrolledCourses.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-brand" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No courses enrolled</p>
                  <p className="text-xs text-muted-foreground">Browse the learning hub to find courses relevant to you.</p>
                  <Button size="sm" variant="outline" className="mt-1" onClick={() => onNavigate("/learning")}>
                    Explore Courses
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses.map((course) => (
                    <div key={course.title} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-foreground truncate flex-1">{course.title}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ml-2 ${
                            course.type === "Mandatory"
                              ? "border-red-300 text-red-500"
                              : "border-blue-300 text-blue-500"
                          }`}
                        >
                          {course.type}
                        </Badge>
                      </div>
                      <Progress value={course.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <DepartmentSpotlight />

          <Card className="bg-card border-2 border-brand-yellow shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-brand-yellow" />
                </div>
                <Badge variant="outline" className="border-brand-yellow text-brand-yellow">#5</Badge>
              </div>
              <h3 className="text-foreground mb-1">Your Ranking</h3>
              <p className="text-sm text-muted-foreground mb-4">Team engagement leaderboard</p>
              <Button variant="outline" className="w-full" onClick={() => onNavigate("/leaderboard")}>
                View Leaderboard
              </Button>
            </CardContent>
          </Card>

          <BulletinWidget bulletins={bulletins} />
        </div>
      </div>
    </div>
  );
}

DashboardPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
