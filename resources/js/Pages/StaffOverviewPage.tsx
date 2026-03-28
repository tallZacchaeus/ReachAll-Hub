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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Download, MessageSquare, Eye, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AttendanceRecord {
  date: string;
  clockIn: string;
  clockOut: string;
  status: "present" | "late" | "absent";
}

interface Staff {
  id: string;
  staffId: string;
  name: string;
  avatar: string;
  department: string;
  role: string;
  performanceLevel: "excellent" | "good" | "average";
  email: string;
  joinDate: string;
  attendance: number;
  attendanceRecords?: AttendanceRecord[];
}

interface StaffOverviewPageProps {
  userRole?: string;
}

export default function StaffOverviewPage({ userRole = "superadmin" }: StaffOverviewPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [viewAttendance, setViewAttendance] = useState(false);

  const isStaff = userRole === "staff";

  // Generate mock attendance records for November
  const generateAttendanceRecords = (): AttendanceRecord[] => {
    const records: AttendanceRecord[] = [];
    const daysInNovember = 30;
    
    for (let day = 1; day <= daysInNovember; day++) {
      if (day % 7 === 0 || day % 7 === 6) continue; // Skip weekends
      
      const randomStatus = Math.random();
      let status: "present" | "late" | "absent";
      let clockIn = "09:00 AM";
      let clockOut = "05:00 PM";
      
      if (randomStatus < 0.85) {
        status = "present";
        const minutes = Math.floor(Math.random() * 15);
        clockIn = `09:${String(minutes).padStart(2, "0")} AM`;
        clockOut = `05:${String(Math.floor(Math.random() * 30)).padStart(2, "0")} PM`;
      } else if (randomStatus < 0.95) {
        status = "late";
        clockIn = `09:${String(15 + Math.floor(Math.random() * 45)).padStart(2, "0")} AM`;
        clockOut = `05:${String(Math.floor(Math.random() * 30)).padStart(2, "0")} PM`;
      } else {
        status = "absent";
        clockIn = "-";
        clockOut = "-";
      }
      
      records.push({
        date: `Nov ${day}, 2025`,
        clockIn,
        clockOut,
        status,
      });
    }
    
    return records;
  };

  const staffData: Staff[] = [
    // Video & Production Team (5 staff)
    {
      id: "1",
      staffId: "EMP001",
      name: "Sarah Johnson",
      avatar: "SJ",
      department: "Video & Production",
      role: "Video Producer",
      performanceLevel: "excellent",
      email: "sarah.johnson@reachall.com",
      joinDate: "Jan 2023",
      attendance: 98,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "2",
      staffId: "EMP002",
      name: "Michael Torres",
      avatar: "MT",
      department: "Video & Production",
      role: "Video Editor",
      performanceLevel: "excellent",
      email: "michael.torres@reachall.com",
      joinDate: "Mar 2023",
      attendance: 96,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "3",
      staffId: "EMP003",
      name: "Jessica Lee",
      avatar: "JL",
      department: "Video & Production",
      role: "Camera Operator",
      performanceLevel: "good",
      email: "jessica.lee@reachall.com",
      joinDate: "May 2023",
      attendance: 94,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "4",
      staffId: "EMP004",
      name: "David Martinez",
      avatar: "DM",
      department: "Video & Production",
      role: "Motion Graphics Designer",
      performanceLevel: "excellent",
      email: "david.martinez@reachall.com",
      joinDate: "Feb 2023",
      attendance: 97,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "5",
      staffId: "EMP005",
      name: "Emily Chen",
      avatar: "EC",
      department: "Video & Production",
      role: "Production Assistant",
      performanceLevel: "good",
      email: "emily.chen@reachall.com",
      joinDate: "Jun 2023",
      attendance: 93,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Project Management Team (4 staff)
    {
      id: "6",
      staffId: "EMP006",
      name: "John Rodriguez",
      avatar: "JR",
      department: "Project Management",
      role: "Senior Project Manager",
      performanceLevel: "excellent",
      email: "john.rodriguez@reachall.com",
      joinDate: "Jan 2022",
      attendance: 99,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "7",
      staffId: "EMP007",
      name: "Amanda White",
      avatar: "AW",
      department: "Project Management",
      role: "Project Manager",
      performanceLevel: "excellent",
      email: "amanda.white@reachall.com",
      joinDate: "Apr 2023",
      attendance: 96,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "8",
      staffId: "EMP008",
      name: "Robert Kim",
      avatar: "RK",
      department: "Project Management",
      role: "Project Coordinator",
      performanceLevel: "good",
      email: "robert.kim@reachall.com",
      joinDate: "Aug 2023",
      attendance: 92,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "9",
      staffId: "EMP009",
      name: "Lisa Park",
      avatar: "LP",
      department: "Project Management",
      role: "Scrum Master",
      performanceLevel: "excellent",
      email: "lisa.park@reachall.com",
      joinDate: "Mar 2023",
      attendance: 98,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Product Team (6 staff)
    {
      id: "10",
      staffId: "EMP010",
      name: "Mike Chen",
      avatar: "MC",
      department: "Product Team",
      role: "Product Manager",
      performanceLevel: "excellent",
      email: "mike.chen@reachall.com",
      joinDate: "Feb 2022",
      attendance: 100,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "11",
      staffId: "EMP011",
      name: "Rachel Green",
      avatar: "RG",
      department: "Product Team",
      role: "UX Designer",
      performanceLevel: "excellent",
      email: "rachel.green@reachall.com",
      joinDate: "May 2023",
      attendance: 97,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "12",
      staffId: "EMP012",
      name: "Daniel Brown",
      avatar: "DB",
      department: "Product Team",
      role: "UI Designer",
      performanceLevel: "good",
      email: "daniel.brown@reachall.com",
      joinDate: "Jul 2023",
      attendance: 95,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "13",
      staffId: "EMP013",
      name: "Nina Patel",
      avatar: "NP",
      department: "Product Team",
      role: "Product Analyst",
      performanceLevel: "excellent",
      email: "nina.patel@reachall.com",
      joinDate: "Jan 2023",
      attendance: 96,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "14",
      staffId: "EMP014",
      name: "Tom Wilson",
      avatar: "TW",
      department: "Product Team",
      role: "Product Designer",
      performanceLevel: "good",
      email: "tom.wilson@reachall.com",
      joinDate: "Sep 2023",
      attendance: 94,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "15",
      staffId: "EMP015",
      name: "Sophia Garcia",
      avatar: "SG",
      department: "Product Team",
      role: "Product Researcher",
      performanceLevel: "excellent",
      email: "sophia.garcia@reachall.com",
      joinDate: "Apr 2023",
      attendance: 98,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Content & Brand Comms Team (5 staff)
    {
      id: "16",
      staffId: "EMP016",
      name: "Emily Davis",
      avatar: "ED",
      department: "Content & Brand Comms",
      role: "Content Manager",
      performanceLevel: "excellent",
      email: "emily.davis@reachall.com",
      joinDate: "Feb 2023",
      attendance: 97,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "17",
      staffId: "EMP017",
      name: "James Anderson",
      avatar: "JA",
      department: "Content & Brand Comms",
      role: "Content Writer",
      performanceLevel: "good",
      email: "james.anderson@reachall.com",
      joinDate: "Jun 2023",
      attendance: 93,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "18",
      staffId: "EMP018",
      name: "Olivia Martinez",
      avatar: "OM",
      department: "Content & Brand Comms",
      role: "Social Media Manager",
      performanceLevel: "excellent",
      email: "olivia.martinez@reachall.com",
      joinDate: "Mar 2023",
      attendance: 98,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "19",
      staffId: "EMP019",
      name: "Chris Taylor",
      avatar: "CT",
      department: "Content & Brand Comms",
      role: "Brand Strategist",
      performanceLevel: "excellent",
      email: "chris.taylor@reachall.com",
      joinDate: "Jan 2023",
      attendance: 96,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "20",
      staffId: "EMP020",
      name: "Megan Thomas",
      avatar: "MT",
      department: "Content & Brand Comms",
      role: "Communications Specialist",
      performanceLevel: "good",
      email: "megan.thomas@reachall.com",
      joinDate: "Aug 2023",
      attendance: 92,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Interns (4 staff)
    {
      id: "21",
      staffId: "INT001",
      name: "Alex Johnson",
      avatar: "AJ",
      department: "Interns",
      role: "Marketing Intern",
      performanceLevel: "good",
      email: "alex.johnson@reachall.com",
      joinDate: "Sep 2025",
      attendance: 90,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "22",
      staffId: "INT002",
      name: "Sophie Williams",
      avatar: "SW",
      department: "Interns",
      role: "Design Intern",
      performanceLevel: "good",
      email: "sophie.williams@reachall.com",
      joinDate: "Sep 2025",
      attendance: 88,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "23",
      staffId: "INT003",
      name: "Lucas Brown",
      avatar: "LB",
      department: "Interns",
      role: "Tech Intern",
      performanceLevel: "average",
      email: "lucas.brown@reachall.com",
      joinDate: "Oct 2025",
      attendance: 85,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "24",
      staffId: "INT004",
      name: "Emma Wilson",
      avatar: "EW",
      department: "Interns",
      role: "Content Intern",
      performanceLevel: "good",
      email: "emma.wilson@reachall.com",
      joinDate: "Sep 2025",
      attendance: 91,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Incubator Team (4 staff)
    {
      id: "25",
      staffId: "EMP025",
      name: "Kevin Zhang",
      avatar: "KZ",
      department: "Incubator Team",
      role: "Tech Trainer",
      performanceLevel: "excellent",
      email: "kevin.zhang@reachall.com",
      joinDate: "Jan 2023",
      attendance: 99,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "26",
      staffId: "EMP026",
      name: "Maria Santos",
      avatar: "MS",
      department: "Incubator Team",
      role: "Program Coordinator",
      performanceLevel: "excellent",
      email: "maria.santos@reachall.com",
      joinDate: "Mar 2023",
      attendance: 97,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "27",
      staffId: "EMP027",
      name: "Ryan Cooper",
      avatar: "RC",
      department: "Incubator Team",
      role: "Curriculum Developer",
      performanceLevel: "good",
      email: "ryan.cooper@reachall.com",
      joinDate: "May 2023",
      attendance: 95,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "28",
      staffId: "EMP028",
      name: "Priya Sharma",
      avatar: "PS",
      department: "Incubator Team",
      role: "Mentorship Lead",
      performanceLevel: "excellent",
      email: "priya.sharma@reachall.com",
      joinDate: "Feb 2023",
      attendance: 98,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Skillup Team (4 staff)
    {
      id: "29",
      staffId: "EMP029",
      name: "Daniel Park",
      avatar: "DP",
      department: "Skillup Team",
      role: "Skills Development Lead",
      performanceLevel: "excellent",
      email: "daniel.park@reachall.com",
      joinDate: "Jan 2023",
      attendance: 98,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "30",
      staffId: "EMP030",
      name: "Grace Liu",
      avatar: "GL",
      department: "Skillup Team",
      role: "Training Specialist",
      performanceLevel: "excellent",
      email: "grace.liu@reachall.com",
      joinDate: "Apr 2023",
      attendance: 96,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "31",
      staffId: "EMP031",
      name: "Carlos Rodriguez",
      avatar: "CR",
      department: "Skillup Team",
      role: "Workshop Facilitator",
      performanceLevel: "good",
      email: "carlos.rodriguez@reachall.com",
      joinDate: "Jun 2023",
      attendance: 94,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "32",
      staffId: "EMP032",
      name: "Hannah Kim",
      avatar: "HK",
      department: "Skillup Team",
      role: "Learning Coordinator",
      performanceLevel: "excellent",
      email: "hannah.kim@reachall.com",
      joinDate: "Mar 2023",
      attendance: 97,
      attendanceRecords: generateAttendanceRecords(),
    },

    // DAF Team (5 staff - Manager, Admin, Programs Coordinators)
    {
      id: "33",
      staffId: "EMP033",
      name: "Patricia Anderson",
      avatar: "PA",
      department: "DAF Team",
      role: "DAF Manager",
      performanceLevel: "excellent",
      email: "patricia.anderson@reachall.com",
      joinDate: "Jan 2022",
      attendance: 99,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "34",
      staffId: "EMP034",
      name: "Robert Wilson",
      avatar: "RW",
      department: "DAF Team",
      role: "Admin Officer",
      performanceLevel: "excellent",
      email: "robert.wilson@reachall.com",
      joinDate: "Feb 2023",
      attendance: 98,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "35",
      staffId: "EMP035",
      name: "Lisa Martinez",
      avatar: "LM",
      department: "DAF Team",
      role: "Programs Coordinator",
      performanceLevel: "excellent",
      email: "lisa.martinez@reachall.com",
      joinDate: "Mar 2023",
      attendance: 97,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "36",
      staffId: "EMP036",
      name: "Jennifer Lee",
      avatar: "JL",
      department: "DAF Team",
      role: "Programs Coordinator",
      performanceLevel: "good",
      email: "jennifer.lee@reachall.com",
      joinDate: "May 2023",
      attendance: 95,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "37",
      staffId: "EMP037",
      name: "Michael Brown",
      avatar: "MB",
      department: "DAF Team",
      role: "Community Outreach",
      performanceLevel: "good",
      email: "michael.brown@reachall.com",
      joinDate: "Jul 2023",
      attendance: 93,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Graphics Design Team (4 staff)
    {
      id: "38",
      staffId: "EMP038",
      name: "Alex Wong",
      avatar: "AW",
      department: "Graphics Design",
      role: "Senior Designer",
      performanceLevel: "excellent",
      email: "alex.wong@reachall.com",
      joinDate: "Jan 2023",
      attendance: 98,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "39",
      staffId: "EMP039",
      name: "Natalie Green",
      avatar: "NG",
      department: "Graphics Design",
      role: "Graphic Designer",
      performanceLevel: "excellent",
      email: "natalie.green@reachall.com",
      joinDate: "Mar 2023",
      attendance: 96,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "40",
      staffId: "EMP040",
      name: "Brandon Scott",
      avatar: "BS",
      department: "Graphics Design",
      role: "Illustrator",
      performanceLevel: "good",
      email: "brandon.scott@reachall.com",
      joinDate: "Jun 2023",
      attendance: 94,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "41",
      staffId: "EMP041",
      name: "Maya Patel",
      avatar: "MP",
      department: "Graphics Design",
      role: "Visual Designer",
      performanceLevel: "excellent",
      email: "maya.patel@reachall.com",
      joinDate: "Apr 2023",
      attendance: 97,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Accounting Team (3 staff)
    {
      id: "42",
      staffId: "EMP042",
      name: "Thomas Clark",
      avatar: "TC",
      department: "Accounting",
      role: "Senior Accountant",
      performanceLevel: "excellent",
      email: "thomas.clark@reachall.com",
      joinDate: "Jan 2022",
      attendance: 99,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "43",
      staffId: "EMP043",
      name: "Jennifer Adams",
      avatar: "JA",
      department: "Accounting",
      role: "Accountant",
      performanceLevel: "excellent",
      email: "jennifer.adams@reachall.com",
      joinDate: "Mar 2023",
      attendance: 97,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "44",
      staffId: "EMP044",
      name: "Richard Harris",
      avatar: "RH",
      department: "Accounting",
      role: "Financial Analyst",
      performanceLevel: "good",
      email: "richard.harris@reachall.com",
      joinDate: "May 2023",
      attendance: 95,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Business Development (2 staff)
    {
      id: "45",
      staffId: "EMP045",
      name: "Maria Garcia",
      avatar: "MG",
      department: "Business Development",
      role: "Business Developer",
      performanceLevel: "excellent",
      email: "maria.garcia@reachall.com",
      joinDate: "Feb 2023",
      attendance: 98,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "46",
      staffId: "EMP046",
      name: "Steven Mitchell",
      avatar: "SM",
      department: "Business Development",
      role: "Partnership Manager",
      performanceLevel: "excellent",
      email: "steven.mitchell@reachall.com",
      joinDate: "Apr 2023",
      attendance: 96,
      attendanceRecords: generateAttendanceRecords(),
    },

    // Additional staff to reach 50
    {
      id: "47",
      staffId: "EMP047",
      name: "Angela Roberts",
      avatar: "AR",
      department: "Video & Production",
      role: "Sound Engineer",
      performanceLevel: "good",
      email: "angela.roberts@reachall.com",
      joinDate: "Jul 2023",
      attendance: 93,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "48",
      staffId: "EMP048",
      name: "Christopher Lee",
      avatar: "CL",
      department: "Product Team",
      role: "Product Owner",
      performanceLevel: "excellent",
      email: "christopher.lee@reachall.com",
      joinDate: "Feb 2023",
      attendance: 97,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "49",
      staffId: "EMP049",
      name: "Victoria Turner",
      avatar: "VT",
      department: "Content & Brand Comms",
      role: "Copywriter",
      performanceLevel: "good",
      email: "victoria.turner@reachall.com",
      joinDate: "Sep 2023",
      attendance: 92,
      attendanceRecords: generateAttendanceRecords(),
    },
    {
      id: "50",
      staffId: "EMP050",
      name: "Andrew Phillips",
      avatar: "AP",
      department: "Graphics Design",
      role: "Brand Designer",
      performanceLevel: "excellent",
      email: "andrew.phillips@reachall.com",
      joinDate: "May 2023",
      attendance: 96,
      attendanceRecords: generateAttendanceRecords(),
    },
  ];

  // Filter staff data
  const filteredStaff = staffData.filter((staff) => {
    const searchMatch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    const departmentMatch = departmentFilter === "all" || staff.department === departmentFilter;
    const roleMatch = roleFilter === "all" || staff.role === roleFilter;
    const performanceMatch =
      performanceFilter === "all" || staff.performanceLevel === performanceFilter;

    return searchMatch && departmentMatch && roleMatch && performanceMatch;
  });

  const handleSendFeedback = () => {
    if (!feedbackNote.trim()) {
      toast.error("Please enter feedback");
      return;
    }
    toast.success("Feedback sent successfully!");
    setFeedbackNote("");
    setSelectedStaff(null);
  };

  const getPerformanceBadgeColor = (level: string) => {
    switch (level) {
      case "excellent":
        return "bg-[#d1fae5] text-[#065f46] border-[#86efac]";
      case "good":
        return "bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]";
      default:
        return "bg-[#fef9c3] dark:bg-yellow-950/30 text-[#854d0e] border-[#fde68a]";
    }
  };

  const departmentStats = staffData.reduce((acc, staff) => {
    acc[staff.department] = (acc[staff.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">Staff Overview</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor all staff members ({staffData.length} total)
          </p>
        </div>
        <Button
          variant="outline"
          className="border-[#1F6E4A] text-[#1F6E4A] hover:bg-muted"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(departmentStats).map(([dept, count]) => (
          <Card key={dept} className="bg-card rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{dept}</p>
              <p className="text-2xl text-foreground">{count}</p>
              <Badge className="bg-[#f0fdf4] dark:bg-muted text-[#1F6E4A] hover:bg-muted mt-2 text-xs">
                staff members
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search staff by name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Video & Production">Video & Production</SelectItem>
                <SelectItem value="Project Management">Project Management</SelectItem>
                <SelectItem value="Product Team">Product Team</SelectItem>
                <SelectItem value="Content & Brand Comms">Content & Brand Comms</SelectItem>
                <SelectItem value="Interns">Interns</SelectItem>
                <SelectItem value="Incubator Team">Incubator Team</SelectItem>
                <SelectItem value="Skillup Team">Skillup Team</SelectItem>
                <SelectItem value="DAF Team">DAF Team</SelectItem>
                <SelectItem value="Graphics Design">Graphics Design</SelectItem>
                <SelectItem value="Accounting">Accounting</SelectItem>
                <SelectItem value="Business Development">Business Development</SelectItem>
              </SelectContent>
            </Select>
            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="average">Average</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setDepartmentFilter("all");
                setRoleFilter("all");
                setPerformanceFilter("all");
              }}
              className="border-border"
            >
              <Filter className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground">
            Staff Directory ({filteredStaff.length})
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Complete list of all staff members
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-[#1F6E4A] text-white text-xs">
                            {staff.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-foreground">{staff.name}</p>
                          <p className="text-xs text-muted-foreground">{staff.staffId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">{staff.department}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">{staff.role}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPerformanceBadgeColor(
                          staff.performanceLevel
                        )}`}
                      >
                        {staff.performanceLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#f3f4f6] rounded-full h-2 w-16">
                          <div
                            className="bg-[#1F6E4A] h-2 rounded-full"
                            style={{ width: `${staff.attendance}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{staff.attendance}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">{staff.joinDate}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isStaff && staff.attendanceRecords ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(staff);
                              setViewAttendance(true);
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            View Attendance
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedStaff(staff)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Staff Detail Dialog (Admin view) */}
      {!isStaff && (
        <Dialog open={!!selectedStaff && !viewAttendance} onOpenChange={() => setSelectedStaff(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {selectedStaff?.name} - {selectedStaff?.staffId}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Staff member details and feedback
              </DialogDescription>
            </DialogHeader>

            {selectedStaff && (
              <div className="space-y-6 mt-4">
                {/* Staff Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm text-foreground">{selectedStaff.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Department</Label>
                    <p className="text-sm text-foreground">{selectedStaff.department}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p className="text-sm text-foreground">{selectedStaff.role}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Join Date</Label>
                    <p className="text-sm text-foreground">{selectedStaff.joinDate}</p>
                  </div>
                </div>

                {/* Send Feedback */}
                <div className="space-y-3">
                  <Label>Send Feedback</Label>
                  <Textarea
                    placeholder="Enter feedback for this staff member..."
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    className="min-h-[120px] bg-card"
                  />
                  <Button
                    onClick={handleSendFeedback}
                    className="w-full bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Feedback
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Attendance Detail Dialog (Staff view) */}
      {isStaff && (
        <Dialog open={viewAttendance} onOpenChange={() => setViewAttendance(false)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {selectedStaff?.name} - Attendance Records
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Clock-in and clock-out times for November 2025
              </DialogDescription>
            </DialogHeader>

            {selectedStaff?.attendanceRecords && (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {selectedStaff.attendanceRecords.map((record, index) => (
                    <Card
                      key={index}
                      className={`rounded-xl ${
                        record.status === "absent"
                          ? "bg-red-50 border-red-200"
                          : record.status === "late"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-foreground">{record.date}</p>
                              <Badge
                                variant="outline"
                                className={`text-xs mt-1 ${
                                  record.status === "present"
                                    ? "bg-green-100 text-green-700 border-green-300"
                                    : record.status === "late"
                                    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                    : "bg-red-100 text-red-700 border-red-300"
                                }`}
                              >
                                {record.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Clock In</p>
                              <p className="text-sm text-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {record.clockIn}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Clock Out</p>
                              <p className="text-sm text-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {record.clockOut}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

StaffOverviewPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
