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

    /** Finance / CEO / Superadmin can review reconciliation submissions. */
    public function reviewReconciliation(User $user, PettyCashReconciliation $recon): bool
    {
        return in_array($user->role, ['finance', 'ceo', 'superadmin'], true)
            && $recon->status === 'submitted';
    }
}
