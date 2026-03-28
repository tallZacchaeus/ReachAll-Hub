<?php

namespace Tests\Feature;

use App\Models\ResourceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ResourceRequestsTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_create_and_comment_on_resource_requests(): void
    {
        $staff = User::factory()->create([
            'employee_id' => 'EMP101',
            'role' => 'staff',
        ]);

        $this->actingAs($staff)
            ->from(route('requests'))
            ->post(route('requests.store'), [
                'type' => 'funds',
                'title' => 'Purchase interview kits',
                'description' => 'Need branded packs for technical interview sessions.',
                'amount' => 450,
                'project' => 'Hiring Sprint',
                'taggedPerson' => 'Vendor One',
            ])
            ->assertRedirect(route('requests'));

        $resourceRequest = ResourceRequest::first();

        $this->assertNotNull($resourceRequest);
        $this->assertSame('pending', $resourceRequest->status);

        $this->actingAs($staff)
            ->from(route('requests'))
            ->post(route('requests.comments.store', $resourceRequest), [
                'content' => 'Adding the vendor quote later today.',
            ])
            ->assertRedirect(route('requests'));

        $this->assertDatabaseHas('resource_request_comments', [
            'resource_request_id' => $resourceRequest->id,
            'user_id' => $staff->id,
            'content' => 'Adding the vendor quote later today.',
        ]);
    }

    public function test_admin_can_view_and_review_resource_requests(): void
    {
        $admin = User::factory()->create([
            'employee_id' => 'EMP001',
            'role' => 'hr',
        ]);

        $staff = User::factory()->create([
            'employee_id' => 'EMP201',
            'role' => 'staff',
        ]);

        $resourceRequest = ResourceRequest::create([
            'user_id' => $staff->id,
            'type' => 'equipment',
            'title' => 'Laptop stand refresh',
            'description' => 'Workstation accessory refresh for the new desk setup.',
            'amount' => 120,
            'project' => 'Ops Support',
            'status' => 'pending',
            'attachments' => [],
            'receipts' => [],
        ]);

        $this->actingAs($admin)
            ->get(route('requests'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('RequestsPage')
                ->has('requests', 1)
                ->where('requests.0.id', (string) $resourceRequest->id)
            );

        $this->actingAs($admin)
            ->from(route('requests'))
            ->patch(route('requests.status', $resourceRequest), [
                'status' => 'approved',
                'comment' => 'Approved for this sprint.',
            ])
            ->assertRedirect(route('requests'));

        $this->assertDatabaseHas('resource_requests', [
            'id' => $resourceRequest->id,
            'status' => 'approved',
            'reviewed_by_user_id' => $admin->id,
        ]);

        $this->assertDatabaseHas('resource_request_comments', [
            'resource_request_id' => $resourceRequest->id,
            'user_id' => $admin->id,
            'content' => 'Approved for this sprint.',
        ]);
    }
}
