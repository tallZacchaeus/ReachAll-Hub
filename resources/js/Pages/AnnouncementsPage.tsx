import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Megaphone, Send, Users, Calendar, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: string;
  priority: "low" | "medium" | "high";
  sentBy: string;
  sentDate: string;
  sentTime: string;
  recipients: number;
  status: "sent" | "scheduled";
}

export default function AnnouncementsPage({ userRole }: { userRole: string }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [priority, setPriority] = useState("medium");

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      title: "November Evaluation Period Reminder",
      message: "Reminder: The evaluation period for November closes this Friday, Nov 15. Please ensure all your votes are submitted before the deadline. Thank you for your participation!",
      audience: "All Staff",
      priority: "high",
      sentBy: "HR Admin",
      sentDate: "Nov 5, 2025",
      sentTime: "9:00 AM",
      recipients: 124,
      status: "sent",
    },
    {
      id: "2",
      title: "Team Meeting - Friday 3 PM",
      message: "All-hands meeting scheduled for this Friday at 3 PM in the main conference room. Attendance is mandatory. We'll discuss Q4 progress and upcoming initiatives.",
      audience: "All Staff",
      priority: "medium",
      sentBy: "Management",
      sentDate: "Nov 4, 2025",
      sentTime: "2:30 PM",
      recipients: 124,
      status: "sent",
    },
    {
      id: "3",
      title: "New Benefits Enrollment Open",
      message: "Annual benefits enrollment is now open. Please review your options and submit your selections by Nov 20. Contact HR if you have questions.",
      audience: "All Staff",
      priority: "medium",
      sentBy: "HR Admin",
      sentDate: "Nov 3, 2025",
      sentTime: "10:00 AM",
      recipients: 124,
      status: "sent",
    },
    {
      id: "4",
      title: "Tech Team - System Maintenance",
      message: "Scheduled system maintenance this Saturday, Nov 9, from 2-4 AM. The evaluation platform will be temporarily unavailable during this time.",
      audience: "All Staff",
      priority: "low",
      sentBy: "IT Department",
      sentDate: "Nov 2, 2025",
      sentTime: "4:00 PM",
      recipients: 124,
      status: "sent",
    },
    {
      id: "5",
      title: "Congratulations to October Winners!",
      message: "We're thrilled to announce the winners of October's staff awards. Check the Results Overview page to see all the amazing achievements. Great job everyone!",
      audience: "All Staff",
      priority: "low",
      sentBy: "HR Admin",
      sentDate: "Nov 1, 2025",
      sentTime: "9:30 AM",
      recipients: 124,
      status: "sent",
    },
  ]);

  const handleSendAnnouncement = () => {
    if (!title || !message) {
      alert("Please fill in all required fields");
      return;
    }

    const newAnnouncement: Announcement = {
      id: String(announcements.length + 1),
      title,
      message,
      audience: audience === "all" ? "All Staff" : audience,
      priority: priority as "low" | "medium" | "high",
      sentBy: "Admin",
      sentDate: "Nov 5, 2025",
      sentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recipients: audience === "all" ? 124 : 45,
      status: "sent",
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    setTitle("");
    setMessage("");
    setAudience("all");
    setPriority("medium");
    alert("Announcement sent successfully to all recipients!");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" };
      case "medium":
        return { bg: "bg-[#fff9e6]", text: "text-foreground", border: "border-[#FFD400]" };
      default:
        return { bg: "bg-[#f0fdf4] dark:bg-muted", text: "text-[#1F6E4A]", border: "border-[#1F6E4A]" };
    }
  };

  const isAdmin = userRole === "superadmin" || userRole === "hr";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground mb-2">Announcements & Broadcasts</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Send important updates and announcements to your team"
            : "View company announcements and updates"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Sent</p>
                <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                  {announcements.length}
                </p>
              </div>
              <Megaphone className="w-8 h-8 text-[#1F6E4A]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Week</p>
                <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                  3
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#FFD400]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recipients</p>
                <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                  124
                </p>
              </div>
              <Users className="w-8 h-8 text-[#1F6E4A]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivered</p>
                <p className="text-foreground" style={{ fontSize: "1.75rem", fontWeight: "600" }}>
                  100%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#1F6E4A]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Announcement (Admin only) */}
      {isAdmin && (
        <Card className="bg-card shadow-sm border-2 border-[#1F6E4A]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#1F6E4A]" />
              <CardTitle className="text-foreground">Create New Announcement</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Broadcast important updates to your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="audience">Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff (124)</SelectItem>
                      <SelectItem value="engineering">Engineering Team (32)</SelectItem>
                      <SelectItem value="marketing">Marketing Team (18)</SelectItem>
                      <SelectItem value="sales">Sales Team (25)</SelectItem>
                      <SelectItem value="hr">HR Team (8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority - Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Announcement Title</Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-card"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your announcement message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-card min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleSendAnnouncement}
                className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements History */}
      <Card className="bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Announcements</CardTitle>
          <CardDescription className="text-muted-foreground">
            Latest company updates and broadcasts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcements.map((announcement, index) => {
            const priorityColors = getPriorityColor(announcement.priority);

            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`shadow-sm border-l-4 ${priorityColors.border} hover:shadow-md transition-shadow`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          announcement.priority === "high"
                            ? "bg-red-100"
                            : announcement.priority === "medium"
                            ? "bg-[#fff9e6]"
                            : "bg-[#f0fdf4] dark:bg-muted"
                        }`}
                      >
                        <Megaphone
                          className="w-6 h-6"
                          style={{
                            color:
                              announcement.priority === "high"
                                ? "#ef4444"
                                : announcement.priority === "medium"
                                ? "#FFD400"
                                : "#1F6E4A",
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-foreground">{announcement.title}</h3>
                          <Badge className={`${priorityColors.bg} ${priorityColors.text} hover:${priorityColors.bg}`}>
                            {announcement.priority} priority
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">{announcement.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>👤 {announcement.sentBy}</span>
                          <span>•</span>
                          <span>📅 {announcement.sentDate}</span>
                          <span>•</span>
                          <span>🕐 {announcement.sentTime}</span>
                          <span>•</span>
                          <span>👥 {announcement.recipients} recipients</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {announcement.audience}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

AnnouncementsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
