<?php

namespace App\Policies\Finance;

use App\Models\Finance\Payment;
use App\Models\User;

/**
 * T10-01: Policy for Payment model actions.
 */
class PaymentPolicy
{
    /**
     * Only Finance admins may void a payment that has not already been voided.
     */
    public function voidPayment(User $user, Payment $payment): bool
    {
        return $user->hasPermission('finance.admin')
            && $payment->voided_at === null;
    }
}
