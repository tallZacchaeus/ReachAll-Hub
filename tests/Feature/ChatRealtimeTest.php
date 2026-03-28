<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ChatRealtimeTest extends TestCase
{
    use RefreshDatabase;

    public function test_conversation_participants_can_send_messages_and_dispatch_realtime_events(): void
    {
        Event::fake([MessageSent::class]);

        $sender = User::factory()->create([
            'employee_id' => 'EMP301',
            'role' => 'staff',
            'department' => 'Engineering',
        ]);

        $recipient = User::factory()->create([
            'employee_id' => 'EMP302',
            'role' => 'staff',
            'department' => 'Engineering',
        ]);

        $conversation = Conversation::create([
            'type' => 'group',
            'name' => 'Engineering Delivery',
            'department' => 'Engineering',
            'is_read_only' => false,
            'is_global' => false,
        ]);

        $conversation->participants()->attach([$sender->id, $recipient->id]);

        $response = $this->actingAs($sender)
            ->postJson("/api/chat/conversations/{$conversation->id}/messages", [
                'content' => 'Realtime smoke test',
            ]);

        $response->assertOk()
            ->assertJsonPath('content', 'Realtime smoke test')
            ->assertJsonPath('authorUserId', $sender->id)
            ->assertJsonPath('conversationId', $conversation->id);

        $message = Message::query()->firstOrFail();

        Event::assertDispatched(MessageSent::class, function (MessageSent $event) use ($conversation, $message, $sender): bool {
            return $event->conversationId === $conversation->id
                && $event->action === 'created'
                && ($event->message['id'] ?? null) === $message->id
                && ($event->message['content'] ?? null) === 'Realtime smoke test'
                && $event->actorUserId === $sender->id;
        });
    }

    public function test_typing_endpoint_dispatches_realtime_event_for_authorized_users(): void
    {
        Event::fake([UserTyping::class]);

        $user = User::factory()->create([
            'employee_id' => 'EMP303',
            'role' => 'staff',
            'department' => 'Design',
        ]);

        $otherUser = User::factory()->create([
            'employee_id' => 'EMP304',
            'role' => 'staff',
            'department' => 'Design',
        ]);

        $conversation = Conversation::create([
            'type' => 'direct',
            'name' => null,
            'is_read_only' => false,
            'is_global' => false,
        ]);

        $conversation->participants()->attach([$user->id, $otherUser->id]);

        $this->actingAs($user)
            ->postJson("/api/chat/conversations/{$conversation->id}/typing")
            ->assertOk()
            ->assertJsonPath('status', 'ok');

        Event::assertDispatched(UserTyping::class, function (UserTyping $event) use ($conversation, $user): bool {
            return $event->conversationId === $conversation->id
                && $event->userId === $user->id
                && $event->userName === $user->name;
        });
    }

    public function test_users_cannot_interact_with_conversations_they_do_not_have_access_to(): void
    {
        Event::fake([UserTyping::class]);

        $member = User::factory()->create([
            'employee_id' => 'EMP305',
            'role' => 'staff',
            'department' => 'People Operations',
        ]);

        $outsider = User::factory()->create([
            'employee_id' => 'EMP306',
            'role' => 'staff',
            'department' => 'Finance',
        ]);

        $conversation = Conversation::create([
            'type' => 'group',
            'name' => 'People Ops',
            'department' => 'People Operations',
            'is_read_only' => false,
            'is_global' => false,
        ]);

        $conversation->participants()->attach([$member->id]);

        $this->actingAs($outsider)
            ->postJson("/api/chat/conversations/{$conversation->id}/typing")
            ->assertForbidden();

        Event::assertNotDispatched(UserTyping::class);
    }
}
