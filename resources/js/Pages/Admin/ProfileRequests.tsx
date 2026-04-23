import MainLayout from "@/layouts/MainLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, User as UserIcon, Calendar, ArrowRight, AlertCircle, Phone, MapPin, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useForm, usePage } from "@inertiajs/react";

interface User {
    id: number;
    name: string;
    email: string;
    employee_id: string;
    department: string | null;
}

interface ProfileChangeRequest {
    id: number;
    user_id: number;
    user: User;
    changes: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        department?: string;
    };
    status: string;
    created_at: string;
}

interface ProfileRequestsProps {
    requests: ProfileChangeRequest[];
}

export default function ProfileRequests({ requests: initialRequests }: ProfileRequestsProps) {
    const [selectedRequest, setSelectedRequest] = useState<ProfileChangeRequest | null>(null);
    const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
    const { flash } = usePage().props as any;

    const { data, setData, post, processing, reset } = useForm({
        review_notes: "",
    });

    const handleAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest || !actionType) return;

        const routeName = actionType === "approve"
            ? "admin.profile-requests.approve"
            : "admin.profile-requests.reject";

        post((window as any).route(routeName, selectedRequest.id), {
            onSuccess: () => {
                setSelectedRequest(null);
                setActionType(null);
                reset();
            },
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-foreground mb-2">Profile Change Requests</h1>
                    <p className="text-muted-foreground">Approve or reject staff profile updates</p>
                </div>

                {initialRequests.length > 0 && (
                    <Badge className="bg-brand text-white">
                        {initialRequests.length} Pending
                    </Badge>
                )}
            </div>

            {flash.success && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 flex items-center gap-2 text-green-700">
                        <Check className="w-5 h-5" />
                        <p className="text-sm font-medium">{flash.success}</p>
                    </CardContent>
                </Card>
            )}

            {initialRequests.length === 0 ? (
                <Card className="bg-card shadow-sm border-2 border-dashed border-border py-12">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <UserIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-foreground mb-1">No pending requests</h3>
                        <p className="text-muted-foreground">All profile updates have been processed.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {initialRequests.map((request) => (
                            <motion.div
                                key={request.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="bg-card shadow-sm border-2 border-border hover:shadow-md transition-all">
                                    <CardHeader className="p-6 border-b border-border">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="w-12 h-12">
                                                <AvatarFallback className="bg-brand text-white">
                                                    {request.user.name.charAt(0)}{request.user.name.split(" ")[1]?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <CardTitle className="text-foreground text-lg">{request.user.name}</CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                                        {request.user.employee_id}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        Requested {new Date(request.created_at).toLocaleDateString()}
                                                    </span>
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proposed Changes</h4>
                                        <div className="space-y-2">
                                            {Object.entries(request.changes).map(([key, value]) => (
                                                <div key={key} className="flex items-center justify-between p-2 bg-muted rounded-lg border border-border">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded bg-card flex items-center justify-center text-muted-foreground">
                                                            {key === 'email' && <Mail className="w-3 h-3" />}
                                                            {key === 'phone' && <Phone className="w-3 h-3" />}
                                                            {key === 'location' && <MapPin className="w-3 h-3" />}
                                                            {key === 'department' && <UserIcon className="w-3 h-3" />}
                                                            {key === 'name' && <UserIcon className="w-3 h-3" />}
                                                        </div>
                                                        <span className="text-xs font-medium capitalize text-foreground">{key}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-brand font-medium truncate max-w-[150px]">{String(value)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setActionType("reject");
                                                }}
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button
                                                className="flex-1 bg-brand hover:bg-brand/90 text-white"
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setActionType("approve");
                                                }}
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Approve
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Action Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            {actionType === "approve" ? "Approve Profile Update" : "Reject Profile Update"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === "approve"
                                ? `Confirm approval for ${selectedRequest?.user.name}'s profile updates.`
                                : `Enter a reason for rejecting the profile update for ${selectedRequest?.user.name}.`}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAction} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="review_notes">Review Notes (Optional)</Label>
                            <Textarea
                                id="review_notes"
                                placeholder={actionType === "reject" ? "Enter rejection reason..." : "Enter notes for the staff member..."}
                                value={data.review_notes}
                                onChange={(e) => setData("review_notes", e.target.value)}
                                className="bg-card min-h-[100px]"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setSelectedRequest(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className={actionType === "approve" ? "bg-brand hover:bg-brand/90 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                            >
                                {processing
                                    ? "Processing..."
                                    : (actionType === "approve" ? "Confirm Approval" : "Confirm Rejection")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

ProfileRequests.layout = (page: React.ReactNode) => <MainLayout children={page} />;
