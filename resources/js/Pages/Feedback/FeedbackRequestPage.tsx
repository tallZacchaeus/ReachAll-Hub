import { Head, router } from "@inertiajs/react";
import { ArrowLeft, BarChart2, MessageSquare, User, Calendar } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from "@/layouts/MainLayout";
import type { FeedbackResponse, AggregatedFeedback, FeedbackType, FeedbackStatus } from "@/types/feedback";

interface FeedbackRequestDetail {
    id:           number;
    subject:      { id: number; name: string; employee_id: string } | null;
    requester:    { id: number; name: string } | null;
    review_cycle: { id: number; name: string } | null;
    type:         FeedbackType;
    message:      string | null;
    due_date:     string | null;
    status:       FeedbackStatus;
}

interface Props {
    feedbackRequest: FeedbackRequestDetail;
    responses:       FeedbackResponse[];
    aggregated:      AggregatedFeedback;
    canManage:       boolean;
    isSubject:       boolean;
}

const TYPE_LABELS: Record<FeedbackType, string> = {
    "360":    "360°",
    peer:     "Peer",
    upward:   "Upward",
    downward: "Downward",
};

const STATUS_CLASSES: Record<FeedbackStatus, string> = {
    pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function StarRating({ value }: { value: number }) {
    return (
        <div className="flex gap-0.5" aria-label={`Rating: ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span
                    key={n}
                    className={n <= value ? "text-yellow-400" : "text-muted-foreground/30"}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

export default function FeedbackRequestPage({
    feedbackRequest,
    responses,
    aggregated,
    canManage,
    isSubject,
}: Props) {
    const chartData = Object.entries(aggregated.competency_averages).map(([slug, avg]) => ({
        name:  slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: avg,
    }));

    const canRespond =
        !isSubject &&
        feedbackRequest.status === "pending" &&
        !responses.some((r) => r.submitted_at !== null && r.respondent !== null);

    return (
        <>
            <Head title={`Feedback — ${feedbackRequest.subject?.name ?? "Unknown"}`} />
            <div className="space-y-6">
                {/* Back + Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mb-2 -ml-1"
                            onClick={() => router.visit(route("feedback.requests.index"))}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back
                        </Button>
                        <h1 className="text-foreground">
                            Feedback: {feedbackRequest.subject?.name ?? "—"}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {feedbackRequest.subject?.employee_id}
                            {feedbackRequest.review_cycle
                                ? ` · Cycle: ${feedbackRequest.review_cycle.name}`
                                : ""}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className={STATUS_CLASSES[feedbackRequest.status]}>
                            {feedbackRequest.status}
                        </Badge>
                        <Badge variant="outline">{TYPE_LABELS[feedbackRequest.type]}</Badge>
                        {canRespond && (
                            <Button onClick={() => router.visit(route("feedback.requests.show", feedbackRequest.id) + "#respond")}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Respond
                            </Button>
                        )}
                    </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                            <User className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">Requested by</p>
                                <p className="text-sm font-medium">{feedbackRequest.requester?.name ?? "—"}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">Due date</p>
                                <p className="text-sm font-medium">{feedbackRequest.due_date ?? "No deadline"}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex items-start gap-3">
                            <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">Responses</p>
                                <p className="text-sm font-medium">{aggregated.response_count}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {feedbackRequest.message && (
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">Context</p>
                            <p className="text-sm">{feedbackRequest.message}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Aggregated chart */}
                {chartData.length > 0 && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart2 className="w-4 h-4" />
                                Competency Averages
                                {aggregated.overall_average !== null && (
                                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                                        Overall avg: <strong>{aggregated.overall_average.toFixed(1)}</strong> / 5
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12 }}
                                        className="fill-muted-foreground"
                                    />
                                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                                    <Tooltip
                                        formatter={(v) => [
                                            typeof v === "number" ? v.toFixed(2) : v,
                                            "Average",
                                        ]}
                                        contentStyle={{ fontSize: 13 }}
                                    />
                                    <Bar dataKey="value" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Individual responses — only shown to HR (non-anonymous) */}
                {canManage && responses.length > 0 && (
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Submitted Responses ({responses.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {responses.map((resp, i) => (
                                <div key={resp.id} className="border border-border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <span className="text-sm font-medium">
                                            {resp.is_anonymous
                                                ? "Anonymous respondent"
                                                : resp.respondent?.name ?? `Respondent #${i + 1}`}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {resp.is_anonymous && (
                                                <Badge variant="outline" className="text-xs">Anonymous</Badge>
                                            )}
                                            {resp.overall_rating && (
                                                <StarRating value={resp.overall_rating} />
                                            )}
                                        </div>
                                    </div>
                                    {resp.ratings && Object.keys(resp.ratings).length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {Object.entries(resp.ratings).map(([slug, val]) => (
                                                <div key={slug} className="bg-muted rounded px-3 py-2 text-sm">
                                                    <span className="text-muted-foreground capitalize">
                                                        {slug.replace(/_/g, " ")}
                                                    </span>
                                                    <span className="ml-2 font-medium">{val}/5</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {resp.strengths && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Strengths</p>
                                            <p className="text-sm">{resp.strengths}</p>
                                        </div>
                                    )}
                                    {resp.improvements && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Areas for improvement</p>
                                            <p className="text-sm">{resp.improvements}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {responses.length === 0 && (
                    <Card className="shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                            <MessageSquare className="w-8 h-8 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No responses submitted yet.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

FeedbackRequestPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
