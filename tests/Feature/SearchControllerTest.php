<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_returns_active_users_in_people_results()
    {
        $searcher = User::factory()->create(['status' => 'active']);

        $match = User::factory()->create([
            'name' => 'Alice ActiveUser',
            'status' => 'active',
        ]);

        $this->actingAs($searcher);

        $response = $this->get(route('search', ['q' => 'Alice']));
        $response->assertOk();

        $props = $response->original->getData()['page']['props'];
        $results = collect($props['results']);

        $people = $results->firstWhere('type', 'People');
        $this->assertNotNull($people, 'Expected a People results group');

        $ids = collect($people['items'])->pluck('id')->all();
        $this->assertContains($match->id, $ids);
    }

    public function test_search_excludes_inactive_users_from_people_results()
    {
        $searcher = User::factory()->create(['status' => 'active']);

        User::factory()->create([
            'name' => 'Bob InactiveUser',
            'status' => 'inactive',
        ]);

        $this->actingAs($searcher);

        $response = $this->get(route('search', ['q' => 'Bob']));
        $response->assertOk();

        $props = $response->original->getData()['page']['props'];
        $results = collect($props['results']);

        $people = $results->firstWhere('type', 'People');
        $this->assertNull($people, 'Inactive user should not appear in People results');
    }

    public function test_search_requires_authentication()
    {
        $this->get(route('search', ['q' => 'test']))->assertRedirect(route('login'));
    }

    public function test_short_query_returns_no_results()
    {
        $this->actingAs(User::factory()->create());

        $response = $this->get(route('search', ['q' => 'a']));
        $response->assertOk();

        $props = $response->original->getData()['page']['props'];
        $this->assertEmpty($props['results']);
    }
}
