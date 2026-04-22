<?php

namespace App\Policies\Finance;

use App\Models\Finance\Requisition;
use App\Models\User;

class RequisitionPolicy
{
    /** Any authenticated user can create a requisition. */
    public function create(User $user): bool
    {
        return $user->status === 'active';
    }

    /** Requester can view their own; approvers can view any they're assigned to; finance/admin can view all. */
    public function view(User $user, Requisition $requisition): bool
    {
        if ($user->isFinance()) {
            return true;
        }

        if ($requisition->requester_id === $user->id) {
            return true;
        }

        // Any step in the approval chain for this user
        return $requisition->approvalSteps()
            ->where('approver_id', $user->id)
            ->exists();
    }

    /** Only the requester can update a draft/rejected requisition. */
    public function update(User $user, Requisition $requisition): bool
    {
        return $requisition->requester_id === $user->id
            && in_array($requisition->status, ['draft', 'rejected'], true);
    }

    /** Only the requester can cancel a draft or submitted requisition. */
    public function cancel(User $user, Requisition $requisition): bool
    {
        return $requisition->requester_id === $user->id
            && in_array($requisition->status, ['draft', 'submitted'], true);
    }
}
