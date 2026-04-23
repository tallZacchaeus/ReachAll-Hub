import MainLayout from "@/layouts/MainLayout";
import { router } from "@inertiajs/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Timer,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  status: "present" | "late" | "absent" | "half-day";
  notes?: string | null;
}

interface MonthOption {
  value: string;
  label: string;
}

interface AttendancePageProps {
  userRole?: string;
  selectedMonth: string;
  monthOptions: MonthOption[];
  attendanceRecords: AttendanceRecord[];
  summary: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    totalHours: number;
    attendanceRate: number;
  };
}

export default function AttendancePage({
  selectedMonth,
  monthOptions,
  attendanceRecords,
  summary,
}: AttendancePageProps) {
  const getStatusConfig = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          label: "Present",
        };
      case "late":
        return {
          icon: AlertCircle,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          label: "Late",
        };
      case "absent":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          label: "Absent",
        };
      case "half-day":
        return {
          icon: Clock,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          label: "Half Day",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          label: "Unknown",
        };
    }
  };

  const handleMonthChange = (month: string) => {
    router.get(
      "/attendance",
      { month },
      {
        preserveScroll: true,
        preserveState: true,
        replace: true,
      }
    );
  };

  const handleDownloadReport = () => {
    const monthName = new Date(`${selectedMonth}-01`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const rows = [
      ["Date", "Clock In", "Clock Out", "Total Hours", "Status", "Notes"],
      ...attendanceRecords.map((record) => [
        new Date(record.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        record.clockIn,
        record.clockOut,
        record.totalHours.toFixed(2),
        getStatusConfig(record.status).label,
        record.notes || "-",
      ]),
      [],
      ["Summary"],
      [`Total Days: ${summary.totalDays}`],
      [`Present Days: ${summary.presentDays}`],
      [`Late Days: ${summary.lateDays}`],
      [`Absent Days: ${summary.absentDays}`],
      [`Total Hours: ${summary.totalHours.toFixed(2)}`],
      [`Attendance Rate: ${summary.attendanceRate}%`],
    ];

    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `attendance-${selectedMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded attendance report for ${monthName}`);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2">My Attendance</h1>
          <p className="text-sm text-muted-foreground">
            View your attendance records and track your presence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[180px] bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleDownloadReport}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border-2 border-border hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-700 border-0">
                  {summary.attendanceRate}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
              <p className="text-3xl text-foreground">
                {summary.presentDays}/{summary.totalDays}
              </p>
              <p className="text-xs text-muted-foreground mt-1">days present</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border-2 border-border hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Timer className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
              <p className="text-3xl text-foreground">{summary.totalHours.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1">hours worked</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border-2 border-border hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-0">
                  {summary.lateDays}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Late Arrivals</p>
              <p className="text-3xl text-foreground">{summary.lateDays}</p>
              <p className="text-xs text-muted-foreground mt-1">times late</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border-2 border-border hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <Badge className="bg-red-100 text-red-700 border-0">
                  {summary.absentDays}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Absent Days</p>
              <p className="text-3xl text-foreground">{summary.absentDays}</p>
              <p className="text-xs text-muted-foreground mt-1">days absent</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="rounded-2xl border-2 border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand" />
            Attendance Records
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Detailed daily attendance log for{" "}
            {new Date(`${selectedMonth}-01`).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceRecords.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#d1d5db] bg-card p-8 text-center text-sm text-muted-foreground">
                No attendance records were found for this month.
              </div>
            )}

            {attendanceRecords.map((record, index) => {
              const config = getStatusConfig(record.status);
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`border-2 ${config.borderColor} ${config.bgColor} rounded-xl hover:shadow-md transition-all`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 flex-shrink-0 w-32">
                          <Calendar className={`w-5 h-5 ${config.color}`} />
                          <div>
                            <p className="text-sm text-foreground">
                              {new Date(record.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.date).toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Clock In</p>
                          <p className="text-sm text-foreground">{record.clockIn}</p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Clock Out</p>
                          <p className="text-sm text-foreground">{record.clockOut}</p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
                          <p className="text-sm text-foreground">
                            {record.totalHours > 0 ? `${record.totalHours.toFixed(2)} hrs` : "-"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusIcon className={`w-5 h-5 ${config.color}`} />
                          <Badge className={`${config.color} bg-transparent border-0`}>
                            {config.label}
                          </Badge>
                        </div>

                        {record.notes && (
                          <div className="flex-1 min-w-0 max-w-xs">
                            <p className="text-xs text-muted-foreground italic truncate">
                              {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-2 border-brand/20 bg-gradient-to-br from-[#f0fdf4] to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-foreground mb-2">Attendance Tips</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Clock in before 9:00 AM to avoid being marked as late</li>
                <li>• Ensure you clock out daily to get accurate hour tracking</li>
                <li>• If you&apos;re absent, notify HR and submit leave request in advance</li>
                <li>• Download monthly reports for your personal records</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

AttendancePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
