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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, FileText, Plus, TrendingUp, MessageSquare, Calendar, Award } from "lucide-react";
import { motion } from "motion/react";

interface StaffPerformance {
  id: string;
  staffId: string;
  name: string;
  avatar: string;
  department: string;
  attendance: number;
  votesReceived: number;
  chatEngagement: number;
  peerRating: number;
  lastReview: string;
}

export default function PerformanceReviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("current");
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformance | null>(null);
  const [showAddReview, setShowAddReview] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const staffPerformance: StaffPerformance[] = [
    {
      id: "1",
      staffId: "EMP001",
      name: "John Smith",
      avatar: "JS",
      department: "Engineering",
      attendance: 98,
      votesReceived: 12,
      chatEngagement: 85,
      peerRating: 4.5,
      lastReview: "Oct 2025",
    },
    {
      id: "2",
      staffId: "EMP023",
      name: "Sarah Johnson",
      avatar: "SJ",
      department: "Marketing",
      attendance: 96,
      votesReceived: 15,
      chatEngagement: 92,
      peerRating: 4.8,
      lastReview: "Oct 2025",
    },
    {
      id: "3",
      staffId: "EMP015",
      name: "Mike Chen",
      avatar: "MC",
      department: "Engineering",
      attendance: 100,
      votesReceived: 10,
      chatEngagement: 78,
      peerRating: 4.3,
      lastReview: "Oct 2025",
    },
    {
      id: "4",
      staffId: "EMP042",
      name: "Emily Davis",
      avatar: "ED",
      department: "Sales",
      attendance: 94,
      votesReceived: 18,
      chatEngagement: 88,
      peerRating: 4.7,
      lastReview: "Sep 2025",
    },
    {
      id: "5",
      staffId: "EMP008",
      name: "Alex Wong",
      avatar: "AW",
      department: "HR",
      attendance: 92,
      votesReceived: 8,
      chatEngagement: 90,
      peerRating: 4.2,
      lastReview: "Oct 2025",
    },
  ];

  const filteredStaff = staffPerformance.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.staffId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || staff.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const getPerformanceColor = (value: number) => {
    if (value >= 90) return "var(--brand)";
    if (value >= 75) return "var(--brand-yellow)";
    return "var(--destructive)";
  };

  const getOverallScore = (staff: StaffPerformance) => {
    return Math.round(
      (staff.attendance + staff.chatEngagement + staff.peerRating * 20) / 3
    );
  };

  const handleAddReview = () => {
    if (!reviewNotes) {
      alert("Please enter review notes");
      return;
    }
    alert(`Review added successfully for ${selectedStaff?.name}`);
    setReviewNotes("");
    setShowAddReview(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground mb-2">Performance Reviews</h1>
        <p className="text-muted-foreground">
          Monitor and evaluate staff performance metrics
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Search Staff</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Month</SelectItem>
                  <SelectItem value="last">Last Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStaff.map((staff, index) => {
          const overallScore = getOverallScore(staff);
          return (
            <motion.div
              key={staff.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-brand text-white">
                          {staff.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-foreground text-lg">
                          {staff.name}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {staff.staffId} • {staff.department}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      className="text-white"
                      style={{ backgroundColor: getPerformanceColor(overallScore) }}
                    >
                      {overallScore}%
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Attendance Rate</span>
                        </div>
                        <span className="text-foreground">{staff.attendance}%</span>
                      </div>
                      <Progress value={staff.attendance} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat Engagement</span>
                        </div>
                        <span className="text-foreground">{staff.chatEngagement}%</span>
                      </div>
                      <Progress value={staff.chatEngagement} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Award className="w-4 h-4" />
                          <span>Votes Received</span>
                        </div>
                        <span className="text-foreground">{staff.votesReceived} votes</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          <span>Peer Rating</span>
                        </div>
                        <span className="text-foreground">
                          {staff.peerRating.toFixed(1)}/5.0
                        </span>
                      </div>
                      <Progress value={staff.peerRating * 20} />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Last review: {staff.lastReview}
                    </span>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-brand border-brand hover:bg-muted"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            History
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">
                              Review History - {staff.name}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              Past performance reviews and feedback
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            {[
                              {
                                date: "October 2025",
                                reviewer: "HR Manager",
                                notes: "Excellent performance across all metrics. Showing strong leadership and collaboration skills.",
                                score: 92,
                              },
                              {
                                date: "July 2025",
                                reviewer: "Department Lead",
                                notes: "Good progress in technical skills. Attendance improved significantly.",
                                score: 88,
                              },
                              {
                                date: "April 2025",
                                reviewer: "HR Manager",
                                notes: "Meeting expectations. Good team player with consistent attendance.",
                                score: 85,
                              },
                            ].map((review, idx) => (
                              <Card key={idx} className="bg-muted">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="text-foreground">{review.date}</p>
                                      <p className="text-sm text-muted-foreground">
                                        By {review.reviewer}
                                      </p>
                                    </div>
                                    <Badge className="bg-brand text-white">
                                      {review.score}%
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{review.notes}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showAddReview && selectedStaff?.id === staff.id} onOpenChange={(open) => {
                        setShowAddReview(open);
                        if (open) setSelectedStaff(staff);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-brand hover:bg-brand/90 text-white"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-foreground">
                              Add Performance Review
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              Record a new performance review for {staff.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Review Notes</Label>
                              <Textarea
                                placeholder="Enter performance review notes..."
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                className="bg-card min-h-[120px]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleAddReview}
                                className="flex-1 bg-brand hover:bg-brand/90 text-white"
                              >
                                Save Review
                              </Button>
                              <Button
                                onClick={() => setShowAddReview(false)}
                                variant="outline"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

PerformanceReviewPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
