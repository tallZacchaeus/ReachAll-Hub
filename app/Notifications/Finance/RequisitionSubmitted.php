<?php

namespace App\Notifications\Finance;

use App\Models\Finance\Requisition;
use App\Services\Finance\MoneyHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RequisitionSubmitted extends Notification
{
    use Queueable;

    public function __construct(public readonly Requisition $requisition) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'          => 'requisition_submitted',
            'title'         => 'New Approval Request',
            'body'          => "{$this->requisition->requester->name} submitted {$this->requisition->request_id} for {$this->amount()} — awaiting your approval.",
            'request_id'    => $this->requisition->request_id,
            'requisition_id' => $this->requisition->id,
            'url'           => "/finance/approvals/{$this->requisition->id}",
        ];
    }

    private function amount(): string
    {
        return MoneyHelper::format($this->requisition->amount_kobo);
    }
}
