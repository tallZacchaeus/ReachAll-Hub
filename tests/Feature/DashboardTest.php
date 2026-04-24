<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get(route('dashboard'))->assertOk();
    }

    public function test_leader_dashboard_team_size_counts_only_active_users()
    {
        $leader = User::factory()->create([
            'role'           => 'superadmin',
            'employee_stage' => 'leader',
            'department'     => 'Engineering',
            'status'         => 'active',
        ]);

        // Active teammate — should be counted
        User::factory()->create([
            'department' => 'Engineering',
            'status'     => 'active',
        ]);

        // Inactive teammate — must NOT be counted
        User::factory()->create([
            'department' => 'Engineering',
            'status'     => 'inactive',
        ]);

        $this->actingAs($leader);

        $response = $this->get(route('dashboard'));
        $response->assertOk();

        $props = $response->original->getData()['page']['props'];
        $this->assertSame(1, $props['teamSize']);
    }
}
