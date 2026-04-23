import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Trash2, Award, Calendar, MessageSquare, Info } from "lucide-react";
import { motion } from "motion/react";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  date: string;
  type: "info" | "success" | "warning" | "badge";
  read: boolean;
  category: "system" | "awards" | "leave" | "engagement";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New Badge Earned! 🏅",
      message: "Congratulations! You've earned the 'Punctual Pro' badge for maintaining 100% attendance this month.",
      time: "2 min ago",
      date: "Nov 5, 2025",
      type: "badge",
      read: false,
      category: "awards",
    },
    {
      id: "2",
      title: "Voting Started",
      message: "Monthly award voting is now open. Cast your votes before Nov 15!",
      time: "1 hour ago",
      date: "Nov 5, 2025",
      type: "info",
      read: false,
      category: "system",
    },
    {
      id: "3",
      title: "Leave Request Approved ✓",
      message: "Your leave request for Nov 10-15 has been approved by HR. Have a great time!",
      time: "3 hours ago",
      date: "Nov 5, 2025",
      type: "success",
      read: false,
      category: "leave",
    },
    {
      id: "4",
      title: "You're in the Top 10!",
      message: "Amazing work! You've moved up to #7 in the monthly leaderboard.",
      time: "5 hours ago",
      date: "Nov 5, 2025",
      type: "success",
      read: true,
      category: "engagement",
    },
    {
      id: "5",
      title: "Upcoming Deadline",
      message: "Staff evaluation closes in 2 days. Don't miss out on voting!",
      time: "1 day ago",
      date: "Nov 4, 2025",
      type: "warning",
      read: true,
      category: "system",
    },
    {
      id: "6",
      title: "New Team Announcement",
      message: "All-hands meeting scheduled for Friday at 3 PM. Attendance is mandatory.",
      time: "1 day ago",
      date: "Nov 4, 2025",
      type: "info",
      read: true,
      category: "system",
    },
    {
      id: "7",
      title: "Evaluation Results Published",
      message: "The results for October's evaluations are now available. Check the Results page!",
      time: "2 days ago",
      date: "Nov 3, 2025",
      type: "info",
      read: true,
      category: "awards",
    },
    {
      id: "8",
      title: "Active Voice Badge Progress",
      message: "You're 3 chat messages away from earning the 'Active Voice' badge!",
      time: "3 days ago",
      date: "Nov 2, 2025",
      type: "badge",
      read: true,
      category: "engagement",
    },
  ]);

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "awards":
        return Award;
      case "leave":
        return Calendar;
      case "engagement":
        return MessageSquare;
      default:
        return Info;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "success":
      case "badge":
        return "#1F6E4A";
      case "warning":
        return "#FFD400";
      default:
        return "#60a5fa";
    }
  };

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with all your alerts and announcements</p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                  {notifications.length}
                </p>
              </div>
              <Bell className="w-8 h-8 text-brand" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unread</p>
                <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                  {unreadCount}
                </p>
              </div>
              <Badge className="bg-destructive text-white text-lg p-2 h-auto">
                New
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Badges</p>
                <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                  {notifications.filter((n) => n.type === "badge").length}
                </p>
              </div>
              <Award className="w-8 h-8 text-brand-yellow" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Today</p>
                <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                  {notifications.filter((n) => n.date === "Nov 5, 2025").length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-brand" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger
            value="all"
            onClick={() => setFilter("all")}
            className="data-[state=active]:bg-brand data-[state=active]:text-white"
          >
            All Notifications
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            onClick={() => setFilter("unread")}
            className="data-[state=active]:bg-brand data-[state=active]:text-white"
          >
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger
            value="awards"
            className="data-[state=active]:bg-brand data-[state=active]:text-white"
          >
            Awards & Badges
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-brand data-[state=active]:text-white"
          >
            System Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = getIcon(notification.category);
            const color = getColor(notification.type);

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card
                  className={`shadow-sm cursor-pointer transition-all ${
                    notification.read ? "bg-card" : "bg-brand-subtle dark:bg-muted border-l-4"
                  }`}
                  style={{ borderLeftColor: notification.read ? "transparent" : color }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-foreground">{notification.title}</h3>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {!notification.read && (
                              <Badge className="bg-destructive text-white hover:bg-destructive">
                                New
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="hover:bg-muted p-1 h-auto"
                            >
                              <Check className="w-4 h-4 text-brand" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(notification.id)}
                              className="hover:bg-red-50 p-1 h-auto"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{notification.time}</span>
                          <span>•</span>
                          <span>{notification.date}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="unread">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-card shadow-sm">
              <CardContent className="p-12 text-center">
                <Check className="w-16 h-16 text-brand mx-auto mb-4" />
                <h3 className="text-foreground mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">You have no unread notifications.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const Icon = getIcon(notification.category);
                const color = getColor(notification.type);

                return (
                  <Card
                    key={notification.id}
                    className="bg-brand-subtle dark:bg-muted border-l-4 shadow-sm"
                    style={{ borderLeftColor: color }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-foreground mb-2">{notification.title}</h3>
                          <p className="text-muted-foreground text-sm">{notification.message}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="bg-brand hover:bg-brand/90 text-white"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="awards">
          <div className="space-y-3">
            {notifications
              .filter((n) => n.category === "awards" || n.type === "badge")
              .map((notification) => {
                const color = getColor(notification.type);

                return (
                  <Card
                    key={notification.id}
                    className={`shadow-sm ${!notification.read ? "bg-brand-subtle dark:bg-muted" : "bg-card"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Award className="w-6 h-6" style={{ color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-foreground mb-2">{notification.title}</h3>
                          <p className="text-muted-foreground text-sm">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-3">
            {notifications
              .filter((n) => n.category === "system")
              .map((notification) => {
                const color = getColor(notification.type);

                return (
                  <Card
                    key={notification.id}
                    className={`shadow-sm ${!notification.read ? "bg-brand-subtle dark:bg-muted" : "bg-card"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Info className="w-6 h-6" style={{ color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-foreground mb-2">{notification.title}</h3>
                          <p className="text-muted-foreground text-sm">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

NotificationsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
