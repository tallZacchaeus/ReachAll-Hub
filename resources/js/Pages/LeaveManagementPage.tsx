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
      pending: "bg-brand-yellow text-foreground",
      approved: "bg-brand text-white",
      rejected: "bg-destructive text-white",
      Approved: "bg-brand text-white",
      Rejected: "bg-destructive text-white",
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
        <h1 className="text-foreground mb-2">Leave Management</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Manage team leave requests" : "Request and track your leave"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-brand to-[#1a5a3d] text-white border-0 shadow-lg">
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

        <Card className="bg-card border-2 border-brand shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Sick Leave</p>
              <CalendarIcon className="w-5 h-5 text-brand" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{leaveBalance.sick.remaining}</p>
            <p className="text-sm text-muted-foreground">days remaining</p>
            <Progress
              value={(leaveBalance.sick.remaining / Math.max(leaveBalance.sick.total, 1)) * 100}
              className="h-2 mt-3"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {leaveBalance.sick.used} used of {leaveBalance.sick.total} total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-2 border-border shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Personal Leave</p>
              <CalendarIcon className="w-5 h-5 text-brand-yellow" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{leaveBalance.personal.remaining}</p>
            <p className="text-sm text-muted-foreground">days remaining</p>
            <Progress
              value={(leaveBalance.personal.remaining / Math.max(leaveBalance.personal.total, 1)) * 100}
              className="h-2 mt-3"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {leaveBalance.personal.used} used of {leaveBalance.personal.total} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Request New Leave</CardTitle>
          <CardDescription className="text-muted-foreground">
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
                <SelectTrigger className="bg-card">
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
                  <Button variant="outline" className="w-full justify-start text-left bg-card">
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
                  <Button variant="outline" className="w-full justify-start text-left bg-card">
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
              className="bg-card min-h-[100px]"
            />
            {errors.reason && <p className="text-xs text-red-600">{errors.reason}</p>}
          </div>

          <Button
            onClick={handleSubmitRequest}
            disabled={processing}
            className="w-full bg-brand hover:bg-brand/90 text-white"
          >
            Submit Leave Request
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">
                {isAdmin ? "Pending Requests" : "My Leave Requests"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isAdmin ? "Review and approve team leave requests" : "Track your submitted requests"}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-brand-yellow text-foreground">
              {requests.filter((request) => request.status === "pending").length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">

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
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground">
                    No leave requests found.
                  </TableCell>
                </TableRow>
              )}

              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => openDetails(request)}
                >
                  {isAdmin && (
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{request.staffName}</p>
                        <p className="text-xs text-muted-foreground">{request.staffId}</p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-foreground">{request.type}</TableCell>
                  <TableCell className="text-muted-foreground">{request.startDate}</TableCell>
                  <TableCell className="text-muted-foreground">{request.endDate}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-muted text-foreground">
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
                            className="bg-brand hover:bg-brand/90 text-white"
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
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Leave History</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your past leave records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">

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
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No leave history found.
                  </TableCell>
                </TableRow>
              )}

              {leaveHistory.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted" onClick={() => openDetails(item)}>
                  <TableCell className="text-foreground">{item.period}</TableCell>
                  <TableCell className="text-muted-foreground">{item.type}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.startDate} - {item.endDate}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-muted text-foreground">
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              Leave Request Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete information about this leave request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Request ID</span>
                <span className="text-sm text-foreground">{selectedRequest.id}</span>
              </div>

              {isAdmin && "staffName" in selectedRequest && (
                <div className="p-3 bg-brand-subtle dark:bg-muted rounded-lg border border-brand">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-brand" />
                    <span className="text-sm text-muted-foreground">Staff Member</span>
                  </div>
                  <p className="text-foreground">{selectedRequest.staffName}</p>
                  <p className="text-xs text-muted-foreground">{selectedRequest.staffId}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Leave Type</Label>
                  <p className="text-foreground mt-1">{selectedRequest.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Duration</Label>
                  <p className="text-foreground mt-1">
                    {selectedRequest.days} {selectedRequest.days === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <p className="text-foreground mt-1">{selectedRequest.startDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <p className="text-foreground mt-1">{selectedRequest.endDate}</p>
                </div>
              </div>

              {"submittedDate" in selectedRequest && selectedRequest.submittedDate && (
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted On</Label>
                  <p className="text-foreground mt-1">{selectedRequest.submittedDate}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Reason / Note</Label>
                <p className="text-sm text-foreground mt-2 p-3 bg-muted rounded-lg">
                  {selectedRequest.reason}
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Current Status</Label>
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
                <div className="p-3 bg-[#fff9e6] rounded-lg border border-brand-yellow">
                  <Label className="text-xs text-muted-foreground">Approver</Label>
                  <p className="text-sm text-foreground mt-1">{selectedRequest.approverName}</p>
                </div>
              )}

              {selectedRequest.hrComment && (
                <div
                  className={`p-3 rounded-lg border ${
                    selectedRequest.status.toLowerCase() === "approved"
                      ? "bg-brand-subtle dark:bg-muted border-brand"
                      : "bg-[#fef2f2] dark:bg-red-950/30 border-[#ef4444]"
                  }`}
                >
                  <Label className="text-xs text-muted-foreground">HR Comment</Label>
                  <p className="text-sm text-foreground mt-1">{selectedRequest.hrComment}</p>
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
                      className="flex-1 bg-brand hover:bg-brand/90 text-white"
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
