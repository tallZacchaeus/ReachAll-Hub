<?php

namespace App\Policies\Finance;

use App\Models\Finance\ApprovalStep;
use App\Models\User;

class ApprovalPolicy
{
    /**
     * The current user can act on an approval step only if:
     *  - They are the assigned approver for the step, AND
     *  - The step is currently pending, AND
     *  - They are not the requisition's requester (segregation of duties).
     */
    public function decide(User $user, ApprovalStep $step): bool
    {
        return $step->approver_id === $user->id
            && $step->status === 'pending'
            && $step->requisition->requester_id !== $user->id;
    }

    /**
     * Finance admins, CEO, and superadmin can view any pending approval queue.
     * Regular users see only steps assigned to them.
     */
    public function view(User $user, ApprovalStep $step): bool
    {
        if ($user->isFinanceAdmin()) {
            return true;
        }

        return $step->approver_id === $user->id;
    }
}
