import { Head, router } from "@inertiajs/react";
import { MessageSquare, Clock, BarChart2 } from "lucide-react";
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
import type { FeedbackStatus, FeedbackType, AggregatedFeedback } from "@/types/feedback";

interface MyRequest {
    id:              number;
    requester:       { id: number; name: string } | null;
    review_cycle:    { id: number; name: string } | null;
    type:            FeedbackType;
    status:          FeedbackStatus;
    due_date:        string | null;
    responses_count: number;
    aggregated:      AggregatedFeedback | null;
}

interface PendingRespond {
    id:       number;
    subject:  { id: number; name: string; employee_id: string } | null;
    type:     FeedbackType;
    due_date: string | null;
    message:  string | null;
}

interface Competency {
    id:   number;
    name: string;
    slug: string;
}

interface Props {
    myRequests:      MyRequest[];
    pendingRespond:  PendingRespond[];
    competencies:    Competency[];
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

function CompetencyChart({ aggregated }: { aggregated: AggregatedFeedback }) {
    const data = Object.entries(aggregated.competency_averages).map(([slug, avg]) => ({
        name:  slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: avg,
    }));

    if (data.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                    formatter={(v) => [
                        typeof v === "number" ? v.toFixed(2) : v,
                        "Average",
                    ]}
                    contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="value" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default function MyFeedbackPage({ myRequests, pendingRespond, competencies }: Props) {
    const completedRequests = myRequests.filter((r) => r.aggregated !== null);
    const pendingRequests = myRequests.filter((r) => r.status === "pending");

    return (
        <>
            <Head title="My Feedback" />
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-foreground">My Feedback</h1>
                    <p className="text-muted-foreground mt-1">
                        View feedback received about you and respond to pending requests
                    </p>
                </div>

                {/* Pending requests for me to respond to */}
                {pendingRespond.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Awaiting Your Response ({pendingRespond.length})
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {pendingRespond.map((req) => (
                                <Card key={req.id} className="shadow-sm border-yellow-200 dark:border-yellow-800/50">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                            <div>
                                                <p className="font-medium text-sm">{req.subject?.name ?? "—"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {req.subject?.employee_id}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-xs shrink-0">
                                                {TYPE_LABELS[req.type]}
                                            </Badge>
                                        </div>
                                        {req.message && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {req.message}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            {req.due_date && (
                                                <p className="text-xs text-muted-foreground">
                                                    Due: {req.due_date}
                                                </p>
                                            )}
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    router.visit(route("feedback.requests.show", req.id))
                                                }
                                                className="ml-auto"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                                Respond Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Feedback received about me — pending */}
                {pendingRequests.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">Pending Feedback About Me</h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {pendingRequests.map((req) => (
                                <Card key={req.id} className="shadow-sm">
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <Badge variant="outline" className="text-xs">
                                                {TYPE_LABELS[req.type]}
                                            </Badge>
                                            <Badge className={STATUS_CLASSES[req.status]}>
                                                {req.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {req.responses_count} response{req.responses_count !== 1 ? "s" : ""} so far
                                        </div>
                                        {req.due_date && (
                                            <p className="text-xs text-muted-foreground">
                                                Due: {req.due_date}
                                            </p>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full"
                                            onClick={() =>
                                                router.visit(route("feedback.requests.show", req.id))
                                            }
                                        >
                                            View Details
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Completed feedback with aggregated results */}
                {completedRequests.length > 0 ? (
                    <section className="space-y-4">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <BarChart2 className="w-4 h-4" />
                            Feedback Results
                        </h2>
                        {completedRequests.map((req) => (
                            <Card key={req.id} className="shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center justify-between flex-wrap gap-2 text-sm">
                                        <span className="font-medium">
                                            {req.review_cycle?.name ?? TYPE_LABELS[req.type]}
                                            {" "}
                                            <span className="text-muted-foreground font-normal text-xs">
                                                ({req.aggregated?.response_count ?? 0} responses)
                                            </span>
                                        </span>
                                        {req.aggregated?.overall_average !== null && req.aggregated?.overall_average !== undefined && (
                                            <span className="text-sm text-muted-foreground">
                                                Overall avg:{" "}
                                                <strong className="text-foreground">
                                                    {req.aggregated.overall_average.toFixed(1)}
                                                </strong>{" "}
                                                / 5
                                            </span>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {req.aggregated && (
                                        <CompetencyChart aggregated={req.aggregated} />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </section>
                ) : (
                    myRequests.length === 0 && pendingRespond.length === 0 && (
                        <Card className="shadow-sm">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No feedback activity yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Feedback requests about you and requests for you to respond to will appear here.
                                </p>
                            </CardContent>
                        </Card>
                    )
                )}
            </div>
        </>
    );
}

MyFeedbackPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
