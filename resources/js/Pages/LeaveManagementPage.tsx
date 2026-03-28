import MainLayout from "@/layouts/MainLayout";
import { router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Check, X, Clock, Eye, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface LeaveBalance {
  total: number;
  used: number;
  remaining: number;
}

interface LeaveRequestItem {
  id: string;
  staffId: string;
  staffName: string;
  type: string;
  typeKey: "annual" | "sick" | "personal";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  hrComment?: string | null;
  approverName?: string | null;
  submittedDate?: string | null;
}

interface LeaveHistoryItem {
  id: string;
  period: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string;
  approverName?: string | null;
  hrComment?: string | null;
}

interface LeaveManagementPageProps {
  userRole: string;
  currentUserName: string;
  currentUserEmployeeId?: string | null;
  leaveBalance: {
    annual: LeaveBalance;
    sick: LeaveBalance;
    personal: LeaveBalance;
  };
  requests: LeaveRequestItem[];
  leaveHistory: LeaveHistoryItem[];
}

type LeaveFormData = {
  type: "annual" | "sick" | "personal";
  startDate: string;
  endDate: string;
  reason: string;
};

export default function LeaveManagementPage({
  userRole,
  leaveBalance,
  requests,
  leaveHistory,
}: LeaveManagementPageProps) {
  const { flash } = usePage<{
    flash?: {
      success?: string;
      error?: string;
    };
  }>().props;

  const isAdmin = ["superadmin", "hr", "management"].includes(userRole);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestItem | LeaveHistoryItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const {
    data,
    setData,
    post,
    processing,
    errors,
    reset,
    clearErrors,
  } = useForm<LeaveFormData>({
    type: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }

    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash?.error, flash?.success]);

  useEffect(() => {
    if (selectedRequest && "submittedDate" in selectedRequest) {
      const next = requests.find((request) => request.id === selectedRequest.id) ?? null;
      setSelectedRequest(next);
      if (!next) {
        setShowDetailsModal(false);
      }
    }
  }, [requests, selectedRequest]);

  const resetForm = () => {
    reset();
    clearErrors();
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleSubmitRequest = () => {
    post("/leave", {
      preserveScroll: true,
      onSuccess: () => {
        resetForm();
      },
    });
  };

  const updateReviewStatus = (status: "approved" | "rejected", requestId?: string) => {
    const id = requestId ?? selectedRequest?.id;
    if (!id) {
      return;
    }

    router.patch(
      `/leave/${id}/status`,
      {
        status,
        hrComment: reviewComment.trim(),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setReviewComment("");
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-[#FFD400] text-[#1F2937]",
      approved: "bg-[#1F6E4A] text-white",
      rejected: "bg-[#ef4444] text-white",
      Approved: "bg-[#1F6E4A] text-white",
      Rejected: "bg-[#ef4444] text-white",
    };

    return styles[status as keyof typeof styles] || "bg-[#6b7280] text-white";
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved" || status === "Approved") {
      return <Check className="w-4 h-4" />;
    }

    if (status === "rejected" || status === "Rejected") {
      return <X className="w-4 h-4" />;
    }

    return <Clock className="w-4 h-4" />;
  };

  const openDetails = (request: LeaveRequestItem | LeaveHistoryItem) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
    setReviewComment("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[#1F2937] mb-2">Leave Management</h1>
        <p className="text-[#6b7280]">
          {isAdmin ? "Manage team leave requests" : "Request and track your leave"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#1F6E4A] to-[#1a5a3d] text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Annual Leave</p>
              <CalendarIcon className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-1">{leaveBalance.annual.remaining}</p>
            <p className="text-sm opacity-90">days remaining</p>
            <Progress
              value={(leaveBalance.annual.remaining / Math.max(leaveBalance.annual.total, 1)) * 100}
              className="h-2 mt-3 bg-white/20"
            />
            <p className="text-xs opacity-75 mt-2">
              {leaveBalance.annual.used} used of {leaveBalance.annual.total} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-[#1F6E4A] shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#6b7280]">Sick Leave</p>
              <CalendarIcon className="w-5 h-5 text-[#1F6E4A]" />
            </div>
            <p className="text-3xl font-bold text-[#1F2937] mb-1">{leaveBalance.sick.remaining}</p>
            <p className="text-sm text-[#6b7280]">days remaining</p>
            <Progress
              value={(leaveBalance.sick.remaining / Math.max(leaveBalance.sick.total, 1)) * 100}
              className="h-2 mt-3"
            />
            <p className="text-xs text-[#6b7280] mt-2">
              {leaveBalance.sick.used} used of {leaveBalance.sick.total} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-2 border-[#e5e7eb] shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#6b7280]">Personal Leave</p>
              <CalendarIcon className="w-5 h-5 text-[#FFD400]" />
            </div>
            <p className="text-3xl font-bold text-[#1F2937] mb-1">{leaveBalance.personal.remaining}</p>
            <p className="text-sm text-[#6b7280]">days remaining</p>
            <Progress
              value={(leaveBalance.personal.remaining / Math.max(leaveBalance.personal.total, 1)) * 100}
              className="h-2 mt-3"
            />
            <p className="text-xs text-[#6b7280] mt-2">
              {leaveBalance.personal.used} used of {leaveBalance.personal.total} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1F2937]">Request New Leave</CardTitle>
          <CardDescription className="text-[#6b7280]">
            Submit a leave request for approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <Select
                value={data.type}
                onValueChange={(value: LeaveFormData["type"]) => setData("type", value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-600">{errors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left bg-white">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(value) => {
                      setStartDate(value);
                      setData("startDate", value ? format(value, "yyyy-MM-dd") : "");
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && <p className="text-xs text-red-600">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left bg-white">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(value) => {
                      setEndDate(value);
                      setData("endDate", value ? format(value, "yyyy-MM-dd") : "");
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && <p className="text-xs text-red-600">{errors.endDate}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason / Note *</Label>
            <Textarea
              placeholder="Provide details about your leave request..."
              value={data.reason}
              onChange={(event) => setData("reason", event.target.value)}
              className="bg-white min-h-[100px]"
            />
            {errors.reason && <p className="text-xs text-red-600">{errors.reason}</p>}
          </div>

          <Button
            onClick={handleSubmitRequest}
            disabled={processing}
            className="w-full bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
          >
            Submit Leave Request
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#1F2937]">
                {isAdmin ? "Pending Requests" : "My Leave Requests"}
              </CardTitle>
              <CardDescription className="text-[#6b7280]">
                {isAdmin ? "Review and approve team leave requests" : "Track your submitted requests"}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-[#FFD400] text-[#1F2937]">
              {requests.filter((request) => request.status === "pending").length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Staff</TableHead>}
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-[#6b7280]">
                    No leave requests found.
                  </TableCell>
                </TableRow>
              )}

              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-[#F5F7F8]"
                  onClick={() => openDetails(request)}
                >
                  {isAdmin && (
                    <TableCell>
                      <div>
                        <p className="text-sm text-[#1F2937]">{request.staffName}</p>
                        <p className="text-xs text-[#6b7280]">{request.staffId}</p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-[#1F2937]">{request.type}</TableCell>
                  <TableCell className="text-[#6b7280]">{request.startDate}</TableCell>
                  <TableCell className="text-[#6b7280]">{request.endDate}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[#F5F7F8] text-[#1F2937]">
                      {request.days} {request.days === 1 ? "day" : "days"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(request.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => openDetails(request)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {isAdmin && request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
                            onClick={() => updateReviewStatus("approved", request.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateReviewStatus("rejected", request.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#1F2937]">Leave History</CardTitle>
          <CardDescription className="text-[#6b7280]">
            Your past leave records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[#6b7280]">
                    No leave history found.
                  </TableCell>
                </TableRow>
              )}

              {leaveHistory.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-[#F5F7F8]" onClick={() => openDetails(item)}>
                  <TableCell className="text-[#1F2937]">{item.period}</TableCell>
                  <TableCell className="text-[#6b7280]">{item.type}</TableCell>
                  <TableCell className="text-[#6b7280] text-sm">
                    {item.startDate} - {item.endDate}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[#F5F7F8] text-[#1F2937]">
                      {item.days} {item.days === 1 ? "day" : "days"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(item.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(item.status)}
                        {item.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openDetails(item)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1F2937] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1F6E4A]" />
              Leave Request Details
            </DialogTitle>
            <DialogDescription className="text-[#6b7280]">
              Complete information about this leave request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-[#F5F7F8] rounded-lg">
                <span className="text-sm text-[#6b7280]">Request ID</span>
                <span className="text-sm text-[#1F2937]">{selectedRequest.id}</span>
              </div>

              {isAdmin && "staffName" in selectedRequest && (
                <div className="p-3 bg-[#f0fdf4] rounded-lg border border-[#1F6E4A]">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-[#1F6E4A]" />
                    <span className="text-sm text-[#6b7280]">Staff Member</span>
                  </div>
                  <p className="text-[#1F2937]">{selectedRequest.staffName}</p>
                  <p className="text-xs text-[#6b7280]">{selectedRequest.staffId}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#6b7280]">Leave Type</Label>
                  <p className="text-[#1F2937] mt-1">{selectedRequest.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#6b7280]">Duration</Label>
                  <p className="text-[#1F2937] mt-1">
                    {selectedRequest.days} {selectedRequest.days === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#6b7280]">Start Date</Label>
                  <p className="text-[#1F2937] mt-1">{selectedRequest.startDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-[#6b7280]">End Date</Label>
                  <p className="text-[#1F2937] mt-1">{selectedRequest.endDate}</p>
                </div>
              </div>

              {"submittedDate" in selectedRequest && selectedRequest.submittedDate && (
                <div>
                  <Label className="text-xs text-[#6b7280]">Submitted On</Label>
                  <p className="text-[#1F2937] mt-1">{selectedRequest.submittedDate}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-[#6b7280]">Reason / Note</Label>
                <p className="text-sm text-[#1F2937] mt-2 p-3 bg-[#F5F7F8] rounded-lg">
                  {selectedRequest.reason}
                </p>
              </div>

              <div>
                <Label className="text-xs text-[#6b7280]">Current Status</Label>
                <div className="mt-2">
                  <Badge className={`${getStatusBadge(selectedRequest.status)} text-sm px-3 py-1`}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(selectedRequest.status)}
                      {selectedRequest.status.toUpperCase()}
                    </span>
                  </Badge>
                </div>
              </div>

              {selectedRequest.approverName && (
                <div className="p-3 bg-[#fff9e6] rounded-lg border border-[#FFD400]">
                  <Label className="text-xs text-[#6b7280]">Approver</Label>
                  <p className="text-sm text-[#1F2937] mt-1">{selectedRequest.approverName}</p>
                </div>
              )}

              {selectedRequest.hrComment && (
                <div
                  className={`p-3 rounded-lg border ${
                    selectedRequest.status.toLowerCase() === "approved"
                      ? "bg-[#f0fdf4] border-[#1F6E4A]"
                      : "bg-[#fef2f2] border-[#ef4444]"
                  }`}
                >
                  <Label className="text-xs text-[#6b7280]">HR Comment</Label>
                  <p className="text-sm text-[#1F2937] mt-1">{selectedRequest.hrComment}</p>
                </div>
              )}

              {isAdmin && "submittedDate" in selectedRequest && selectedRequest.status === "pending" && (
                <div className="space-y-3 pt-2">
                  <Label>HR Comment</Label>
                  <Textarea
                    placeholder="Optional comment for the staff member"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
                      onClick={() => {
                        updateReviewStatus("approved");
                        setShowDetailsModal(false);
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => {
                        updateReviewStatus("rejected");
                        setShowDetailsModal(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

LeaveManagementPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
