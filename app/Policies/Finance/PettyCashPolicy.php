<?php

namespace App\Policies\Finance;

use App\Models\Finance\PettyCashFloat;
use App\Models\Finance\PettyCashReconciliation;
use App\Models\User;

class PettyCashPolicy
{
    /** Custodian can log expenses against their own active float. */
    public function expense(User $user, PettyCashFloat $float): bool
    {
        return $float->custodian_id === $user->id && $float->status === 'active';
    }

    /** Custodian can submit a reconciliation for their own float. */
    public function submitReconciliation(User $user, PettyCashFloat $float): bool
    {
        return $float->custodian_id === $user->id;
    }

    /** Finance admins can review reconciliation submissions. */
    public function reviewReconciliation(User $user, PettyCashReconciliation $recon): bool
    {
        // SEC-01: route through the dynamic permission system instead of
        // a hardcoded role-string array. New roles can be granted
        // 'finance.admin' via /admin/roles to gain reviewer access.
        return $user->hasPermission('finance.admin')
            && $recon->status === 'submitted';
    }
}
