<?php

namespace Tests\Feature;

use App\Models\Candidate;
use App\Models\InterviewSchedule;
use App\Models\InterviewScorecard;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\JobRequisition;
use App\Models\OfferLetter;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecruitmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function hrUser(): User
    {
        return User::factory()->create(['role' => 'hr', 'employee_stage' => 'performer']);
    }

    private function staffUser(): User
    {
        return User::factory()->create(['role' => 'staff', 'employee_stage' => 'performer']);
    }

    private function managementUser(): User
    {
        return User::factory()->create(['role' => 'management', 'employee_stage' => 'leader']);
    }

    private function posting(): JobPosting
    {
        $hr = $this->hrUser();

        return JobPosting::create([
            'title' => 'Software Engineer',
            'department' => 'Engineering',
            'description' => 'Build stuff.',
            'requirements' => 'PHP skills.',
            'posted_by_user_id' => $hr->id,
            'status' => 'open',
            'closes_at' => now()->addDays(30),
        ]);
    }

    // ── Requisitions ─────────────────────────────────────────────────────────

    public function test_guest_cannot_access_requisitions(): void
    {
        $this->get('/recruitment/requisitions')->assertRedirect('/login');
    }

    public function test_staff_cannot_access_requisitions(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/recruitment/requisitions')
            ->assertStatus(403);
    }

    public function test_hr_can_view_requisitions(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/recruitment/requisitions')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Recruitment/JobRequisitionsPage'));
    }

    public function test_hr_can_create_requisition(): void
    {
        $hr = $this->hrUser();

        $this->actingAs($hr)
            ->post('/recruitment/requisitions', [
                'title' => 'Product Manager',
                'department' => 'Product',
                'headcount' => 2,
                'employment_type' => 'full_time',
                'justification' => 'Growing product team needs a PM.',
                'priority' => 'high',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('job_requisitions', [
            'title' => 'Product Manager',
            'status' => 'pending',
            'requested_by_id' => $hr->id,
            'headcount' => 2,
        ]);
    }

    public function test_requisition_validation_requires_justification(): void
    {
        $this->actingAs($this->hrUser())
            ->post('/recruitment/requisitions', [
                'title' => 'PM',
                'department' => 'Product',
                'headcount' => 1,
                'employment_type' => 'full_time',
                'priority' => 'normal',
                // missing justification
            ])
            ->assertSessionHasErrors('justification');
    }

    public function test_hr_can_approve_pending_requisition(): void
    {
        $hr = $this->hrUser();
        $req = JobRequisition::create([
            'title' => 'PM', 'department' => 'Product', 'headcount' => 1,
            'employment_type' => 'full_time', 'justification' => 'Needed.',
            'priority' => 'normal', 'status' => 'pending', 'requested_by_id' => $hr->id,
        ]);

        $this->actingAs($hr)
            ->post("/recruitment/requisitions/{$req->id}/approve")
            ->assertRedirect();

        $this->assertDatabaseHas('job_requisitions', [
            'id' => $req->id,
            'status' => 'approved',
            'approved_by_id' => $hr->id,
        ]);
    }

    public function test_cannot_approve_non_pending_requisition(): void
    {
        $hr = $this->hrUser();
        $req = JobRequisition::create([
            'title' => 'PM', 'department' => 'Product', 'headcount' => 1,
            'employment_type' => 'full_time', 'justification' => 'Needed.',
            'priority' => 'normal', 'status' => 'approved', 'requested_by_id' => $hr->id,
        ]);

        $this->actingAs($hr)
            ->post("/recruitment/requisitions/{$req->id}/approve")
            ->assertStatus(422);
    }

    public function test_hr_can_reject_requisition_with_reason(): void
    {
        $hr = $this->hrUser();
        $req = JobRequisition::create([
            'title' => 'PM', 'department' => 'Product', 'headcount' => 1,
            'employment_type' => 'full_time', 'justification' => 'Needed.',
            'priority' => 'normal', 'status' => 'pending', 'requested_by_id' => $hr->id,
        ]);

        $this->actingAs($hr)
            ->post("/recruitment/requisitions/{$req->id}/reject", [
                'rejection_reason' => 'Budget freeze.',
            ])
            ->assertRedirect();

        $req->refresh();
        $this->assertEquals('rejected', $req->status);
        $this->assertEquals('Budget freeze.', $req->rejection_reason);
    }

    // ── Candidate Pool ───────────────────────────────────────────────────────

    public function test_hr_can_view_candidate_pool(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/recruitment/candidates')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Recruitment/CandidatesPage'));
    }

    public function test_staff_cannot_view_candidates(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/recruitment/candidates')
            ->assertStatus(403);
    }

    public function test_hr_can_add_candidate(): void
    {
        $hr = $this->hrUser();

        $this->actingAs($hr)
            ->post('/recruitment/candidates', [
                'name' => 'Jane Doe',
                'email' => 'jane@example.com',
                'current_company' => 'ACME Corp',
                'current_title' => 'Senior Dev',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('candidates', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'status' => 'active',
            'added_by_id' => $hr->id,
        ]);
    }

    public function test_duplicate_candidate_email_rejected(): void
    {
        $this->actingAs($this->hrUser());

        Candidate::create([
            'name' => 'Jane', 'email' => 'jane@example.com',
            'status' => 'active', 'added_by_id' => 1,
        ]);

        $this->post('/recruitment/candidates', [
            'name' => 'Another Jane',
            'email' => 'jane@example.com',
        ])->assertSessionHasErrors('email');
    }

    public function test_hr_can_update_candidate_status(): void
    {
        $hr = $this->hrUser();
        $candidate = Candidate::create([
            'name' => 'Jane', 'email' => 'j@x.com',
            'status' => 'active', 'added_by_id' => $hr->id,
        ]);

        $this->actingAs($hr)
            ->put("/recruitment/candidates/{$candidate->id}", [
                'name' => 'Jane Doe',
                'status' => 'inactive',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('candidates', ['id' => $candidate->id, 'status' => 'inactive']);
    }

    // ── Application Pipeline ─────────────────────────────────────────────────

    public function test_hr_can_view_pipeline(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/recruitment/pipeline')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Recruitment/ApplicationPipelinePage'));
    }

    public function test_hr_can_add_external_application(): void
    {
        $hr = $this->hrUser();
        $posting = $this->posting();
        $candidate = Candidate::create([
            'name' => 'Bob', 'email' => 'bob@x.com',
            'status' => 'active', 'added_by_id' => $hr->id,
        ]);

        $this->actingAs($hr)
            ->post('/recruitment/pipeline/add-external', [
                'job_posting_id' => $posting->id,
                'candidate_id' => $candidate->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('job_applications', [
            'job_posting_id' => $posting->id,
            'candidate_id' => $candidate->id,
            'stage' => 'new',
        ]);
    }

    public function test_prevents_duplicate_external_application(): void
    {
        $hr = $this->hrUser();
        $posting = $this->posting();
        $candidate = Candidate::create([
            'name' => 'Bob', 'email' => 'bob@x.com',
            'status' => 'active', 'added_by_id' => $hr->id,
        ]);

        JobApplication::create([
            'job_posting_id' => $posting->id,
            'candidate_id' => $candidate->id,
            'status' => 'applied',
            'stage' => 'new',
            'applied_at' => now(),
        ]);

        $this->actingAs($hr)
            ->post('/recruitment/pipeline/add-external', [
                'job_posting_id' => $posting->id,
                'candidate_id' => $candidate->id,
            ])
            ->assertStatus(422);
    }

    public function test_hr_can_advance_application_stage(): void
    {
        $hr = $this->hrUser();
        $posting = $this->posting();
        $app = JobApplication::create([
            'job_posting_id' => $posting->id,
            'user_id' => $this->staffUser()->id,
            'status' => 'applied',
            'stage' => 'new',
            'applied_at' => now(),
        ]);

        $this->actingAs($hr)
            ->post("/recruitment/pipeline/{$app->id}/stage", [
                'stage' => 'screening',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('job_applications', ['id' => $app->id, 'stage' => 'screening']);
    }

    // ── Interview Scheduling ─────────────────────────────────────────────────

    public function test_hr_can_schedule_interview(): void
    {
        $hr = $this->hrUser();
        $interviewer = $this->managementUser();
        $posting = $this->posting();
        $app = JobApplication::create([
            'job_posting_id' => $posting->id,
            'user_id' => $this->staffUser()->id,
            'status' => 'applied',
            'stage' => 'screening',
            'applied_at' => now(),
        ]);

        $this->actingAs($hr)
            ->post("/recruitment/pipeline/{$app->id}/interviews", [
                'interviewer_id' => $interviewer->id,
                'scheduled_at' => now()->addDays(3)->format('Y-m-d H:i:s'),
                'duration_minutes' => 60,
                'format' => 'video',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('interview_schedules', [
            'job_application_id' => $app->id,
            'interviewer_id' => $interviewer->id,
            'status' => 'scheduled',
        ]);

        // Stage should advance to interview
        $this->assertDatabaseHas('job_applications', ['id' => $app->id, 'stage' => 'interview']);
    }

    public function test_interviewer_can_submit_scorecard(): void
    {
        $hr = $this->hrUser();
        $interviewer = $this->managementUser();
        $posting = $this->posting();
        $app = JobApplication::create([
            'job_posting_id' => $posting->id,
            'user_id' => $this->staffUser()->id,
            'status' => 'applied',
            'stage' => 'interview',
            'applied_at' => now(),
        ]);
        $schedule = InterviewSchedule::create([
            'job_application_id' => $app->id,
            'interviewer_id' => $interviewer->id,
            'scheduled_at' => now()->addDays(2),
            'duration_minutes' => 60,
            'format' => 'video',
            'status' => 'scheduled',
        ]);

        $this->actingAs($interviewer)
            ->post("/recruitment/interviews/{$schedule->id}/scorecards", [
                'overall_rating' => 4,
                'recommendation' => 'yes',
                'strengths' => 'Strong communicator',
                'concerns' => 'Limited backend experience',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('interview_scorecards', [
            'interview_schedule_id' => $schedule->id,
            'evaluator_id' => $interviewer->id,
            'overall_rating' => 4,
            'recommendation' => 'yes',
        ]);

        // Schedule should be marked completed
        $this->assertDatabaseHas('interview_schedules', ['id' => $schedule->id, 'status' => 'completed']);
    }

    public function test_staff_cannot_submit_scorecard_for_unrelated_interview(): void
    {
        $hr = $this->hrUser();
        $posting = $this->posting();
        $app = JobApplication::create([
            'job_posting_id' => $posting->id,
            'user_id' => $this->staffUser()->id,
            'status' => 'applied', 'stage' => 'interview', 'applied_at' => now(),
        ]);
        $schedule = InterviewSchedule::create([
            'job_application_id' => $app->id,
            'interviewer_id' => $hr->id,
            'scheduled_at' => now()->addDays(2),
            'duration_minutes' => 60,
            'format' => 'video',
            'status' => 'scheduled',
        ]);

        $otherUser = $this->staffUser();

        $this->actingAs($otherUser)
            ->post("/recruitment/interviews/{$schedule->id}/scorecards", [
                'overall_rating' => 3,
                'recommendation' => 'yes',
            ])
            ->assertStatus(403);
    }

    // ── Offer Letters ────────────────────────────────────────────────────────

    public function test_hr_can_create_offer_letter(): void
    {
        $hr = $this->hrUser();
        $posting = $this->posting();
        $app = JobApplication::create([
            'job_posting_id' => $posting->id,
            'user_id' => $this->staffUser()->id,
            'status' => 'applied', 'stage' => 'interview', 'applied_at' => now(),
        ]);

        $this->actingAs($hr)
            ->post("/recruitment/pipeline/{$app->id}/offer", [
                'offered_salary_kobo' => 60_000_00, // ₦600,000
                'start_date' => now()->addDays(30)->format('Y-m-d'),
                'offer_date' => now()->format('Y-m-d'),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('offer_letters', [
            'job_application_id' => $app->id,
            'offered_salary_kobo' => 60_000_00,
            'status' => 'draft',
            'created_by_id' => $hr->id,
        ]);

        // Stage should advance to offer
        $this->assertDatabaseHas('job_applications', ['id' => $app->id, 'stage' => 'offer']);
    }

    public function test_cannot_create_second_offer_for_same_application(): void
    {
        $hr = $this->hrUser();
        $posting = $this->posting();
        $app = JobApplication::create([
            'job_posting_id' => $posting->id,
            'user_id' => $this->staffUser()->id,
            'status' => 'applied', 'stage' => 'offer', 'applied_at' => now(),
        ]);
        OfferLetter::create([
            'job_application_id' => $app->id,
            'offered_salary_kobo' => 60_000_00,
            'start_date' => now()->addDays(30),
            'offer_date' => now(),
            'status' => 'draft',
            'created_by_id' => $hr->id,
        ]);

        $this->actingAs($hr)
            ->post("/recruitment/pipeline/{$app->id}/offer", [
                'offered_salary_kobo' => 70_000_00,
                'start_date' => now()->addDays(30)->format('Y-m-d'),
                'offer_date' => now()->format('Y-m-d'),
            ])
            ->assertStatus(422);
    }

    public function test_hr_can_send_then_accept_offer(): void
    {
        $hr = $this->hrUser();
        $posting = $this->posting();
        $app = JobApplication::create([
            'job_posting_id' => $posting->id,
            'user_id' => $this->staffUser()->id,
            'status' => 'applied', 'stage' => 'offer', 'applied_at' => now(),
        ]);
        $offer = OfferLetter::create([
            'job_application_id' => $app->id,
            'offered_salary_kobo' => 60_000_00,
            'start_date' => now()->addDays(30),
            'offer_date' => now(),
            'status' => 'draft',
            'created_by_id' => $hr->id,
        ]);

        $this->actingAs($hr)
            ->post("/recruitment/offers/{$offer->id}/send")
            ->assertRedirect();

        $this->assertDatabaseHas('offer_letters', ['id' => $offer->id, 'status' => 'sent']);

        $this->actingAs($hr)
            ->post("/recruitment/offers/{$offer->id}/respond", ['response' => 'accepted'])
            ->assertRedirect();

        $this->assertDatabaseHas('offer_letters', ['id' => $offer->id, 'status' => 'accepted']);
        $this->assertDatabaseHas('job_applications', ['id' => $app->id, 'stage' => 'hired']);
    }

    public function test_offer_accept_sets_external_candidate_to_hired(): void
    {
        $hr = $this->hrUser();
        $posting = $this->posting();
        $candidate = Candidate::create([
            'name' => 'Hired Person', 'email' => 'hired@x.com',
            'status' => 'active', 'added_by_id' => $hr->id,
        ]);
        $app = JobApplication::create([
            'job_posting_id' => $posting->id,
            'candidate_id' => $candidate->id,
            'status' => 'applied', 'stage' => 'offer', 'applied_at' => now(),
        ]);
        $offer = OfferLetter::create([
            'job_application_id' => $app->id,
            'offered_salary_kobo' => 50_000_00,
            'start_date' => now()->addDays(30),
            'offer_date' => now(),
            'status' => 'sent',
            'created_by_id' => $hr->id,
            'sent_at' => now(),
        ]);

        $this->actingAs($hr)
            ->post("/recruitment/offers/{$offer->id}/respond", ['response' => 'accepted'])
            ->assertRedirect();

        $this->assertDatabaseHas('candidates', ['id' => $candidate->id, 'status' => 'hired']);
    }

    // ── Model Unit Tests ─────────────────────────────────────────────────────

    public function test_offer_letter_salary_naira_accessor(): void
    {
        $offer = new OfferLetter(['offered_salary_kobo' => 100_000_00]);
        $this->assertEquals(100_000.0, $offer->offeredSalaryNaira());
    }

    public function test_scorecard_is_recommended(): void
    {
        $yes = new InterviewScorecard(['recommendation' => 'strong_yes']);
        $no = new InterviewScorecard(['recommendation' => 'no']);

        $this->assertTrue($yes->isRecommended());
        $this->assertFalse($no->isRecommended());
    }

    public function test_candidate_is_active(): void
    {
        $active = new Candidate(['status' => 'active']);
        $hired = new Candidate(['status' => 'hired']);

        $this->assertTrue($active->isActive());
        $this->assertFalse($hired->isActive());
    }

    public function test_job_application_applicant_name_prefers_candidate(): void
    {
        $candidate = new Candidate(['name' => 'External Person']);
        $app = new JobApplication;
        $app->setRelation('candidate', $candidate);
        $app->setRelation('applicant', null);

        $this->assertEquals('External Person', $app->applicantName());
    }
}
