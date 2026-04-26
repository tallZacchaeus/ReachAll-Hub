<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeLeader(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'superadmin',
            'department' => 'Engineering',
            'status' => 'active',
        ], $overrides));
    }

    public function test_team_dashboard_requires_authentication()
    {
        $this->get(route('team'))->assertRedirect(route('login'));
    }

    public function test_team_dashboard_forbids_users_without_permission()
    {
        $user = User::factory()->create(['role' => 'staff', 'status' => 'active']);

        $this->actingAs($user);

        $this->get(route('team'))->assertForbidden();
    }

    public function test_team_dashboard_loads_for_authorised_user()
    {
        $leader = $this->makeLeader();

        $this->actingAs($leader);

        $this->get(route('team'))->assertOk();
    }

    public function test_team_dashboard_counts_only_active_teammates()
    {
        $leader = $this->makeLeader();

        // Two active teammates
        User::factory()->count(2)->create([
            'department' => 'Engineering',
            'status' => 'active',
        ]);

        // One inactive teammate — must NOT be included
        User::factory()->create([
            'department' => 'Engineering',
            'status' => 'inactive',
        ]);

        $this->actingAs($leader);

        $response = $this->get(route('team'));
        $response->assertOk();

        $props = $response->original->getData()['page']['props'];
        $this->assertSame(2, $props['teamSize']);
        $this->assertCount(2, $props['members']);
    }

    public function test_inactive_users_do_not_appear_in_member_stats()
    {
        $leader = $this->makeLeader();

        $inactive = User::factory()->create([
            'name' => 'Inactive Person',
            'department' => 'Engineering',
            'status' => 'inactive',
        ]);

        $this->actingAs($leader);

        $response = $this->get(route('team'));
        $response->assertOk();

        $props = $response->original->getData()['page']['props'];
        $memberIds = collect($props['members'])->pluck('id')->all();

        $this->assertNotContains($inactive->id, $memberIds);
    }
}
