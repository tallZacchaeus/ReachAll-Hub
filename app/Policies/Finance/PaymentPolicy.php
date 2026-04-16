<?php

namespace App\Policies\Finance;

use App\Models\Finance\Payment;
use App\Models\User;
use App\Services\Finance\FinanceRoleHelper;

/**
 * T10-01: Policy for Payment model actions.
 */
class PaymentPolicy
{
    /**
     * Only Finance admins (finance, general_management, ceo, superadmin)
     * may void a payment that has not already been voided.
     */
    public function voidPayment(User $user, Payment $payment): bool
    {
        return \in_array($user->role, FinanceRoleHelper::FINANCE_ADMIN_ROLES, true)
            && $payment->voided_at === null;
    }
}
