<?php

namespace App\Http\Controllers\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\OfferLetter;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OfferLetterController extends Controller
{
    public function store(Request $request, JobApplication $jobApplication): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);

        abort_if(
            $jobApplication->offer()->exists(),
            422,
            'An offer letter already exists for this application.'
        );

        $data = $request->validate([
            'offered_salary_kobo' => 'required|integer|min:1',
            'start_date' => 'required|date|after:today',
            'offer_date' => 'required|date',
            'expiry_date' => 'nullable|date|after:offer_date',
            'notes' => 'nullable|string|max:3000',
            'document' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        $docPath = null;
        if ($request->hasFile('document')) {
            $docPath = $request->file('document')->store(
                'offers/'.$jobApplication->id, 'hr'
            );
        }

        OfferLetter::create([
            'job_application_id' => $jobApplication->id,
            'offered_salary_kobo' => $data['offered_salary_kobo'],
            'start_date' => $data['start_date'],
            'offer_date' => $data['offer_date'],
            'expiry_date' => $data['expiry_date'] ?? null,
            'notes' => $data['notes'] ?? null,
            'document_path' => $docPath,
            'document_disk' => $docPath ? 'hr' : null,
            'status' => 'draft',
            'created_by_id' => $request->user()->id,
        ]);

        // Advance application to offer stage
        if ($jobApplication->stage !== 'offer') {
            $jobApplication->update(['stage' => 'offer']);
        }

        return back()->with('success', 'Offer letter created.');
    }

    public function send(Request $request, OfferLetter $offerLetter): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);
        abort_unless($offerLetter->status === 'draft', 422);

        $offerLetter->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        return back()->with('success', 'Offer letter marked as sent.');
    }

    public function respond(Request $request, OfferLetter $offerLetter): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);
        abort_unless($offerLetter->status === 'sent', 422);

        $data = $request->validate([
            'response' => 'required|in:accepted,declined',
        ]);

        $offerLetter->update([
            'status' => $data['response'],
            'responded_at' => now(),
        ]);

        // Advance application stage
        $stage = $data['response'] === 'accepted' ? 'hired' : 'rejected';
        $updates = ['stage' => $stage];
        if ($stage === 'hired') {
            $updates['hired_at'] = now();
            $updates['status'] = 'shortlisted';
        } else {
            $updates['rejected_at'] = now();
            $updates['status'] = 'rejected';
        }
        $offerLetter->application->update($updates);

        // If accepted, update candidate status and create preboarding tasks
        if ($data['response'] === 'accepted') {
            if ($offerLetter->application->candidate) {
                $offerLetter->application->candidate->update(['status' => 'hired']);
            }

            $this->createDefaultPreboardingTasks($offerLetter);

            AuditLogger::record(
                'onboarding',
                'preboarding_initiated',
                OfferLetter::class,
                $offerLetter->id,
                null,
                ['offer_letter_id' => $offerLetter->id],
                $request,
            );
        }

        return back()->with('success', 'Offer response recorded.');
    }

    public function withdraw(Request $request, OfferLetter $offerLetter): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('recruitment.manage'), 403);
        abort_unless(in_array($offerLetter->status, ['draft', 'sent'], true), 422);

        $offerLetter->update(['status' => 'withdrawn']);

        return back()->with('success', 'Offer letter withdrawn.');
    }

    public function download(Request $request, OfferLetter $offerLetter): mixed
    {
        abort_unless($request->user()->hasPermission('recruitment.manage') ||
                     $request->user()->hasPermission('recruitment.view'), 403);
        abort_unless($offerLetter->document_path, 404);

        $disk = $offerLetter->document_disk ?? 'hr';
        abort_unless(Storage::disk($disk)->exists($offerLetter->document_path), 404);

        return Storage::disk($disk)->download(
            $offerLetter->document_path,
            'offer_letter_'.$offerLetter->id.'.pdf'
        );
    }

    /**
     * Create the standard pre-boarding checklist tasks for a newly accepted offer.
     *
     * Due dates are calculated relative to the offer's start date. If no start
     * date is set, due_date is left null and HR should update it manually.
     */
    private function createDefaultPreboardingTasks(OfferLetter $offer): void
    {
        // [task_type, title, days_before_start]
        $defaults = [
            ['document_upload',  'Upload Valid Government ID (NIN/Passport/Drivers License)', 7],
            ['compliance_doc',   'Submit Signed Employment Contract',                          3],
            ['bank_details',     'Provide Bank Account Details for Payroll',                   7],
            ['document_upload',  'Provide Recent Passport Photograph',                         5],
            ['policy_ack',       'Acknowledge Employee Handbook',                              5],
            ['it_access',        'IT Workstation & Access Setup',                              3],
            ['equipment_request', 'Confirm Equipment Requirements',                             7],
        ];

        foreach ($defaults as [$type, $title, $daysToComplete]) {
            $offer->preboarding_tasks()->create([
                'task_type' => $type,
                'title' => $title,
                'due_date' => $offer->start_date
                    ? Carbon::parse($offer->start_date)->subDays($daysToComplete)->toDateString()
                    : null,
                'status' => 'pending',
            ]);
        }
    }
}
