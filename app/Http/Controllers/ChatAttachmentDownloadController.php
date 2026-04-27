<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * SEC-02: Authenticated streaming for chat attachments.
 *
 * Mirrors Finance/DocumentDownloadController. The attachment is served only if
 * the requesting user is currently a participant of the conversation, or holds
 * the `chat.admin` permission. Removed participants get 403 immediately
 * (Decision A — strict revoke).
 */
class ChatAttachmentDownloadController extends Controller
{
    /**
     * GET /chat/attachments/{message}
     */
    public function show(Request $request, Message $message): StreamedResponse
    {
        abort_unless($message->attachment_path, 404, 'Attachment not found.');

        $user = $request->user();
        $conversation = $message->conversation;
        abort_unless($conversation, 404, 'Conversation not found.');

        $isParticipant = $conversation->participants()->whereKey($user->id)->exists();
        $isGlobal = (bool) $conversation->is_global;
        $isAdmin = $user->hasPermission('chat.admin');

        abort_unless($isParticipant || $isGlobal || $isAdmin, 403, 'Not a participant of this conversation.');

        $disk = $message->attachment_disk ?: 'chat';
        abort_unless(Storage::disk($disk)->exists($message->attachment_path), 404, 'File not found.');

        return Storage::disk($disk)->download(
            $message->attachment_path,
            $message->attachment_name ?: basename($message->attachment_path),
        );
    }
}
