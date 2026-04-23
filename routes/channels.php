<?php

use App\Models\Conversation;
use App\Models\Finance\Requisition;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.conversation.{conversationId}', function (User $user, int $conversationId): bool {
    $conversation = Conversation::find($conversationId);

    if (! $conversation) {
        return false;
    }

    if ($user->hasPermission('chat.admin') || $conversation->is_global) {
        return true;
    }

    return $conversation->participants()->whereKey($user->id)->exists();
});

// ── Finance: Requisition-specific channel ────────────────────────────────────
// CAT9-02: Only the requester, assigned approvers, and finance admins may
// subscribe to real-time events for a specific requisition.
Broadcast::channel('requisition.{id}', function (User $user, int $id): bool {
    $requisition = Requisition::with('approvalSteps:id,requisition_id,approver_id')->find($id);

    if (! $requisition) {
        return false;
    }

    // Finance admins can see all requisitions.
    if ($user->hasPermission('finance.admin')) {
        return true;
    }

    // The requester
    if ($requisition->requester_id === $user->id) {
        return true;
    }

    // Any assigned approver
    return $requisition->approvalSteps->contains('approver_id', $user->id);
});

// ── Finance: Personal approvals channel ──────────────────────────────────────
// CAT9-02: Private channel scoped to the authenticated user — receives live
// notifications when a new approval step is assigned or escalated to them.
Broadcast::channel('approvals.{userId}', function (User $user, int $userId): bool {
    // Only the exact user may subscribe to their own approvals channel.
    return $user->id === $userId;
});
