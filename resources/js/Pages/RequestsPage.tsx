import MainLayout from "@/layouts/MainLayout";
import { router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  Receipt,
  Download,
  Paperclip,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface RequestItem {
  id: string;
  type: "invoice" | "funds" | "equipment";
  title: string;
  description: string;
  amount?: number | null;
  project: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  receipts: string[];
  comments: Comment[];
  taggedPerson?: string | null;
  requesterName?: string;
  requesterEmployeeId?: string;
  reviewerName?: string | null;
}

interface RequestsPageProps {
  userRole: string;
  requests: RequestItem[];
  projectOptions: string[];
  taggedPeople: string[];
  currentUserName: string;
  currentUserEmployeeId?: string | null;
}

type RequestFormData = {
  type: RequestItem["type"];
  title: string;
  description: string;
  amount: string;
  project: string;
  taggedPerson: string;
};

export default function RequestsPage({
  userRole,
  requests,
  projectOptions,
  taggedPeople,
}: RequestsPageProps) {
  const { flash } = usePage<{
    flash?: {
      success?: string;
      error?: string;
    };
  }>().props;

  const isAdmin = ["superadmin", "hr", "management"].includes(userRole);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const {
    data,
    setData,
    post,
    processing,
    errors,
    reset,
    clearErrors,
  } = useForm<RequestFormData>({
    type: "invoice",
    title: "",
    description: "",
    amount: "",
    project: "",
    taggedPerson: "",
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
    if (!selectedRequest) {
      return;
    }

    const next = requests.find((request) => request.id === selectedRequest.id) ?? null;
    setSelectedRequest(next);
    if (!next) {
      setIsDetailDialogOpen(false);
    }
  }, [requests, selectedRequest]);

  const resetCreateDialog = () => {
    reset();
    clearErrors();
  };

  const handleCreateRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    post("/requests", {
      preserveScroll: true,
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetCreateDialog();
      },
    });
  };

  const handleAddComment = () => {
    if (!selectedRequest || !newComment.trim()) {
      return;
    }

    router.post(
      `/requests/${selectedRequest.id}/comments`,
      { content: newComment.trim() },
      {
        preserveScroll: true,
        onSuccess: () => {
          setNewComment("");
        },
      }
    );
  };

  const handleStatusUpdate = (
    status: "approved" | "declined",
    requestId?: string
  ) => {
    const id = requestId ?? selectedRequest?.id;
    if (!id) {
      return;
    }

    router.patch(
      `/requests/${id}/status`,
      {
        status,
        comment: reviewComment.trim(),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setReviewComment("");
        },
      }
    );
  };

  const getStatusColor = (status: RequestItem["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status: RequestItem["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "declined":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: RequestItem["type"]) => {
    switch (type) {
      case "funds":
        return <DollarSign className="w-5 h-5" />;
      case "equipment":
        return <Package className="w-5 h-5" />;
      default:
        return <Receipt className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: RequestItem["type"]) => {
    switch (type) {
      case "funds":
        return "bg-blue-100 text-blue-800";
      case "equipment":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const approvedRequests = requests.filter((request) => request.status === "approved");
  const declinedRequests = requests.filter((request) => request.status === "declined");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1F2937] mb-2">Requests</h1>
          <p className="text-[#6b7280]">
            Submit and track invoices, funds, and equipment requests
          </p>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              resetCreateDialog();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-[#1F6E4A] text-white hover:bg-[#1F6E4A]/90">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Request</DialogTitle>
              <DialogDescription>
                Submit a request for invoices, funds, or equipment
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="space-y-2">
                <Label>Request Type</Label>
                <Select value={data.type} onValueChange={(value: RequestItem["type"]) => setData("type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice Payment</SelectItem>
                    <SelectItem value="funds">Funds Request</SelectItem>
                    <SelectItem value="equipment">Equipment Purchase</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-red-600">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={data.title}
                  onChange={(event) => setData("title", event.target.value)}
                  placeholder="Brief title of your request"
                />
                {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={data.description}
                  onChange={(event) => setData("description", event.target.value)}
                  placeholder="Provide details about your request"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    value={data.amount}
                    onChange={(event) => setData("amount", event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                  />
                  {errors.amount && <p className="text-xs text-red-600">{errors.amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Related Project</Label>
                  <Input
                    value={data.project}
                    onChange={(event) => setData("project", event.target.value)}
                    placeholder={projectOptions[0] ?? "Enter project name"}
                  />
                  {projectOptions.length > 0 && (
                    <p className="text-xs text-[#6b7280]">
                      Existing projects: {projectOptions.slice(0, 3).join(", ")}
                    </p>
                  )}
                  {errors.project && <p className="text-xs text-red-600">{errors.project}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Person Involved</Label>
                <Select
                  value={data.taggedPerson || "none"}
                  onValueChange={(value) => setData("taggedPerson", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tag a person related to this request" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No tagged person</SelectItem>
                    {taggedPeople.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#6b7280]">
                  Attachments and receipts are tracked on the request after approval.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="bg-[#1F6E4A] text-white hover:bg-[#1F6E4A]/90"
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6b7280] mb-1">Pending</p>
                <p className="text-2xl text-[#1F2937]">{pendingRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6b7280] mb-1">Approved</p>
                <p className="text-2xl text-[#1F2937]">{approvedRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6b7280] mb-1">Declined</p>
                <p className="text-2xl text-[#1F2937]">{declinedRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#1F2937]">All Requests</CardTitle>
          <CardDescription>
            {isAdmin ? "Review team requests and update their status" : "Track the status of your submitted requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#d1d5db] p-8 text-center text-sm text-[#6b7280]">
                No requests have been submitted yet.
              </div>
            )}

            {requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedRequest(request);
                    setIsDetailDialogOpen(true);
                    setReviewComment("");
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(request.type)}`}>
                          {getTypeIcon(request.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-[#1F2937]">{request.title}</h3>
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusIcon(request.status)}
                              <span className="ml-1 capitalize">{request.status}</span>
                            </Badge>
                            <Badge className={getTypeColor(request.type)}>
                              <span className="capitalize">{request.type}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-[#6b7280] mb-3">{request.description}</p>
                          <div className="flex items-center gap-6 text-sm flex-wrap">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-[#6b7280]" />
                              <span className="text-[#1F2937]">
                                {request.amount ? `$${request.amount.toLocaleString()}` : "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#6b7280]" />
                              <span className="text-[#6b7280]">{request.project}</span>
                            </div>
                            {isAdmin && request.requesterName && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-[#6b7280]" />
                                <span className="text-[#6b7280]">
                                  {request.requesterName}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-[#6b7280]" />
                              <span className="text-[#6b7280]">
                                {request.attachments.length} attachment{request.attachments.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {request.receipts.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-[#6b7280]" />
                                <span className="text-[#6b7280]">
                                  {request.receipts.length} receipt{request.receipts.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isAdmin && request.status === "pending" && (
                        <div
                          className="flex gap-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
                            onClick={() => {
                              handleStatusUpdate("approved", request.id);
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              handleStatusUpdate("declined", request.id);
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedRequest.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 flex-wrap pt-1">
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-1 capitalize">{selectedRequest.status}</span>
                  </Badge>
                  <Badge className={getTypeColor(selectedRequest.type)}>
                    <span className="capitalize">{selectedRequest.type}</span>
                  </Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm mb-2 text-[#1F2937]">Description</h4>
                  <p className="text-sm text-[#6b7280]">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm mb-2 text-[#1F2937]">Amount</h4>
                    <p className="text-sm text-[#6b7280]">
                      {selectedRequest.amount
                        ? `$${selectedRequest.amount.toLocaleString()}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm mb-2 text-[#1F2937]">Project</h4>
                    <p className="text-sm text-[#6b7280]">{selectedRequest.project}</p>
                  </div>
                </div>

                {isAdmin && selectedRequest.requesterName && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm mb-2 text-[#1F2937]">Requester</h4>
                      <p className="text-sm text-[#6b7280]">{selectedRequest.requesterName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm mb-2 text-[#1F2937]">Employee ID</h4>
                      <p className="text-sm text-[#6b7280]">{selectedRequest.requesterEmployeeId || "-"}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.taggedPerson && (
                  <div>
                    <h4 className="text-sm mb-2 text-[#1F2937]">Person Involved</h4>
                    <div className="flex items-center gap-2 p-3 bg-[#1F6E4A]/5 border border-[#1F6E4A]/20 rounded-lg">
                      <User className="w-4 h-4 text-[#1F6E4A]" />
                      <span className="text-sm text-[#1F2937]">{selectedRequest.taggedPerson}</span>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm mb-2 text-[#1F2937]">Activity</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-[#6b7280]">
                    <p>Created: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                    <p>Updated: {new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                  </div>
                  {selectedRequest.reviewerName && (
                    <p className="text-sm text-[#6b7280] mt-2">
                      Reviewed by: {selectedRequest.reviewerName}
                    </p>
                  )}
                </div>

                {selectedRequest.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm mb-2 text-[#1F2937]">Attachments</h4>
                    <div className="space-y-2">
                      {selectedRequest.attachments.map((file) => (
                        <div
                          key={file}
                          className="flex items-center justify-between p-3 bg-[#F5F7F8] rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-[#6b7280]" />
                            <span className="text-sm text-[#1F2937]">{file}</span>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.receipts.length > 0 && (
                  <div>
                    <h4 className="text-sm mb-2 text-[#1F2937]">Receipts</h4>
                    <div className="space-y-2">
                      {selectedRequest.receipts.map((file) => (
                        <div
                          key={file}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-[#1F2937]">{file}</span>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.status === "approved" && (
                  <div className="rounded-lg border border-dashed border-[#d1d5db] p-4 text-sm text-[#6b7280]">
                    Receipt uploads are not enabled in this workflow yet. Approved requests are stored and can still be commented on.
                  </div>
                )}

                <div>
                  <h4 className="text-sm mb-3 text-[#1F2937]">Comments</h4>
                  <div className="space-y-3 mb-4">
                    {selectedRequest.comments.length === 0 ? (
                      <p className="text-sm text-[#6b7280] text-center py-4">No comments yet</p>
                    ) : (
                      selectedRequest.comments.map((comment) => (
                        <div key={comment.id} className="bg-[#F5F7F8] p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#1F2937]">{comment.author}</span>
                            <span className="text-xs text-[#6b7280]">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-[#6b7280]">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      rows={2}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-[#1F6E4A] text-white hover:bg-[#1F6E4A]/90"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {isAdmin && selectedRequest.status === "pending" && (
                  <div className="space-y-3 border-t pt-4">
                    <Label>Review Comment</Label>
                    <Textarea
                      placeholder="Optional note for the requester"
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
                        onClick={() => handleStatusUpdate("approved")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        className="flex-1"
                        variant="destructive"
                        onClick={() => handleStatusUpdate("declined")}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

RequestsPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
