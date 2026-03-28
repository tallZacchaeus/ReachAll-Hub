<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    public function getConversations(Request $request)
    {
        $user = $request->user();
        $isAdmin = $this->isAdmin($user);

        // Get all conversations the user has access to
        $conversationQuery = Conversation::with(['latestMessage.user:id,name', 'participants:id']);

        if (! $isAdmin) {
            // Staff can only see global conversations and their team chat
            $conversationQuery->where(function ($query) use ($user) {
                $query->where('is_global', true)
                    ->orWhereHas('participants', function ($participantQuery) use ($user) {
                        $participantQuery->where('user_id', $user->id);
                    });
            });
        }

        $conversations = $conversationQuery
            ->get()
            ->map(function (Conversation $conversation) use ($user) {
                $latestMessage = $conversation->latestMessage;

                return [
                    'id' => $conversation->id,
                    'type' => $conversation->type,
                    'name' => $conversation->name,
                    'department' => $conversation->department,
                    'is_read_only' => $conversation->is_read_only,
                    'is_global' => $conversation->is_global,
                    'unread' => $conversation->getUnreadCountForUser($user->id),
                    'last_message' => $latestMessage ? $this->buildConversationPreview($latestMessage) : 'No messages yet',
                    'last_message_time' => $latestMessage ? $latestMessage->created_at->diffForHumans() : null,
                ];
            });

        return response()->json($conversations);
    }

    public function getMessages(Request $request, $conversationId)
    {
        $user = $request->user();

        $conversation = Conversation::with(['messages.user', 'messages.reactions.user', 'participants'])
            ->findOrFail($conversationId);

        if (! $this->userHasAccessToConversation($conversation, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = $conversation->messages
            ->map(fn (Message $message): array => $this->serializeMessage($message, $user))
            ->values();

        // Mark messages as read
        if ($conversation->participants()->whereKey($user->id)->exists()) {
            $conversation->participants()->updateExistingPivot($user->id, [
                'last_read_at' => now(),
            ]);
        }

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'name' => $conversation->name,
                'type' => $conversation->type,
                'is_read_only' => $conversation->is_read_only,
                'department' => $conversation->department,
            ],
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request, $conversationId)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $user = $request->user();
        $conversation = Conversation::with('participants')->findOrFail($conversationId);

        // Check if conversation is read-only
        $isAdmin = $this->isAdmin($user);
        if ($conversation->is_read_only && ! $isAdmin) {
            return response()->json(['error' => 'This conversation is read-only'], 403);
        }

        if (! $this->userHasAccessToConversation($conversation, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $message = Message::create([
            'conversation_id' => $conversationId,
            'user_id' => $user->id,
            'content' => $request->input('content'),
        ]);

        // Update last_read_at for the sender
        if ($conversation->participants()->whereKey($user->id)->exists()) {
            $conversation->participants()->updateExistingPivot($user->id, [
                'last_read_at' => now(),
            ]);
        }

        $payload = $this->serializeMessage($message);
        $response = $this->serializeMessage($message, $user);

        MessageSent::dispatch($conversation->id, 'created', $payload, $user->id);

        return response()->json($response);
    }

    public function getDirectMessages(Request $request)
    {
        $user = $request->user();

        // Get all users except the current user
        $users = User::where('id', '!=', $user->id)
            ->get()
            ->map(function ($otherUser) use ($user) {
                // Find or create a direct conversation between these two users
                $conversation = $this->findOrCreateDirectConversation($user->id, $otherUser->id);
                $latestMessage = $conversation->latestMessage;
                
                return [
                    'id' => 'dm-' . $conversation->id,
                    'conversation_id' => $conversation->id,
                    'user_id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'department' => $otherUser->department ?? 'Unknown',
                    'position' => $otherUser->position ?? 'Staff',
                    'avatar' => $this->getInitials($otherUser->name),
                    'unread' => $conversation->getUnreadCountForUser($user->id),
                    'last_message' => $latestMessage ? $latestMessage->content : 'No messages yet',
                    'timestamp' => $latestMessage ? $latestMessage->created_at->diffForHumans() : 'Never',
                    'isOnline' => false, // Can be enhanced with presence tracking
                ];
            });

        return response()->json($users);
    }

    public function createConversation(Request $request)
    {
        $request->validate([
            'type' => 'required|in:direct,group',
            'name' => 'required_if:type,group|string|max:255',
            'department' => 'nullable|string|max:255',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'exists:users,id',
        ]);

        $user = $request->user();

        $conversation = Conversation::create([
            'type' => $request->type,
            'name' => $request->name,
            'department' => $request->department,
            'is_read_only' => false,
            'is_global' => false,
        ]);

        // Add participants
        $participantIds = array_values(array_unique(array_merge($request->participant_ids, [$user->id])));
        $conversation->participants()->attach($participantIds);

        return response()->json([
            'id' => $conversation->id,
            'message' => 'Conversation created successfully',
        ]);
    }

    private function findOrCreateDirectConversation($userId1, $userId2)
    {
        // Find existing direct conversation between these two users
        $conversation = Conversation::where('type', 'direct')
            ->whereHas('participants', function ($query) use ($userId1) {
                $query->where('user_id', $userId1);
            })
            ->whereHas('participants', function ($query) use ($userId2) {
                $query->where('user_id', $userId2);
            })
            ->first();

        if (!$conversation) {
            // Create new direct conversation
            $conversation = Conversation::create([
                'type' => 'direct',
                'name' => null,
                'is_read_only' => false,
                'is_global' => false,
            ]);

            $conversation->participants()->attach([$userId1, $userId2]);
        }

        $conversation->load('latestMessage');
        return $conversation;
    }

    private function getInitials($name)
    {
        $words = explode(' ', $name);
        $initials = '';
        
        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper($word[0]);
            }
        }
        
        return substr($initials, 0, 2);
    }

    // Message Reactions
    public function addReaction(Request $request, $messageId)
    {
        $request->validate([
            'emoji' => 'required|string|max:10',
        ]);

        $user = $request->user();
        $message = Message::with('conversation')->findOrFail($messageId);

        // Check if user has access to this conversation
        $conversation = $message->conversation;
        if (! $this->userHasAccessToConversation($conversation, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Toggle reaction (add if doesn't exist, remove if exists)
        $existing = MessageReaction::where([
            'message_id' => $messageId,
            'user_id' => $user->id,
            'emoji' => $request->emoji,
        ])->first();

        if ($existing) {
            $existing->delete();
            $action = 'removed';
        } else {
            MessageReaction::create([
                'message_id' => $messageId,
                'user_id' => $user->id,
                'emoji' => $request->emoji,
            ]);
            $action = 'added';
        }

        $message->unsetRelation('reactions');
        $payload = $this->serializeMessage($message);
        $response = $this->serializeMessage($message, $user);

        MessageSent::dispatch($conversation->id, 'reactions', $payload, $user->id);

        return response()->json([
            'action' => $action,
            'message' => $response,
        ]);
    }

    // Edit Message
    public function editMessage(Request $request, $messageId)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $user = $request->user();
        $message = Message::with('conversation')->findOrFail($messageId);

        // Only the message author can edit
        if ($message->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $message->update([
            'content' => $request->input('content'),
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        $payload = $this->serializeMessage($message);
        $response = $this->serializeMessage($message, $user);

        MessageSent::dispatch($message->conversation_id, 'updated', $payload, $user->id);

        return response()->json($response);
    }

    // Delete Message
    public function deleteMessage(Request $request, $messageId)
    {
        $user = $request->user();
        $message = Message::findOrFail($messageId);

        // Only the message author can delete
        if ($message->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $conversationId = $message->conversation_id;
        $deletedMessageId = $message->id;

        $message->delete();

        MessageSent::dispatch($conversationId, 'deleted', [
            'id' => $deletedMessageId,
            'conversationId' => $conversationId,
        ], $user->id);

        return response()->json([
            'id' => $deletedMessageId,
            'conversation_id' => $conversationId,
            'message' => 'Message deleted successfully',
        ]);
    }

    // Typing Indicator
    public function typing(Request $request, $conversationId)
    {
        $user = $request->user();
        $conversation = Conversation::with('participants:id')->findOrFail($conversationId);

        if (! $this->userHasAccessToConversation($conversation, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        UserTyping::dispatch($conversation->id, $user->id, $user->name);

        return response()->json([
            'status' => 'ok',
        ]);
    }

    // Search Messages
    public function searchMessages(Request $request, $conversationId)
    {
        $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $user = $request->user();
        $conversation = Conversation::findOrFail($conversationId);

        if (! $this->userHasAccessToConversation($conversation, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = Message::where('conversation_id', $conversationId)
            ->where('content', 'like', '%' . $request->query . '%')
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($message) use ($user) {
                return [
                    'id' => $message->id,
                    'sender' => $message->user->name,
                    'content' => $message->content,
                    'timestamp' => $message->created_at->format('g:i A'),
                    'created_at' => $message->created_at->toISOString(),
                ];
            });

        return response()->json($messages);
    }

    // File Upload
    public function uploadFile(Request $request, $conversationId)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'content' => 'nullable|string|max:5000',
        ]);

        $user = $request->user();
        $conversation = Conversation::with('participants:id')->findOrFail($conversationId);

        if (! $this->userHasAccessToConversation($conversation, $user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Check if read-only
        $isAdmin = $this->isAdmin($user);
        if ($conversation->is_read_only && ! $isAdmin) {
            return response()->json(['error' => 'This conversation is read-only'], 403);
        }

        // Store the file
        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $size = $file->getSize();
        
        // Determine file type
        $mimeType = $file->getMimeType();
        $fileType = 'document';
        if (str_starts_with($mimeType, 'image/')) {
            $fileType = 'image';
        } elseif (str_starts_with($mimeType, 'video/')) {
            $fileType = 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            $fileType = 'audio';
        }

        // Store in public/storage/chat-attachments
        $path = $file->store('chat-attachments', 'public');

        // Create message with attachment
        $message = Message::create([
            'conversation_id' => $conversationId,
            'user_id' => $user->id,
            'content' => $request->input('content') ?? "Sent a file: {$originalName}",
            'attachment_path' => $path,
            'attachment_name' => $originalName,
            'attachment_type' => $fileType,
            'attachment_size' => $size,
        ]);

        if ($conversation->participants()->whereKey($user->id)->exists()) {
            $conversation->participants()->updateExistingPivot($user->id, [
                'last_read_at' => now(),
            ]);
        }

        $payload = $this->serializeMessage($message);
        $response = $this->serializeMessage($message, $user);

        MessageSent::dispatch($conversation->id, 'created', $payload, $user->id);

        return response()->json($response);
    }

    private function isAdmin(User $user): bool
    {
        return in_array($user->role, ['superadmin', 'hr', 'management'], true);
    }

    private function userHasAccessToConversation(Conversation $conversation, User $user): bool
    {
        if ($this->isAdmin($user) || $conversation->is_global) {
            return true;
        }

        if ($conversation->relationLoaded('participants')) {
            return $conversation->participants->contains('id', $user->id);
        }

        return $conversation->participants()->whereKey($user->id)->exists();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function serializeReactions(Message $message, ?User $viewer = null): array
    {
        $message->loadMissing('reactions.user:id,name');

        return $message->reactions
            ->groupBy('emoji')
            ->map(function ($group) use ($viewer): array {
                $userIds = $group->pluck('user_id')->map(fn ($userId) => (int) $userId)->values()->all();

                return [
                    'emoji' => $group->first()->emoji,
                    'count' => $group->count(),
                    'users' => $group->pluck('user.name')->values()->all(),
                    'userIds' => $userIds,
                    'hasReacted' => $viewer ? in_array($viewer->id, $userIds, true) : false,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMessage(Message $message, ?User $viewer = null): array
    {
        $message->loadMissing('user:id,name');

        return [
            'id' => $message->id,
            'conversationId' => $message->conversation_id,
            'sender' => $message->user->name,
            'avatar' => $this->getInitials($message->user->name),
            'content' => $message->content,
            'timestamp' => $message->created_at?->format('g:i A'),
            'isOwn' => $viewer ? $message->user_id === $viewer->id : false,
            'authorUserId' => $message->user_id,
            'created_at' => $message->created_at?->toISOString(),
            'is_edited' => $message->is_edited,
            'edited_at' => $message->edited_at?->toISOString(),
            'reactions' => $this->serializeReactions($message, $viewer),
            'attachment' => $message->attachment_path ? [
                'path' => Storage::disk('public')->url($message->attachment_path),
                'name' => $message->attachment_name,
                'type' => $message->attachment_type,
                'size' => $message->attachment_size,
            ] : null,
        ];
    }

    private function buildConversationPreview(Message $message): string
    {
        $content = trim($message->content);

        if ($content !== '') {
            return $content;
        }

        if ($message->attachment_name) {
            return 'Shared '.$message->attachment_name;
        }

        return 'No messages yet';
    }
}
