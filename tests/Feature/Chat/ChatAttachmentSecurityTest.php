<?php

namespace Tests\Feature\Chat;

use App\Console\Commands\Chat\MigrateAttachments;
use App\Models\AuditLog;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * SEC-02: Authorization + storage-disk regression tests for chat attachments.
 *
 * Covers:
 *  - Upload is rejected for disallowed MIME types (.php / .html / .exe)
 *  - Upload writes to the private 'chat' disk, never 'public'
 *  - Authenticated participant can stream their own conversation's attachment
 *  - Non-participant gets 403 from the new download route (Decision A —
 *    strict revoke; ex-participants lose access immediately on removal)
 *  - Unauthenticated GET to the legacy /storage/<path> URL no longer hits
 *    the new endpoint (route is auth-required)
 *  - chat:migrate-attachments moves a public-disk attachment to the chat disk
 *    and writes ONE summary AuditLog row
 */
class ChatAttachmentSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        Storage::fake('chat');
        Storage::fake('public');
    }

    public function test_upload_rejects_disallowed_mime_types(): void
    {
        $sender = User::factory()->create(['role' => 'staff']);
        $conversation = $this->makeDirectConversationFor($sender);

        $exe = UploadedFile::fake()->createWithContent('payload.php', '<?php echo "rce"; ?>');

        $response = $this->actingAs($sender)
            ->postJson("/api/chat/conversations/{$conversation->id}/upload", [
                'file' => $exe,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['file']);
    }

    public function test_upload_writes_to_private_chat_disk_not_public(): void
    {
        $sender = User::factory()->create(['role' => 'staff']);
        $conversation = $this->makeDirectConversationFor($sender);

        $pdf = UploadedFile::fake()->create('memo.pdf', 32, 'application/pdf');

        $response = $this->actingAs($sender)
            ->postJson("/api/chat/conversations/{$conversation->id}/upload", [
                'file' => $pdf,
            ]);

        $response->assertOk();

        $message = Message::query()->latest('id')->firstOrFail();
        $this->assertSame('chat', $message->attachment_disk);
        $this->assertStringStartsWith("conversations/{$conversation->id}/", $message->attachment_path);

        // Bytes must live on the private chat disk, never on the public one.
        Storage::disk('chat')->assertExists($message->attachment_path);
        Storage::disk('public')->assertMissing($message->attachment_path);

        // Serialized payload must point at the authenticated route, not at /storage/.
        $response->assertJsonPath('attachment.path', route('chat.attachments.show', ['message' => $message->id]));
    }

    public function test_participant_can_stream_attachment(): void
    {
        [$sender, $conversation, $message] = $this->makeAttachmentScenario();

        $this->actingAs($sender)
            ->get(route('chat.attachments.show', ['message' => $message->id]))
            ->assertOk()
            ->assertHeader('content-disposition');
    }

    public function test_non_participant_gets_403(): void
    {
        [, $conversation, $message] = $this->makeAttachmentScenario();
        $outsider = User::factory()->create(['role' => 'staff']);

        $this->actingAs($outsider)
            ->get(route('chat.attachments.show', ['message' => $message->id]))
            ->assertForbidden();
    }

    public function test_ex_participant_revoked_immediately(): void
    {
        // Decision A — strict revoke.
        [, $conversation, $message] = $this->makeAttachmentScenario();
        $other = User::factory()->create(['role' => 'staff']);
        $conversation->participants()->attach($other->id);

        $this->actingAs($other)
            ->get(route('chat.attachments.show', ['message' => $message->id]))
            ->assertOk();

        // Remove from conversation — should lose access immediately.
        $conversation->participants()->detach($other->id);

        $this->actingAs($other)
            ->get(route('chat.attachments.show', ['message' => $message->id]))
            ->assertForbidden();
    }

    public function test_unauthenticated_request_redirected_to_login(): void
    {
        [, , $message] = $this->makeAttachmentScenario();

        $this->get(route('chat.attachments.show', ['message' => $message->id]))
            ->assertRedirect('/login');
    }

    public function test_chat_admin_can_stream_any_attachment(): void
    {
        [, , $message] = $this->makeAttachmentScenario();
        $admin = User::factory()->create(['role' => 'superadmin']);

        $this->actingAs($admin)
            ->get(route('chat.attachments.show', ['message' => $message->id]))
            ->assertOk();
    }

    public function test_migrate_attachments_moves_public_files_to_chat_disk_and_writes_summary_audit_log(): void
    {
        $sender = User::factory()->create(['role' => 'staff']);
        $conversation = $this->makeDirectConversationFor($sender);

        // Simulate a legacy attachment on the public disk.
        Storage::disk('public')->put('chat-attachments/legacy.pdf', 'legacy-bytes');
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $sender->id,
            'content' => 'Sent a file: legacy.pdf',
            'attachment_path' => 'chat-attachments/legacy.pdf',
            'attachment_disk' => 'public',
            'attachment_name' => 'legacy.pdf',
            'attachment_type' => 'document',
            'attachment_size' => 12,
        ]);

        $auditBefore = AuditLog::count();

        $this->artisan(MigrateAttachments::class)
            ->assertSuccessful();

        $message->refresh();
        $this->assertSame('chat', $message->attachment_disk);
        $this->assertSame("conversations/{$conversation->id}/legacy.pdf", $message->attachment_path);
        Storage::disk('chat')->assertExists($message->attachment_path);

        // Per-run summary, not per-file — exactly one new audit row.
        $this->assertSame($auditBefore + 1, AuditLog::count());
        $audit = AuditLog::latest('id')->first();
        $this->assertSame('chat', $audit->module);
        $this->assertSame('attachments.migrated', $audit->action);
        $this->assertSame(1, $audit->new_json['moved']);
    }

    /**
     * @return array{0: User, 1: Conversation, 2: Message}
     */
    private function makeAttachmentScenario(): array
    {
        $sender = User::factory()->create(['role' => 'staff']);
        $conversation = $this->makeDirectConversationFor($sender);

        Storage::disk('chat')->put("conversations/{$conversation->id}/memo.pdf", 'pdf-bytes');

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $sender->id,
            'content' => 'Sent a file: memo.pdf',
            'attachment_path' => "conversations/{$conversation->id}/memo.pdf",
            'attachment_disk' => 'chat',
            'attachment_name' => 'memo.pdf',
            'attachment_type' => 'document',
            'attachment_size' => 9,
        ]);

        return [$sender, $conversation, $message];
    }

    private function makeDirectConversationFor(User $user): Conversation
    {
        $other = User::factory()->create(['role' => 'staff']);
        $conversation = Conversation::create(['type' => 'direct']);
        $conversation->participants()->attach([$user->id, $other->id]);

        return $conversation;
    }
}
