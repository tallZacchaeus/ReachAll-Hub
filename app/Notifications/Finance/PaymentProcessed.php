<?php

namespace App\Notifications\Finance;

use App\Models\Finance\Payment;
use App\Models\Finance\Requisition;
use App\Services\Finance\MoneyHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentProcessed extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Requisition $requisition,
        public readonly Payment $payment
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'           => 'payment_processed',
            'requisition_id' => $this->requisition->id,
            'request_id'     => $this->requisition->request_id,
            'amount_fmt'     => MoneyHelper::format($this->payment->amount_kobo),
            'method'         => $this->payment->method,
            'reference'      => $this->payment->reference,
            'paid_at'        => $this->payment->paid_at->toDateString(),
            'message'        => "Payment of " . MoneyHelper::format($this->payment->amount_kobo) .
                " processed for {$this->requisition->request_id}.",
        ];
    }
}
