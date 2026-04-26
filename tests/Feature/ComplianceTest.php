<?php

namespace Tests\Feature;

use App\Models\ComplianceDocument;
use App\Models\CompliancePolicy;
use App\Models\CompliancePolicyAcknowledgement;
use App\Models\CompliancePolicyVersion;
use App\Models\ComplianceTraining;
use App\Models\ComplianceTrainingAssignment;
use App\Models\DataSubjectRequest;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplianceTest extends TestCase
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

    private function makePolicy(array $attrs = []): CompliancePolicy
    {
        $policy = CompliancePolicy::create(array_merge([
            'title' => 'Test Policy',
            'slug' => 'test-policy-'.uniqid(),
            'category' => 'hr',
            'requires_acknowledgement' => true,
            'is_active' => true,
        ], $attrs));

        return $policy;
    }

    private function publishVersion(CompliancePolicy $policy, string $version = '1.0', ?User $publisher = null): CompliancePolicyVersion
    {
        $ver = CompliancePolicyVersion::create([
            'policy_id' => $policy->id,
            'version' => $version,
            'content' => 'Policy content for version '.$version,
            'published_by_id' => $publisher?->id,
            'published_at' => now(),
        ]);
        $policy->update(['current_version' => $version, 'published_at' => now()]);

        return $ver;
    }

    // ── Auth and access ───────────────────────────────────────────────────────

    public function test_guest_cannot_access_compliance_documents(): void
    {
        $this->get('/compliance/documents')->assertRedirect('/login');
    }

    public function test_staff_cannot_access_compliance_documents_admin(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/compliance/documents')
            ->assertStatus(403);
    }

    public function test_hr_can_access_compliance_documents(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/compliance/documents')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Compliance/ComplianceDocumentsPage'));
    }

    public function test_staff_can_access_my_compliance(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/compliance/my')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Compliance/MyCompliancePage'));
    }

    // ── Compliance documents ──────────────────────────────────────────────────

    public function test_hr_can_add_compliance_document(): void
    {
        $hr = $this->hrUser();
        $staff = $this->staffUser();

        $this->actingAs($hr)
            ->post('/compliance/documents', [
                'user_id' => $staff->id,
                'type' => 'passport',
                'document_number' => 'A1234567',
                'country_of_issue' => 'Nigeria',
                'expires_at' => now()->addYears(5)->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('compliance_documents', [
            'user_id' => $staff->id,
            'type' => 'passport',
            'status' => 'pending',
        ]);
    }

    public function test_hr_can_verify_document(): void
    {
        $hr = $this->hrUser();
        $doc = ComplianceDocument::create([
            'user_id' => $this->staffUser()->id,
            'type' => 'national_id',
            'status' => 'pending',
        ]);

        $this->actingAs($hr)
            ->post("/compliance/documents/{$doc->id}/verify")
            ->assertRedirect();

        $doc->refresh();
        $this->assertEquals('active', $doc->status);
        $this->assertEquals($hr->id, $doc->verified_by_id);
        $this->assertNotNull($doc->verified_at);
    }

    public function test_hr_can_reject_document(): void
    {
        $hr = $this->hrUser();
        $doc = ComplianceDocument::create([
            'user_id' => $this->staffUser()->id,
            'type' => 'visa',
            'status' => 'pending',
        ]);

        $this->actingAs($hr)
            ->post("/compliance/documents/{$doc->id}/reject", [
                'notes' => 'Document appears altered.',
            ])
            ->assertRedirect();

        $doc->refresh();
        $this->assertEquals('rejected', $doc->status);
        $this->assertStringContainsString('altered', $doc->notes);
    }

    public function test_reject_requires_notes(): void
    {
        $hr = $this->hrUser();
        $doc = ComplianceDocument::create([
            'user_id' => $this->staffUser()->id,
            'type' => 'visa',
            'status' => 'pending',
        ]);

        $this->actingAs($hr)
            ->post("/compliance/documents/{$doc->id}/reject", [])
            ->assertSessionHasErrors('notes');
    }

    public function test_staff_can_upload_own_document(): void
    {
        $staff = $this->staffUser();

        $this->actingAs($staff)
            ->post('/compliance/my/documents', [
                'type' => 'right_to_work',
                'document_number' => 'RTW-001',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('compliance_documents', [
            'user_id' => $staff->id,
            'type' => 'right_to_work',
            'status' => 'pending',
        ]);
    }

    // ── Data Subject Requests ─────────────────────────────────────────────────

    public function test_hr_can_access_dsr_list(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/compliance/dsr')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Compliance/DataSubjectRequestsPage'));
    }

    public function test_staff_cannot_access_dsr_admin_list(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/compliance/dsr')
            ->assertStatus(403);
    }

    public function test_dsr_request_number_auto_generated(): void
    {
        $dsr = DataSubjectRequest::create([
            'user_id' => $this->staffUser()->id,
            'type' => 'access',
            'description' => 'I want to see all data held about me.',
        ]);

        $this->assertMatchesRegularExpression('/^DSR-\d{4}-\d{4}$/', $dsr->request_number);
    }

    public function test_dsr_due_at_auto_set_to_30_days(): void
    {
        $dsr = DataSubjectRequest::create([
            'user_id' => $this->staffUser()->id,
            'type' => 'access',
            'description' => 'Please provide my data.',
        ]);

        $this->assertNotNull($dsr->due_at);
        $this->assertEqualsWithDelta(30, now()->diffInDays($dsr->due_at), 1);
    }

    public function test_staff_can_submit_dsr(): void
    {
        $staff = $this->staffUser();

        $this->actingAs($staff)
            ->post('/compliance/my/dsr', [
                'type' => 'erasure',
                'description' => 'Please delete my personal data from all systems.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('data_subject_requests', [
            'user_id' => $staff->id,
            'type' => 'erasure',
            'status' => 'pending',
        ]);
    }

    public function test_hr_can_acknowledge_dsr(): void
    {
        $hr = $this->hrUser();
        $dsr = DataSubjectRequest::create([
            'user_id' => $this->staffUser()->id,
            'type' => 'access',
            'description' => 'Please provide my data.',
        ]);

        $this->actingAs($hr)
            ->post("/compliance/dsr/{$dsr->id}/acknowledge")
            ->assertRedirect();

        $dsr->refresh();
        $this->assertEquals('acknowledged', $dsr->status);
        $this->assertEquals($hr->id, $dsr->handled_by_id);
        $this->assertNotNull($dsr->acknowledged_at);
    }

    public function test_hr_can_complete_dsr_with_response(): void
    {
        $hr = $this->hrUser();
        $dsr = DataSubjectRequest::create([
            'user_id' => $this->staffUser()->id,
            'type' => 'access',
            'description' => 'Please provide my data.',
            'status' => 'in_progress',
        ]);

        $this->actingAs($hr)
            ->put("/compliance/dsr/{$dsr->id}", [
                'status' => 'completed',
                'response' => 'Your data export has been sent to your email.',
            ])
            ->assertRedirect();

        $dsr->refresh();
        $this->assertEquals('completed', $dsr->status);
        $this->assertNotNull($dsr->completed_at);
        $this->assertStringContainsString('email', $dsr->response);
    }

    public function test_staff_can_withdraw_pending_dsr(): void
    {
        $staff = $this->staffUser();
        $dsr = DataSubjectRequest::create([
            'user_id' => $staff->id,
            'type' => 'erasure',
            'description' => 'Please delete.',
        ]);

        $this->actingAs($staff)
            ->post("/compliance/my/dsr/{$dsr->id}/withdraw")
            ->assertRedirect();

        $this->assertDatabaseHas('data_subject_requests', ['id' => $dsr->id, 'status' => 'withdrawn']);
    }

    public function test_staff_cannot_withdraw_another_users_dsr(): void
    {
        $staff = $this->staffUser();
        $other = $this->staffUser();
        $dsr = DataSubjectRequest::create([
            'user_id' => $other->id,
            'type' => 'access',
            'description' => 'Not mine.',
        ]);

        $this->actingAs($staff)
            ->post("/compliance/my/dsr/{$dsr->id}/withdraw")
            ->assertStatus(403);
    }

    // ── Compliance Trainings ──────────────────────────────────────────────────

    public function test_hr_can_create_training(): void
    {
        $this->actingAs($this->hrUser())
            ->post('/compliance/trainings', [
                'title' => 'Data Protection Awareness',
                'category' => 'data_protection',
                'is_mandatory' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('compliance_trainings', [
            'title' => 'Data Protection Awareness',
            'category' => 'data_protection',
        ]);
    }

    public function test_hr_can_assign_training_to_users(): void
    {
        $hr = $this->hrUser();
        $staff1 = $this->staffUser();
        $staff2 = $this->staffUser();
        $training = ComplianceTraining::create([
            'title' => 'Code of Conduct',
            'category' => 'code_of_conduct',
            'is_mandatory' => true,
            'is_active' => true,
        ]);

        $this->actingAs($hr)
            ->post("/compliance/trainings/{$training->id}/assign", [
                'user_ids' => [$staff1->id, $staff2->id],
                'due_at' => now()->addDays(30)->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('compliance_training_assignments', ['training_id' => $training->id, 'user_id' => $staff1->id]);
        $this->assertDatabaseHas('compliance_training_assignments', ['training_id' => $training->id, 'user_id' => $staff2->id]);
    }

    public function test_duplicate_assignment_is_skipped(): void
    {
        $hr = $this->hrUser();
        $staff = $this->staffUser();
        $training = ComplianceTraining::create([
            'title' => 'Cybersecurity', 'category' => 'cybersecurity', 'is_mandatory' => true, 'is_active' => true,
        ]);

        ComplianceTrainingAssignment::create([
            'training_id' => $training->id,
            'user_id' => $staff->id,
            'due_at' => now()->addDays(30)->toDateString(),
            'status' => 'pending',
        ]);

        $this->actingAs($hr)
            ->post("/compliance/trainings/{$training->id}/assign", [
                'user_ids' => [$staff->id],
                'due_at' => now()->addDays(60)->toDateString(),
            ])
            ->assertRedirect();

        $this->assertEquals(
            1,
            ComplianceTrainingAssignment::where('training_id', $training->id)->where('user_id', $staff->id)->count()
        );
    }

    public function test_staff_can_complete_own_training_assignment(): void
    {
        $staff = $this->staffUser();
        $training = ComplianceTraining::create([
            'title' => 'Health & Safety', 'category' => 'health_safety', 'is_mandatory' => true, 'is_active' => true,
        ]);
        ComplianceTrainingAssignment::create([
            'training_id' => $training->id,
            'user_id' => $staff->id,
            'due_at' => now()->addDays(14)->toDateString(),
            'status' => 'pending',
        ]);

        $this->actingAs($staff)
            ->post("/compliance/trainings/{$training->id}/complete", [
                'completion_notes' => 'Completed the online module.',
            ])
            ->assertRedirect();

        $assignment = ComplianceTrainingAssignment::where('training_id', $training->id)->where('user_id', $staff->id)->first();
        $this->assertEquals('completed', $assignment->status);
        $this->assertNotNull($assignment->completed_at);
    }

    public function test_cannot_complete_already_completed_training(): void
    {
        $staff = $this->staffUser();
        $training = ComplianceTraining::create([
            'title' => 'Anti-Bribery', 'category' => 'anti_bribery', 'is_mandatory' => true, 'is_active' => true,
        ]);
        ComplianceTrainingAssignment::create([
            'training_id' => $training->id,
            'user_id' => $staff->id,
            'due_at' => now()->addDays(14)->toDateString(),
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->actingAs($staff)
            ->post("/compliance/trainings/{$training->id}/complete")
            ->assertStatus(422);
    }

    // ── Compliance Policies ───────────────────────────────────────────────────

    public function test_hr_can_create_policy(): void
    {
        $this->actingAs($this->hrUser())
            ->post('/compliance/policies', [
                'title' => 'Remote Work Policy',
                'category' => 'hr',
                'requires_acknowledgement' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('compliance_policies', ['title' => 'Remote Work Policy']);
    }

    public function test_hr_can_publish_policy_version(): void
    {
        $hr = $this->hrUser();
        $policy = $this->makePolicy();

        $this->actingAs($hr)
            ->post("/compliance/policies/{$policy->id}/versions", [
                'version' => '1.0',
                'content' => 'This is the full text of the Remote Work Policy version 1.0.',
            ])
            ->assertRedirect();

        $policy->refresh();
        $this->assertEquals('1.0', $policy->current_version);
        $this->assertDatabaseHas('compliance_policy_versions', [
            'policy_id' => $policy->id,
            'version' => '1.0',
        ]);
    }

    public function test_staff_can_acknowledge_policy(): void
    {
        $staff = $this->staffUser();
        $policy = $this->makePolicy();
        $ver = $this->publishVersion($policy, '1.0');

        $this->actingAs($staff)
            ->post("/compliance/policies/{$policy->id}/acknowledge")
            ->assertRedirect();

        $this->assertDatabaseHas('compliance_policy_acknowledgements', [
            'policy_id' => $policy->id,
            'policy_version_id' => $ver->id,
            'user_id' => $staff->id,
        ]);
    }

    public function test_acknowledging_twice_is_idempotent(): void
    {
        $staff = $this->staffUser();
        $policy = $this->makePolicy();
        $ver = $this->publishVersion($policy, '1.0');

        $this->actingAs($staff)->post("/compliance/policies/{$policy->id}/acknowledge");
        $this->actingAs($staff)->post("/compliance/policies/{$policy->id}/acknowledge");

        $this->assertEquals(
            1,
            CompliancePolicyAcknowledgement::where('policy_version_id', $ver->id)->where('user_id', $staff->id)->count()
        );
    }

    public function test_new_version_requires_re_acknowledgement(): void
    {
        $staff = $this->staffUser();
        $policy = $this->makePolicy();
        $ver1 = $this->publishVersion($policy, '1.0');

        // Acknowledge v1.0
        $this->actingAs($staff)->post("/compliance/policies/{$policy->id}/acknowledge");

        // Publish v2.0
        $ver2 = $this->publishVersion($policy, '2.0');

        $this->assertFalse($policy->fresh()->isAcknowledgedBy($staff));
    }

    public function test_policy_without_version_cannot_be_acknowledged(): void
    {
        $staff = $this->staffUser();
        $policy = $this->makePolicy(['current_version' => null]);

        $this->actingAs($staff)
            ->post("/compliance/policies/{$policy->id}/acknowledge")
            ->assertStatus(422);
    }

    // ── Model unit tests ──────────────────────────────────────────────────────

    public function test_document_is_expired_returns_true_for_past_date(): void
    {
        $doc = new ComplianceDocument(['expires_at' => now()->subDay()]);
        $this->assertTrue($doc->isExpired());
    }

    public function test_document_is_expiring_soon_within_60_days(): void
    {
        $doc = new ComplianceDocument(['expires_at' => now()->addDays(30)]);
        $this->assertTrue($doc->isExpiringSoon());
    }

    public function test_document_is_not_expiring_soon_beyond_60_days(): void
    {
        $doc = new ComplianceDocument(['expires_at' => now()->addDays(90)]);
        $this->assertFalse($doc->isExpiringSoon());
    }

    public function test_dsr_is_overdue_when_past_due_and_not_closed(): void
    {
        $dsr = new DataSubjectRequest([
            'due_at' => now()->subDay(),
            'status' => 'in_progress',
        ]);
        $this->assertTrue($dsr->isOverdue());
    }

    public function test_dsr_is_not_overdue_when_completed(): void
    {
        $dsr = new DataSubjectRequest([
            'due_at' => now()->subDay(),
            'status' => 'completed',
        ]);
        $this->assertFalse($dsr->isOverdue());
    }

    public function test_training_assignment_is_completed(): void
    {
        $a = new ComplianceTrainingAssignment(['status' => 'completed']);
        $this->assertTrue($a->isCompleted());
    }
}
