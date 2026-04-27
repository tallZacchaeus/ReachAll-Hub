import { Head } from "@inertiajs/react";
import { useForm } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import { ArrowLeft, Send, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type { FeedbackType } from "@/types/feedback";

interface Competency {
    id:   number;
    name: string;
    slug: string;
}

interface FeedbackRequestSummary {
    id:      number;
    subject: { id: number; name: string; employee_id: string } | null;
    type:    FeedbackType;
    message: string | null;
}

interface Props {
    feedbackRequest: FeedbackRequestSummary;
    competencies:    Competency[];
}

type ResponseForm = {
    ratings:        Record<string, number>;
    overall_rating: string;
    strengths:      string;
    improvements:   string;
    is_anonymous:   boolean;
};

function StarRatingInput({
    value,
    onChange,
    label,
}: {
    value: number;
    onChange: (v: number) => void;
    label: string;
}) {
    const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm">{label}</Label>
                {value > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {value} — {labels[value]}
                    </span>
                )}
            </div>
            <div className="flex gap-1" role="group" aria-label={`Rating for ${label}`}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        className={`text-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded ${
                            n <= value ? "text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300"
                        }`}
                        onClick={() => onChange(n)}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function FeedbackResponsePage({ feedbackRequest, competencies }: Props) {
    const initialRatings: Record<string, number> = {};
    competencies.forEach((c) => { initialRatings[c.slug] = 0; });

    const { data, setData, post, processing, errors } = useForm<ResponseForm>({
        ratings:        initialRatings,
        overall_rating: "",
        strengths:      "",
        improvements:   "",
        is_anonymous:   false,
    });

    function setRating(slug: string, value: number) {
        setData("ratings", { ...data.ratings, [slug]: value });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route("feedback.requests.respond", feedbackRequest.id));
    }

    const TYPE_LABELS: Record<FeedbackType, string> = {
        "360":    "360°",
        peer:     "Peer",
        upward:   "Upward",
        downward: "Downward",
    };

    return (
        <>
            <Head title={`Respond to Feedback — ${feedbackRequest.subject?.name ?? ""}`} />
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-1 mb-2"
                        onClick={() => router.visit(route("feedback.requests.index"))}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>
                    <h1 className="text-foreground">Submit Feedback</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        About:{" "}
                        <strong className="text-foreground">{feedbackRequest.subject?.name ?? "—"}</strong>
                        {" "}
                        <Badge variant="outline" className="ml-1 text-xs">
                            {TYPE_LABELS[feedbackRequest.type]}
                        </Badge>
                    </p>
                </div>

                {feedbackRequest.message && (
                    <Card className="shadow-sm bg-muted/40">
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">Context from requester</p>
                            <p className="text-sm">{feedbackRequest.message}</p>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Competency ratings */}
                    {competencies.length > 0 && (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">Competency Ratings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {competencies.map((comp) => (
                                    <StarRatingInput
                                        key={comp.slug}
                                        label={comp.name}
                                        value={data.ratings[comp.slug] ?? 0}
                                        onChange={(v) => setRating(comp.slug, v)}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Overall rating */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Overall Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StarRatingInput
                                label="Overall performance"
                                value={data.overall_rating ? parseInt(data.overall_rating, 10) : 0}
                                onChange={(v) => setData("overall_rating", String(v))}
                            />
                            {errors.overall_rating && (
                                <p className="text-sm text-destructive mt-1">{errors.overall_rating}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Strengths */}
                    <div className="space-y-1.5">
                        <Label htmlFor="strengths">Key Strengths</Label>
                        <Textarea
                            id="strengths"
                            rows={3}
                            placeholder="What does this person do particularly well?"
                            value={data.strengths}
                            onChange={(e) => setData("strengths", e.target.value)}
                        />
                        {errors.strengths && (
                            <p className="text-sm text-destructive">{errors.strengths}</p>
                        )}
                    </div>

                    {/* Improvements */}
                    <div className="space-y-1.5">
                        <Label htmlFor="improvements">Areas for Improvement</Label>
                        <Textarea
                            id="improvements"
                            rows={3}
                            placeholder="What could this person improve or develop?"
                            value={data.improvements}
                            onChange={(e) => setData("improvements", e.target.value)}
                        />
                        {errors.improvements && (
                            <p className="text-sm text-destructive">{errors.improvements}</p>
                        )}
                    </div>

                    {/* Anonymous toggle */}
                    <Card className="shadow-sm bg-muted/40">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="is_anonymous"
                                    checked={data.is_anonymous}
                                    onCheckedChange={(v) => setData("is_anonymous", Boolean(v))}
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="is_anonymous" className="flex items-center gap-1.5 cursor-pointer">
                                        <Lock className="w-3.5 h-3.5" />
                                        Submit anonymously
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        When checked, your identity will not be visible to anyone — including HR.
                                        Only aggregated results will be shared with the subject.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={processing} className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        {processing ? "Submitting…" : "Submit Feedback"}
                    </Button>
                </form>
            </div>
        </>
    );
}

FeedbackResponsePage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
