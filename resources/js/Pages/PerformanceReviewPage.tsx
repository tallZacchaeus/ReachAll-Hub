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
    if (value >= 90) return "#1F6E4A";
    if (value >= 75) return "#FFD400";
    return "#ef4444";
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
        <h1 className="text-[#1F2937] mb-2">Performance Reviews</h1>
        <p className="text-[#6b7280]">
          Monitor and evaluate staff performance metrics
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Search Staff</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="bg-white">
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
                <SelectTrigger className="bg-white">
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
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-[#1F6E4A] text-white">
                          {staff.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-[#1F2937] text-lg">
                          {staff.name}
                        </CardTitle>
                        <CardDescription className="text-[#6b7280]">
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
                        <div className="flex items-center gap-2 text-[#6b7280]">
                          <Calendar className="w-4 h-4" />
                          <span>Attendance Rate</span>
                        </div>
                        <span className="text-[#1F2937]">{staff.attendance}%</span>
                      </div>
                      <Progress value={staff.attendance} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-[#6b7280]">
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat Engagement</span>
                        </div>
                        <span className="text-[#1F2937]">{staff.chatEngagement}%</span>
                      </div>
                      <Progress value={staff.chatEngagement} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-[#6b7280]">
                          <Award className="w-4 h-4" />
                          <span>Votes Received</span>
                        </div>
                        <span className="text-[#1F2937]">{staff.votesReceived} votes</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-[#6b7280]">
                          <TrendingUp className="w-4 h-4" />
                          <span>Peer Rating</span>
                        </div>
                        <span className="text-[#1F2937]">
                          {staff.peerRating.toFixed(1)}/5.0
                        </span>
                      </div>
                      <Progress value={staff.peerRating * 20} />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between">
                    <span className="text-xs text-[#6b7280]">
                      Last review: {staff.lastReview}
                    </span>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#1F6E4A] border-[#1F6E4A] hover:bg-[#f0fdf4]"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            History
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-[#1F2937]">
                              Review History - {staff.name}
                            </DialogTitle>
                            <DialogDescription className="text-[#6b7280]">
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
                              <Card key={idx} className="bg-[#F5F7F8]">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="text-[#1F2937]">{review.date}</p>
                                      <p className="text-sm text-[#6b7280]">
                                        By {review.reviewer}
                                      </p>
                                    </div>
                                    <Badge className="bg-[#1F6E4A] text-white">
                                      {review.score}%
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-[#6b7280]">{review.notes}</p>
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
                            className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-[#1F2937]">
                              Add Performance Review
                            </DialogTitle>
                            <DialogDescription className="text-[#6b7280]">
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
                                className="bg-white min-h-[120px]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleAddReview}
                                className="flex-1 bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
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
