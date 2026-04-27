import { Head, router } from "@inertiajs/react";
import { Calendar, ChevronLeft, Play, Square, Star, AlertCircle } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/layouts/MainLayout";
import type { ReviewCycle, PerformanceReview, PipPlan, ReviewCycleType, ReviewType, ReviewStatus } from "@/types/performance";

interface Props {
    cycle:     ReviewCycle;
    reviews:   PerformanceReview[];
    pips:      PipPlan[];
    canManage: boolean;
    authId:    number;
}

const TYPE_LABELS: Record<ReviewCycleType, string> = {
    annual:    "Annual",
    quarterly: "Quarterly",
    mid_year:  "Mid-Year",
    probation: "Probation",
};

const REVIEW_TYPE_CLASSES: Record<ReviewType, string> = {
    self:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    peer:    "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

const STATUS_CLASSES: Record<ReviewStatus, string> = {
    pending:      "bg-muted text-muted-foreground",
    in_progress:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    submitted:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    acknowledged: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const PIP_STATUS_CLASSES: Record<string, string> = {
    draft:     "bg-muted text-muted-foreground",
    active:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    failed:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const CYCLE_STATUS_CLASSES: Record<string, string> = {
    draft:  "bg-muted text-muted-foreground",
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    closed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function ReviewCyclePage({ cycle, reviews, pips, canManage, authId }: Props) {
    const [activating, setActivating] = useState(false);
    const [closing, setClosing] = useState(false);

    function handleActivate() {
        if (!confirm("Activate this cycle? This will generate review records for all active employees.")) return;
        setActivating(true);
        router.post(
            route("performance.cycles.activate", cycle.id),
            {},
            { onFinish: () => setActivating(false) },
        );
    }

    function handleClose() {
        if (!confirm("Close this cycle? No new reviews can be submitted after closing.")) return;
        setClosing(true);
        router.post(
            route("performance.cycles.close", cycle.id),
            {},
            { onFinish: () => setClosing(false) },
        );
    }

    const myReviews = reviews.filter(
        (r) => r.reviewee.id === authId || r.reviewer?.id === authId,
    );
    const pendingForMe = myReviews.filter(
        (r) => (r.reviewer?.id === authId || (r.type === "self" && r.reviewee.id === authId))
            && ["pending", "in_progress"].includes(r.status),
    );

    return (
        <>
            <Head title={cycle.name} />
            <div className="space-y-6">
                {/* Back + header */}
                <div className="flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="self-start -ml-2 text-muted-foreground"
                        onClick={() => router.visit(route("performance.cycles.index"))}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        All Cycles
                    </Button>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-foreground">{cycle.name}</h1>
                                <Badge
                                    className={`text-xs capitalize ${CYCLE_STATUS_CLASSES[cycle.status]}`}
                                    variant="outline"
                                >
                                    {cycle.status}
                                </Badge>
                                <Badge
                                    className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                    variant="outline"
                                >
                                    {TYPE_LABELS[cycle.type]}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {cycle.period_start} — {cycle.period_end}
                            </p>
                            {cycle.description && (
                                <p className="text-sm text-muted-foreground max-w-2xl">{cycle.description}</p>
                            )}
                        </div>

                        {canManage && (
                            <div className="flex gap-2 shrink-0">
                                {cycle.status === "draft" && (
                                    <Button
                                        onClick={handleActivate}
                                        disabled={activating}
                                        className="bg-brand hover:bg-brand/90 text-white"
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        {activating ? "Activating…" : "Activate"}
                                    </Button>
                                )}
                                {cycle.status === "active" && (
                                    <Button
                                        onClick={handleClose}
                                        disabled={closing}
                                        variant="outline"
                                    >
                                        <Square className="w-4 h-4 mr-2" />
                                        {closing ? "Closing…" : "Close Cycle"}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending action banner for current user */}
                {pendingForMe.length > 0 && (
                    <Card className="border-brand bg-brand/5">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-brand shrink-0" />
                            <p className="text-sm text-foreground">
                                You have <strong>{pendingForMe.length}</strong> review{pendingForMe.length !== 1 ? "s" : ""} pending
                                your response.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="reviews">
                    <TabsList>
                        <TabsTrigger value="reviews">
                            Reviews ({reviews.length})
                        </TabsTrigger>
                        <TabsTrigger value="pips">
                            PIPs ({pips.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Reviews tab */}
                    <TabsContent value="reviews" className="mt-4">
                        <Card className="bg-card shadow-sm">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Reviewer</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Rating</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reviews.length === 0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={6}
                                                        className="text-center text-muted-foreground py-10"
                                                    >
                                                        No reviews yet. Activate the cycle to generate them.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {reviews.map((review) => {
                                                const isMine =
                                                    review.reviewee.id === authId ||
                                                    review.reviewer?.id === authId;
                                                return (
                                                    <TableRow
                                                        key={review.id}
                                                        className={isMine ? "bg-brand/5" : undefined}
                                                    >
                                                        <TableCell>
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground">
                                                                    {review.reviewee.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {review.reviewee.employee_id}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {review.reviewer?.name ?? (
                                                                <span className="italic">Self</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={`text-xs capitalize ${REVIEW_TYPE_CLASSES[review.type]}`}
                                                                variant="outline"
                                                            >
                                                                {review.type}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                className={`text-xs capitalize ${STATUS_CLASSES[review.status]}`}
                                                                variant="outline"
                                                            >
                                                                {review.status.replace("_", " ")}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {review.overall_rating ? (
                                                                <span className="flex items-center gap-0.5 text-sm text-foreground">
                                                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                                    {review.overall_rating}/5
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant={isMine && ["pending", "in_progress"].includes(review.status) ? "default" : "ghost"}
                                                                size="sm"
                                                                className={
                                                                    isMine && ["pending", "in_progress"].includes(review.status)
                                                                        ? "bg-brand hover:bg-brand/90 text-white"
                                                                        : undefined
                                                                }
                                                                onClick={() =>
                                                                    router.visit(
                                                                        route("performance.reviews.show", review.id),
                                                                    )
                                                                }
                                                            >
                                                                {isMine && review.status === "pending"
                                                                    ? "Start"
                                                                    : isMine && review.status === "in_progress"
                                                                    ? "Continue"
                                                                    : "View"}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PIPs tab */}
                    <TabsContent value="pips" className="mt-4">
                        <Card className="bg-card shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-base">Performance Improvement Plans</CardTitle>
                                {(canManage) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit(route("performance.pips.index"))}
                                    >
                                        Manage PIPs
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Period</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pips.length === 0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={5}
                                                        className="text-center text-muted-foreground py-10"
                                                    >
                                                        No PIPs linked to this cycle.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {pips.map((pip) => (
                                                <TableRow key={pip.id}>
                                                    <TableCell>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {pip.user.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {pip.user.employee_id}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-foreground">
                                                        {pip.title}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                        {pip.start_date} — {pip.end_date}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={`text-xs capitalize ${PIP_STATUS_CLASSES[pip.status]}`}
                                                            variant="outline"
                                                        >
                                                            {pip.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.visit(
                                                                    route("performance.pips.show", pip.id),
                                                                )
                                                            }
                                                        >
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
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

ReviewCyclePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
