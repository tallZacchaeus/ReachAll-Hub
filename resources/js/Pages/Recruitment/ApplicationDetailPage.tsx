import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import MainLayout from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ApplicationRow, InterviewFormat, Recommendation, OfferStatus } from '@/types/recruitment';

interface Props {
    application: ApplicationRow;
}

const STAGE_COLORS: Record<string, string> = {
    new:        'bg-zinc-100 text-zinc-700',
    screening:  'bg-yellow-100 text-yellow-800',
    interview:  'bg-blue-100 text-blue-800',
    offer:      'bg-purple-100 text-purple-800',
    hired:      'bg-green-100 text-green-800',
    rejected:   'bg-red-100 text-red-800',
    withdrawn:  'bg-zinc-200 text-zinc-500',
};

const OFFER_COLORS: Record<OfferStatus, string> = {
    draft:     'bg-zinc-100 text-zinc-700',
    sent:      'bg-blue-100 text-blue-800',
    accepted:  'bg-green-100 text-green-800',
    declined:  'bg-red-100 text-red-800',
    expired:   'bg-orange-100 text-orange-800',
    withdrawn: 'bg-zinc-200 text-zinc-500',
};

const RATING_STARS = (r: number | null) =>
    r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '—';

export default function ApplicationDetailPage({ application }: Props) {
    const [interviewOpen, setInterviewOpen] = useState(false);
    const [scorecardOpen, setScorecardOpen] = useState<number | null>(null);
    const [offerOpen, setOfferOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [intForm, setIntForm] = useState({
        interviewer_id: '',
        scheduled_at: '',
        duration_minutes: '60',
        format: 'video' as InterviewFormat,
        location_or_link: '',
        notes: '',
    });

    const [scoreForm, setScoreForm] = useState({
        overall_rating: '3',
        technical_rating: '',
        communication_rating: '',
        culture_fit_rating: '',
        strengths: '',
        concerns: '',
        recommendation: 'yes' as Recommendation,
        notes: '',
    });

    const [offerForm, setOfferForm] = useState({
        offered_salary_naira: '',
        start_date: '',
        offer_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        notes: '',
    });

    function handleScheduleInterview() {
        setSubmitting(true);
        router.post(route('recruitment.interviews.schedule', application.id), {
            ...intForm,
            duration_minutes: parseInt(intForm.duration_minutes),
        }, {
            onSuccess: () => setInterviewOpen(false),
            onFinish: () => setSubmitting(false),
        });
    }

    function handleSubmitScorecard(interviewId: number) {
        setSubmitting(true);
        router.post(route('recruitment.interviews.scorecards.submit', interviewId), {
            overall_rating:       parseInt(scoreForm.overall_rating),
            technical_rating:     scoreForm.technical_rating     ? parseInt(scoreForm.technical_rating)     : null,
            communication_rating: scoreForm.communication_rating ? parseInt(scoreForm.communication_rating) : null,
            culture_fit_rating:   scoreForm.culture_fit_rating   ? parseInt(scoreForm.culture_fit_rating)   : null,
            recommendation: scoreForm.recommendation,
            strengths: scoreForm.strengths || null,
            concerns:  scoreForm.concerns  || null,
            notes:     scoreForm.notes     || null,
        }, {
            onSuccess: () => setScorecardOpen(null),
            onFinish: () => setSubmitting(false),
        });
    }

    function handleCreateOffer() {
        setSubmitting(true);
        router.post(route('recruitment.offers.store', application.id), {
            offered_salary_kobo: Math.round(parseFloat(offerForm.offered_salary_naira) * 100),
            start_date: offerForm.start_date,
            offer_date: offerForm.offer_date,
            expiry_date: offerForm.expiry_date || null,
            notes: offerForm.notes || null,
        }, {
            onSuccess: () => setOfferOpen(false),
            onFinish: () => setSubmitting(false),
        });
    }

    const applicantName = application.candidate?.name ?? application.applicant?.name ?? '—';
    const applicantEmail = application.candidate?.email ?? application.applicant?.email ?? '';

    return (
        <MainLayout title={`Application — ${applicantName}`}>
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <Link href={route('recruitment.pipeline.index')} className="text-sm text-muted-foreground hover:underline">
                        ← Pipeline
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-xl font-semibold">{applicantName}</h1>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STAGE_COLORS[application.stage]}`}>
                        {application.stage}
                    </span>
                </div>

                {/* Applicant info */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Applicant</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Name: </span>{applicantName}</div>
                        <div><span className="text-muted-foreground">Email: </span>{applicantEmail}</div>
                        <div><span className="text-muted-foreground">Type: </span>{application.candidate ? 'External Candidate' : 'Internal Applicant'}</div>
                        <div><span className="text-muted-foreground">Posted Role: </span>{application.job_posting?.title ?? '—'}</div>
                        {application.candidate && (
                            <>
                                <div><span className="text-muted-foreground">Company: </span>{application.candidate.current_company ?? '—'}</div>
                                <div><span className="text-muted-foreground">Current Title: </span>{application.candidate.current_title ?? '—'}</div>
                            </>
                        )}
                        {application.ats_notes && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">ATS Notes: </span>{application.ats_notes}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Interviews */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Interviews</CardTitle>
                        <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">Schedule Interview</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <Label>Interviewer User ID</Label>
                                        <Input
                                            type="number"
                                            placeholder="User ID"
                                            value={intForm.interviewer_id}
                                            onChange={e => setIntForm(f => ({ ...f, interviewer_id: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Date & Time</Label>
                                            <Input
                                                type="datetime-local"
                                                value={intForm.scheduled_at}
                                                onChange={e => setIntForm(f => ({ ...f, scheduled_at: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Duration (min)</Label>
                                            <Input
                                                type="number"
                                                value={intForm.duration_minutes}
                                                onChange={e => setIntForm(f => ({ ...f, duration_minutes: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Format</Label>
                                            <Select
                                                value={intForm.format}
                                                onValueChange={v => setIntForm(f => ({ ...f, format: v as InterviewFormat }))}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="video">Video</SelectItem>
                                                    <SelectItem value="phone">Phone</SelectItem>
                                                    <SelectItem value="in_person">In Person</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Link / Location</Label>
                                            <Input
                                                value={intForm.location_or_link}
                                                onChange={e => setIntForm(f => ({ ...f, location_or_link: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Notes</Label>
                                        <Textarea rows={2} value={intForm.notes} onChange={e => setIntForm(f => ({ ...f, notes: e.target.value }))} />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setInterviewOpen(false)}>Cancel</Button>
                                        <Button onClick={handleScheduleInterview} disabled={submitting || !intForm.interviewer_id || !intForm.scheduled_at}>
                                            {submitting ? 'Scheduling…' : 'Schedule'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {(!application.interviews || application.interviews.length === 0) && (
                            <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>
                        )}
                        <div className="space-y-4">
                            {application.interviews?.map(iv => (
                                <div key={iv.id} className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-sm">
                                                {new Date(iv.scheduled_at).toLocaleString()} — {iv.duration_minutes}min
                                            </div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {iv.format} · {iv.interviewer?.name ?? 'Interviewer'} · {iv.status}
                                            </div>
                                        </div>
                                        <Dialog open={scorecardOpen === iv.id} onOpenChange={o => !o && setScorecardOpen(null)}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="outline" onClick={() => setScorecardOpen(iv.id)}>
                                                    {iv.scorecards?.length ? 'Edit Scorecard' : 'Submit Scorecard'}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-lg">
                                                <DialogHeader><DialogTitle>Interview Scorecard</DialogTitle></DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {([
                                                            ['Overall Rating *', 'overall_rating'],
                                                            ['Technical Rating', 'technical_rating'],
                                                            ['Communication', 'communication_rating'],
                                                            ['Culture Fit', 'culture_fit_rating'],
                                                        ] as [string, keyof typeof scoreForm][]).map(([label, key]) => (
                                                            <div key={key} className="space-y-1">
                                                                <Label>{label} (1–5)</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    max="5"
                                                                    value={scoreForm[key]}
                                                                    onChange={e => setScoreForm(f => ({ ...f, [key]: e.target.value }))}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Recommendation *</Label>
                                                        <Select
                                                            value={scoreForm.recommendation}
                                                            onValueChange={v => setScoreForm(f => ({ ...f, recommendation: v as Recommendation }))}
                                                        >
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="strong_yes">Strong Yes</SelectItem>
                                                                <SelectItem value="yes">Yes</SelectItem>
                                                                <SelectItem value="no">No</SelectItem>
                                                                <SelectItem value="strong_no">Strong No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Strengths</Label>
                                                        <Textarea rows={2} value={scoreForm.strengths} onChange={e => setScoreForm(f => ({ ...f, strengths: e.target.value }))} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>Concerns</Label>
                                                        <Textarea rows={2} value={scoreForm.concerns} onChange={e => setScoreForm(f => ({ ...f, concerns: e.target.value }))} />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" onClick={() => setScorecardOpen(null)}>Cancel</Button>
                                                        <Button onClick={() => handleSubmitScorecard(iv.id)} disabled={submitting}>
                                                            {submitting ? 'Saving…' : 'Submit Scorecard'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    {iv.scorecards?.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {iv.scorecards.map(sc => (
                                                <div key={sc.id} className="rounded bg-muted/40 p-3 text-xs">
                                                    <div className="flex items-center gap-4 mb-1">
                                                        <span className="font-medium">{sc.evaluator?.name}</span>
                                                        <span>Overall: {RATING_STARS(sc.overall_rating)}</span>
                                                        <span className="capitalize font-medium text-blue-700">{sc.recommendation.replace('_', ' ')}</span>
                                                    </div>
                                                    {sc.strengths && <div className="text-green-700">+ {sc.strengths}</div>}
                                                    {sc.concerns && <div className="text-red-700">– {sc.concerns}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Offer Letter */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Offer Letter</CardTitle>
                        {!application.offer && (
                            <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">Create Offer</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Create Offer Letter</DialogTitle></DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <Label>Offered Salary (₦) *</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 500000"
                                                value={offerForm.offered_salary_naira}
                                                onChange={e => setOfferForm(f => ({ ...f, offered_salary_naira: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label>Offer Date *</Label>
                                                <Input type="date" value={offerForm.offer_date} onChange={e => setOfferForm(f => ({ ...f, offer_date: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Start Date *</Label>
                                                <Input type="date" value={offerForm.start_date} onChange={e => setOfferForm(f => ({ ...f, start_date: e.target.value }))} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Expiry Date</Label>
                                                <Input type="date" value={offerForm.expiry_date} onChange={e => setOfferForm(f => ({ ...f, expiry_date: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Notes</Label>
                                            <Textarea rows={3} value={offerForm.notes} onChange={e => setOfferForm(f => ({ ...f, notes: e.target.value }))} />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setOfferOpen(false)}>Cancel</Button>
                                            <Button
                                                onClick={handleCreateOffer}
                                                disabled={submitting || !offerForm.offered_salary_naira || !offerForm.start_date}
                                            >
                                                {submitting ? 'Creating…' : 'Create Offer'}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent>
                        {!application.offer && (
                            <p className="text-sm text-muted-foreground">No offer letter created yet.</p>
                        )}
                        {application.offer && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${OFFER_COLORS[application.offer.status]}`}>
                                        {application.offer.status}
                                    </span>
                                    <span className="text-sm">
                                        ₦{(application.offer.offered_salary_kobo / 100).toLocaleString()} /yr
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Start: {application.offer.start_date}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {application.offer.status === 'draft' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.post(route('recruitment.offers.send', application.offer!.id), {})}
                                        >
                                            Mark Sent
                                        </Button>
                                    )}
                                    {application.offer.status === 'sent' && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => router.post(route('recruitment.offers.respond', application.offer!.id), { response: 'accepted' })}
                                            >
                                                Mark Accepted
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => router.post(route('recruitment.offers.respond', application.offer!.id), { response: 'declined' })}
                                            >
                                                Mark Declined
                                            </Button>
                                        </>
                                    )}
                                    {['draft', 'sent'].includes(application.offer.status) && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.post(route('recruitment.offers.withdraw', application.offer!.id), {})}
                                        >
                                            Withdraw
                                        </Button>
                                    )}
                                    {application.offer.document_path && (
                                        <a
                                            href={route('recruitment.offers.download', application.offer.id)}
                                            className="text-xs text-blue-600 hover:underline self-center"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Download
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
