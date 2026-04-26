<?php

namespace Tests\Feature;

use App\Models\HrCase;
use App\Models\HrCaseNote;
use App\Models\HrCaseParty;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeRelationsTest extends TestCase
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

    private function makeCase(array $attrs = []): HrCase
    {
        $hr = $this->hrUser();

        return HrCase::create(array_merge([
            'type' => 'helpdesk',
            'subject' => 'Test case',
            'description' => 'Some description.',
            'priority' => 'normal',
            'status' => 'open',
        ], $attrs));
    }

    // ── Auth and access ───────────────────────────────────────────────────────

    public function test_guest_cannot_access_cases(): void
    {
        $this->get('/employee-relations/cases')->assertRedirect('/login');
    }

    public function test_staff_cannot_access_case_management(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/employee-relations/cases')
            ->assertStatus(403);
    }

    public function test_hr_can_access_case_management(): void
    {
        $this->actingAs($this->hrUser())
            ->get('/employee-relations/cases')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('EmployeeRelations/CaseManagementPage'));
    }

    public function test_staff_can_access_my_cases(): void
    {
        $this->actingAs($this->staffUser())
            ->get('/employee-relations/my-cases')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('EmployeeRelations/MyCasesPage'));
    }

    // ── Case number auto-generation ──────────────────────────────────────────

    public function test_case_number_auto_generated_on_create(): void
    {
        $case = $this->makeCase();
        $this->assertMatchesRegularExpression('/^ER-\d{4}-\d{4}$/', $case->case_number);
    }

    public function test_sequential_case_numbers_are_unique(): void
    {
        $a = $this->makeCase();
        $b = $this->makeCase();
        $this->assertNotEquals($a->case_number, $b->case_number);
    }

    // ── HR creates and manages cases ─────────────────────────────────────────

    public function test_hr_can_open_a_case(): void
    {
        $hr = $this->hrUser();
        $staff = $this->staffUser();

        $this->actingAs($hr)
            ->post('/employee-relations/cases', [
                'type' => 'grievance',
                'subject' => 'Pay dispute',
                'description' => 'Employee disputes pay calculation.',
                'priority' => 'high',
                'reported_by_id' => $staff->id,
            ])
            ->assertRedirect();

        $case = HrCase::first();
        $this->assertNotNull($case);
        $this->assertEquals('grievance', $case->type);
        $this->assertEquals('open', $case->status);
        $this->assertEquals($staff->id, $case->reported_by_id);

        // Complainant party auto-added
        $this->assertDatabaseHas('hr_case_parties', [
            'hr_case_id' => $case->id,
            'user_id' => $staff->id,
            'role' => 'complainant',
        ]);
    }

    public function test_whistleblower_case_is_automatically_confidential(): void
    {
        $hr = $this->hrUser();

        $this->actingAs($hr)
            ->post('/employee-relations/cases', [
                'type' => 'whistleblower',
                'subject' => 'Policy violation',
                'description' => 'Observed misconduct.',
                'priority' => 'high',
            ])
            ->assertRedirect();

        $case = HrCase::first();
        $this->assertTrue((bool) $case->confidential);
    }

    public function test_hr_can_update_case_status(): void
    {
        $hr = $this->hrUser();
        $case = $this->makeCase();

        $this->actingAs($hr)
            ->put("/employee-relations/cases/{$case->id}", [
                'status' => 'under_review',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('hr_cases', ['id' => $case->id, 'status' => 'under_review']);
    }

    public function test_resolving_case_sets_resolved_at(): void
    {
        $hr = $this->hrUser();
        $case = $this->makeCase();

        $this->actingAs($hr)
            ->put("/employee-relations/cases/{$case->id}", [
                'status' => 'resolved',
                'outcome' => 'Issue addressed and resolved.',
            ])
            ->assertRedirect();

        $case->refresh();
        $this->assertEquals('resolved', $case->status);
        $this->assertNotNull($case->resolved_at);
        $this->assertEquals('Issue addressed and resolved.', $case->outcome);
    }

    public function test_hr_can_assign_investigator(): void
    {
        $hr = $this->hrUser();
        $investigator = $this->managementUser();
        $case = $this->makeCase();

        $this->actingAs($hr)
            ->put("/employee-relations/cases/{$case->id}", [
                'assigned_to_id' => $investigator->id,
                'status' => 'investigating',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('hr_cases', [
            'id' => $case->id,
            'assigned_to_id' => $investigator->id,
            'status' => 'investigating',
        ]);
    }

    // ── Parties ───────────────────────────────────────────────────────────────

    public function test_hr_can_add_party_to_case(): void
    {
        $hr = $this->hrUser();
        $staff = $this->staffUser();
        $case = $this->makeCase();

        $this->actingAs($hr)
            ->post("/employee-relations/cases/{$case->id}/parties", [
                'user_id' => $staff->id,
                'role' => 'respondent',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('hr_case_parties', [
            'hr_case_id' => $case->id,
            'user_id' => $staff->id,
            'role' => 'respondent',
        ]);
    }

    public function test_duplicate_party_role_is_silently_deduplicated(): void
    {
        $hr = $this->hrUser();
        $staff = $this->staffUser();
        $case = $this->makeCase();

        HrCaseParty::create([
            'hr_case_id' => $case->id,
            'user_id' => $staff->id,
            'role' => 'respondent',
        ]);

        $this->actingAs($hr)
            ->post("/employee-relations/cases/{$case->id}/parties", [
                'user_id' => $staff->id,
                'role' => 'respondent',
            ])
            ->assertRedirect();

        $this->assertEquals(
            1,
            HrCaseParty::where('hr_case_id', $case->id)->where('user_id', $staff->id)->count()
        );
    }

    public function test_hr_can_remove_party(): void
    {
        $hr = $this->hrUser();
        $staff = $this->staffUser();
        $case = $this->makeCase();
        $party = HrCaseParty::create([
            'hr_case_id' => $case->id,
            'user_id' => $staff->id,
            'role' => 'witness',
        ]);

        $this->actingAs($hr)
            ->delete("/employee-relations/cases/{$case->id}/parties/{$party->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('hr_case_parties', ['id' => $party->id]);
    }

    // ── Notes ────────────────────────────────────────────────────────────────

    public function test_hr_can_add_internal_note(): void
    {
        $hr = $this->hrUser();
        $case = $this->makeCase();

        $this->actingAs($hr)
            ->post("/employee-relations/cases/{$case->id}/notes", [
                'content' => 'Internal assessment.',
                'is_internal' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('hr_case_notes', [
            'hr_case_id' => $case->id,
            'content' => 'Internal assessment.',
            'is_internal' => 1,
            'author_id' => $hr->id,
        ]);
    }

    public function test_investigator_cannot_add_internal_note(): void
    {
        $investigator = $this->managementUser();
        $case = $this->makeCase(['assigned_to_id' => $investigator->id]);

        $this->actingAs($investigator)
            ->post("/employee-relations/cases/{$case->id}/notes", [
                'content' => 'My observation.',
                'is_internal' => true,  // should be stripped
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('hr_case_notes', [
            'hr_case_id' => $case->id,
            'is_internal' => 0,
        ]);
    }

    public function test_hr_can_delete_note(): void
    {
        $hr = $this->hrUser();
        $case = $this->makeCase();
        $note = HrCaseNote::create([
            'hr_case_id' => $case->id,
            'author_id' => $hr->id,
            'content' => 'To be deleted.',
            'is_internal' => false,
        ]);

        $this->actingAs($hr)
            ->delete("/employee-relations/cases/{$case->id}/notes/{$note->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('hr_case_notes', ['id' => $note->id]);
    }

    // ── Employee self-service ─────────────────────────────────────────────────

    public function test_staff_can_submit_helpdesk_ticket(): void
    {
        $staff = $this->staffUser();

        $this->actingAs($staff)
            ->post('/employee-relations/my-cases', [
                'type' => 'helpdesk',
                'subject' => 'IT issue',
                'description' => 'My laptop won\'t connect to VPN.',
                'priority' => 'normal',
                'anonymous' => false,
            ])
            ->assertRedirect();

        $case = HrCase::first();
        $this->assertNotNull($case);
        $this->assertEquals('helpdesk', $case->type);
        $this->assertEquals($staff->id, $case->reported_by_id);
        $this->assertFalse((bool) $case->confidential);
    }

    public function test_staff_can_submit_anonymous_whistleblower(): void
    {
        $staff = $this->staffUser();

        $this->actingAs($staff)
            ->post('/employee-relations/my-cases', [
                'type' => 'whistleblower',
                'subject' => 'Financial irregularity',
                'description' => 'I observed suspicious behaviour.',
                'priority' => 'normal',
                'anonymous' => true,
            ])
            ->assertRedirect();

        $case = HrCase::first();
        $this->assertNull($case->reported_by_id);
        $this->assertTrue((bool) $case->confidential);
    }

    public function test_staff_cannot_view_another_persons_case(): void
    {
        $staff = $this->staffUser();
        $other = $this->staffUser();
        $case = $this->makeCase(['reported_by_id' => $other->id]);

        $this->actingAs($staff)
            ->get("/employee-relations/my-cases/{$case->id}")
            ->assertStatus(403);
    }

    public function test_staff_can_add_note_to_own_open_case(): void
    {
        $staff = $this->staffUser();
        $case = HrCase::create([
            'type' => 'helpdesk',
            'subject' => 'My issue',
            'description' => 'Details.',
            'priority' => 'normal',
            'status' => 'open',
            'reported_by_id' => $staff->id,
        ]);

        $this->actingAs($staff)
            ->post("/employee-relations/my-cases/{$case->id}/notes", [
                'content' => 'Additional detail.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('hr_case_notes', [
            'hr_case_id' => $case->id,
            'author_id' => $staff->id,
            'is_internal' => 0,
        ]);
    }

    public function test_staff_cannot_note_on_resolved_case(): void
    {
        $staff = $this->staffUser();
        $case = HrCase::create([
            'type' => 'helpdesk',
            'subject' => 'Done',
            'description' => 'Resolved.',
            'priority' => 'normal',
            'status' => 'resolved',
            'reported_by_id' => $staff->id,
        ]);

        $this->actingAs($staff)
            ->post("/employee-relations/my-cases/{$case->id}/notes", [
                'content' => 'Too late.',
            ])
            ->assertStatus(422);
    }

    // ── Access control for case detail ────────────────────────────────────────

    public function test_investigator_can_view_assigned_case(): void
    {
        $investigator = $this->managementUser();
        $case = $this->makeCase(['assigned_to_id' => $investigator->id]);

        $this->actingAs($investigator)
            ->get("/employee-relations/cases/{$case->id}")
            ->assertOk();
    }

    public function test_investigator_cannot_view_unassigned_case(): void
    {
        $investigator = $this->managementUser();
        $case = $this->makeCase(); // assigned_to_id = null

        $this->actingAs($investigator)
            ->get("/employee-relations/cases/{$case->id}")
            ->assertStatus(403);
    }

    // ── Model unit tests ──────────────────────────────────────────────────────

    public function test_is_open_returns_false_for_resolved(): void
    {
        $case = new HrCase(['status' => 'resolved']);
        $this->assertFalse($case->isOpen());
    }

    public function test_is_open_returns_true_for_open(): void
    {
        $case = new HrCase(['status' => 'open']);
        $this->assertTrue($case->isOpen());
    }

    public function test_is_open_returns_false_for_dismissed(): void
    {
        $case = new HrCase(['status' => 'dismissed']);
        $this->assertFalse($case->isOpen());
    }
}
