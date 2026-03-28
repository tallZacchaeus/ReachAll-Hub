<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.conversation.{conversationId}', function (User $user, int $conversationId): bool {
    $conversation = Conversation::find($conversationId);

    if (! $conversation) {
        return false;
    }

    if (in_array($user->role, ['superadmin', 'hr', 'management'], true) || $conversation->is_global) {
        return true;
    }

    return $conversation->participants()->whereKey($user->id)->exists();
});
