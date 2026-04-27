import { Head, router, useForm } from "@inertiajs/react";
import { ChevronLeft, Star, CheckCircle, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import type { PerformanceReview, ReviewCompetency, ReviewType, ReviewStatus } from "@/types/performance";

interface Props {
    review:       PerformanceReview;
    competencies: ReviewCompetency[];
    canEdit:      boolean;
    canManage:    boolean;
    authId:       number;
}

const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
    self:    "Self Review",
    manager: "Manager Review",
    peer:    "Peer Review",
};

const STATUS_CLASSES: Record<ReviewStatus, string> = {
    pending:      "bg-muted text-muted-foreground",
    in_progress:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    submitted:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    acknowledged: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

interface FormData {
    ratings:         Record<string, number>;
    overall_rating:  number | "";
    strengths:       string;
    improvements:    string;
    comments:        string;
}

function StarRating({
    value,
    onChange,
    readOnly = false,
}: {
    value: number;
    onChange?: (v: number) => void;
    readOnly?: boolean;
}) {
    return (
        <div className="flex gap-1" role="group" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={readOnly}
                    onClick={() => !readOnly && onChange?.(n)}
                    className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded transition-transform ${!readOnly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
                    aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                    aria-pressed={value >= n}
                >
                    <Star
                        className={`w-6 h-6 transition-colors ${
                            value >= n
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-muted text-muted-foreground/40"
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

const RATING_LABELS: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
};

export default function PerformanceReviewFormPage({
    review,
    competencies,
    canEdit,
    canManage,
    authId,
}: Props) {
    const initialRatings: Record<string, number> = {};
    competencies.forEach((c) => {
        initialRatings[c.slug] = review.ratings?.[c.slug] ?? 0;
    });

    const { data, setData, put, post, processing, errors } = useForm<FormData>({
        ratings:        initialRatings,
        overall_rating: review.overall_rating ?? "",
        strengths:      review.strengths ?? "",
        improvements:   review.improvements ?? "",
        comments:       review.comments ?? "",
    });

    const isReadOnly = !canEdit;
    const isReviewee = review.reviewee.id === authId;
    const canAcknowledge = isReviewee && review.status === "submitted";

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        put(route("performance.reviews.update", review.id));
    }

    function handleSubmit() {
        if (!confirm("Submit this review? You will not be able to edit it after submission.")) return;
        post(route("performance.reviews.submit", review.id));
    }

    function handleAcknowledge() {
        if (!confirm("Acknowledge this review? This confirms you have read the feedback.")) return;
        post(route("performance.reviews.acknowledge", review.id));
    }

    function setRating(slug: string, value: number) {
        setData("ratings", { ...data.ratings, [slug]: value });
    }

    const allCompetenciesRated = competencies.every((c) => (data.ratings[c.slug] ?? 0) > 0);
    const hasOverallRating = data.overall_rating !== "" && Number(data.overall_rating) > 0;

    return (
        <>
            <Head title={`${REVIEW_TYPE_LABELS[review.type]} — ${review.reviewee.name}`} />
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Back */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 text-muted-foreground"
                    onClick={() =>
                        review.review_cycle
                            ? router.visit(route("performance.cycles.show", review.review_cycle_id))
                            : router.visit(route("performance.cycles.index"))
                    }
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                </Button>

                {/* Review header */}
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-semibold text-foreground">
                                        {REVIEW_TYPE_LABELS[review.type]}
                                    </h2>
                                    <Badge
                                        className={`text-xs capitalize ${STATUS_CLASSES[review.status]}`}
                                        variant="outline"
                                    >
                                        {review.status.replace("_", " ")}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Employee:{" "}
                                    <span className="text-foreground font-medium">
                                        {review.reviewee.name}
                                    </span>{" "}
                                    <span className="text-muted-foreground">
                                        ({review.reviewee.employee_id})
                                    </span>
                                </p>
                                {review.reviewer && (
                                    <p className="text-sm text-muted-foreground">
                                        Reviewer:{" "}
                                        <span className="text-foreground">{review.reviewer.name}</span>
                                    </p>
                                )}
                                {review.review_cycle && (
                                    <p className="text-sm text-muted-foreground">
                                        Cycle:{" "}
                                        <span className="text-foreground">{review.review_cycle.name}</span>
                                    </p>
                                )}
                            </div>

                            {review.submitted_at && (
                                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                                    <p>Submitted: {review.submitted_at}</p>
                                    {review.acknowledged_at && (
                                        <p className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Acknowledged: {review.acknowledged_at}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Read-only acknowledgement banner */}
                {canAcknowledge && (
                    <Card className="border-brand bg-brand/5">
                        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-brand shrink-0" />
                                <p className="text-sm text-foreground">
                                    Your manager has submitted this review. Please read it and acknowledge.
                                </p>
                            </div>
                            <Button
                                onClick={handleAcknowledge}
                                disabled={processing}
                                className="bg-brand hover:bg-brand/90 text-white shrink-0"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Acknowledge
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Competency Ratings */}
                    <Card className="bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Competency Ratings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {competencies.map((comp) => {
                                const ratingVal = data.ratings[comp.slug] ?? 0;
                                return (
                                    <div key={comp.slug} className="space-y-1.5">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div>
                                                <Label className="text-foreground font-medium">
                                                    {comp.name}
                                                </Label>
                                                {comp.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {comp.description}
                                                    </p>
                                                )}
                                            </div>
                                            {ratingVal > 0 && (
                                                <span className="text-sm text-muted-foreground">
                                                    {ratingVal}/5 — {RATING_LABELS[ratingVal]}
                                                </span>
                                            )}
                                        </div>
                                        <StarRating
                                            value={ratingVal}
                                            onChange={(v) => setRating(comp.slug, v)}
                                            readOnly={isReadOnly}
                                        />
                                        {errors[`ratings.${comp.slug}` as keyof typeof errors] && (
                                            <p className="text-sm text-destructive">
                                                {errors[`ratings.${comp.slug}` as keyof typeof errors]}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Overall Rating */}
                    <Card className="bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Overall Rating</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <Label className="text-foreground font-medium">Overall Performance</Label>
                                {Number(data.overall_rating) > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        {data.overall_rating}/5 — {RATING_LABELS[Number(data.overall_rating)]}
                                    </span>
                                )}
                            </div>
                            <StarRating
                                value={Number(data.overall_rating)}
                                onChange={(v) => setData("overall_rating", v)}
                                readOnly={isReadOnly}
                            />
                            {errors.overall_rating && (
                                <p className="text-sm text-destructive">{errors.overall_rating}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Qualitative Feedback */}
                    <Card className="bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base">Qualitative Feedback</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="strengths">Strengths</Label>
                                <Textarea
                                    id="strengths"
                                    value={data.strengths}
                                    onChange={(e) => setData("strengths", e.target.value)}
                                    placeholder="Highlight key strengths and accomplishments…"
                                    rows={4}
                                    disabled={isReadOnly}
                                />
                                {errors.strengths && (
                                    <p className="text-sm text-destructive">{errors.strengths}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="improvements">Areas for Improvement</Label>
                                <Textarea
                                    id="improvements"
                                    value={data.improvements}
                                    onChange={(e) => setData("improvements", e.target.value)}
                                    placeholder="Identify areas for development and growth…"
                                    rows={4}
                                    disabled={isReadOnly}
                                />
                                {errors.improvements && (
                                    <p className="text-sm text-destructive">{errors.improvements}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="comments">Additional Comments</Label>
                                <Textarea
                                    id="comments"
                                    value={data.comments}
                                    onChange={(e) => setData("comments", e.target.value)}
                                    placeholder="Any other comments or context…"
                                    rows={3}
                                    disabled={isReadOnly}
                                />
                                {errors.comments && (
                                    <p className="text-sm text-destructive">{errors.comments}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action buttons */}
                    {canEdit && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                                type="submit"
                                variant="outline"
                                disabled={processing}
                                className="flex-1"
                            >
                                {processing ? "Saving…" : "Save Draft"}
                            </Button>
                            <Button
                                type="button"
                                disabled={processing || !allCompetenciesRated || !hasOverallRating}
                                onClick={handleSubmit}
                                className="flex-1 bg-brand hover:bg-brand/90 text-white"
                            >
                                {processing ? "Submitting…" : "Submit Review"}
                            </Button>
                        </div>
                    )}
                    {canEdit && (!allCompetenciesRated || !hasOverallRating) && (
                        <p className="text-xs text-muted-foreground text-center">
                            Rate all competencies and set an overall rating to enable submission.
                        </p>
                    )}
                </form>
            </div>
        </>
    );
}

PerformanceReviewFormPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
