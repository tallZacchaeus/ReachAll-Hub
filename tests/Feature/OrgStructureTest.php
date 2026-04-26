<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\JobPosition;
use App\Models\OfficeLocation;
use App\Models\User;
use Database\Seeders\OrgStructureSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OrgStructureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(OrgStructureSeeder::class);
    }

    // ── Authentication ───────────────────────────────────────────────────────

    public function test_guest_is_redirected_from_departments(): void
    {
        $this->get('/admin/org/departments')->assertRedirect(route('login'));
    }

    public function test_guest_is_redirected_from_org_chart(): void
    {
        $this->get('/admin/org/chart')->assertRedirect(route('login'));
    }

    // ── Authorisation ────────────────────────────────────────────────────────

    public function test_staff_cannot_access_departments(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'staff']))
            ->get('/admin/org/departments')
            ->assertForbidden();
    }

    public function test_management_cannot_manage_departments(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'management']))
            ->get('/admin/org/departments')
            ->assertForbidden();
    }

    public function test_hr_can_access_departments(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->get('/admin/org/departments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/OrgStructurePage')
                ->has('departments')
                ->has('managers')
                ->where('tab', 'departments')
            );
    }

    public function test_superadmin_can_access_all_org_pages(): void
    {
        $user = User::factory()->create(['role' => 'superadmin']);
        $this->actingAs($user)->get('/admin/org/departments')->assertOk();
        $this->actingAs($user)->get('/admin/org/positions')->assertOk();
        $this->actingAs($user)->get('/admin/org/locations')->assertOk();
        $this->actingAs($user)->get('/admin/org/chart')->assertOk();
    }

    public function test_management_can_view_org_chart(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'management']))
            ->get('/admin/org/chart')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/OrgChartPage')
                ->has('employees')
            );
    }

    // ── Department CRUD ───────────────────────────────────────────────────────

    public function test_hr_can_create_a_department(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->post('/admin/org/departments', [
                'code' => 'ENGR',
                'name' => 'Engineering',
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('departments', ['code' => 'ENGR', 'name' => 'Engineering']);
    }

    public function test_store_department_rejects_duplicate_code(): void
    {
        Department::create(['code' => 'ENGR', 'name' => 'Engineering']);

        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->post('/admin/org/departments', ['code' => 'ENGR', 'name' => 'Another'])
            ->assertSessionHasErrors('code');
    }

    public function test_hr_can_update_a_department(): void
    {
        $dept = Department::create(['code' => 'OPS', 'name' => 'Operations']);

        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->put("/admin/org/departments/{$dept->id}", [
                'code' => 'OPS',
                'name' => 'Operations & Logistics',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('departments', ['id' => $dept->id, 'name' => 'Operations & Logistics']);
    }

    public function test_hr_can_delete_an_empty_department(): void
    {
        $dept = Department::create(['code' => 'TMP', 'name' => 'Temporary']);

        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->delete("/admin/org/departments/{$dept->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('departments', ['id' => $dept->id]);
    }

    public function test_cannot_delete_department_with_employees(): void
    {
        $dept = Department::create(['code' => 'BUSY', 'name' => 'Busy Dept']);
        User::factory()->create(['role' => 'staff', 'department_id' => $dept->id]);

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->delete("/admin/org/departments/{$dept->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('departments', ['id' => $dept->id]);
    }

    public function test_cannot_set_department_as_its_own_parent(): void
    {
        $dept = Department::create(['code' => 'SELF', 'name' => 'Self']);

        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->put("/admin/org/departments/{$dept->id}", [
                'code' => 'SELF',
                'name' => 'Self',
                'parent_department_id' => $dept->id,
            ])
            ->assertSessionHasErrors('parent_department_id');
    }

    // ── Job Position CRUD ─────────────────────────────────────────────────────

    public function test_hr_can_create_a_job_position(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->post('/admin/org/positions', [
                'code' => 'SWE_SEN',
                'title' => 'Senior Software Engineer',
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('job_positions', ['code' => 'SWE_SEN', 'title' => 'Senior Software Engineer']);
    }

    public function test_cannot_delete_position_with_employees(): void
    {
        $pos = JobPosition::create(['code' => 'USED', 'title' => 'Used Position']);
        User::factory()->create(['role' => 'staff', 'job_position_id' => $pos->id]);

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->delete("/admin/org/positions/{$pos->id}")
            ->assertStatus(422);
    }

    // ── Office Location CRUD ──────────────────────────────────────────────────

    public function test_hr_can_create_an_office_location(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->post('/admin/org/locations', [
                'code' => 'IBADAN',
                'name' => 'Ibadan Office',
                'city' => 'Ibadan',
                'state' => 'Oyo',
                'country' => 'Nigeria',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('office_locations', ['code' => 'IBADAN', 'city' => 'Ibadan']);
    }

    public function test_cannot_delete_location_with_employees(): void
    {
        $loc = OfficeLocation::create(['code' => 'BUSY2', 'name' => 'Busy Office', 'country' => 'Nigeria']);
        User::factory()->create(['role' => 'staff', 'office_location_id' => $loc->id]);

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->delete("/admin/org/locations/{$loc->id}")
            ->assertStatus(422);
    }

    // ── Org chart ─────────────────────────────────────────────────────────────

    public function test_org_chart_includes_reports_to_data(): void
    {
        $manager = User::factory()->create(['role' => 'management', 'status' => 'active', 'name' => 'Alpha Manager']);
        $report = User::factory()->create(['role' => 'staff', 'status' => 'active', 'reports_to_id' => $manager->id]);

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->get('/admin/org/chart')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/OrgChartPage')
                ->where('employees', fn ($employees) => collect($employees)->contains('id', $report->id) &&
                    collect($employees)->contains('id', $manager->id)
                )
            );
    }

    // ── User model relationships ──────────────────────────────────────────────

    public function test_user_belongs_to_department_entity(): void
    {
        $dept = Department::create(['code' => 'REL', 'name' => 'Relations']);
        $user = User::factory()->create(['role' => 'staff', 'department_id' => $dept->id]);

        $this->assertEquals($dept->id, $user->fresh()->departmentEntity->id);
    }

    public function test_user_reports_to_manager(): void
    {
        $manager = User::factory()->create(['role' => 'management']);
        $report = User::factory()->create(['role' => 'staff', 'reports_to_id' => $manager->id]);

        $this->assertEquals($manager->id, $report->fresh()->manager->id);
        $this->assertTrue($manager->directReports()->where('id', $report->id)->exists());
    }
}
