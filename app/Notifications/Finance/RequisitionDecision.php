<?php

namespace App\Notifications\Finance;

use App\Models\Finance\Requisition;
use App\Services\Finance\MoneyHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to the requester when their requisition is fully approved or rejected.
 */
class RequisitionDecision extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Requisition $requisition,
        public readonly string $decision,  // 'approved' | 'rejected' | 'queried'
        public readonly ?string $comment = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $amount = MoneyHelper::format($this->requisition->amount_kobo);
        $id = $this->requisition->request_id;

        $title = match ($this->decision) {
            'approved' => "Request {$id} Approved",
            'rejected' => "Request {$id} Rejected",
            'queried' => "Request {$id} Queried — Action Required",
            default => "Update on {$id}",
        };

        $body = match ($this->decision) {
            'approved' => "Your request for {$amount} has been fully approved.",
            'rejected' => "Your request for {$amount} was rejected.".($this->comment ? " Reason: {$this->comment}" : ''),
            'queried' => "Your request for {$amount} requires clarification: {$this->comment}",
            default => "Your request {$id} has been updated.",
        };

        return [
            'type' => "requisition_{$this->decision}",
            'title' => $title,
            'body' => $body,
            'request_id' => $id,
            'requisition_id' => $this->requisition->id,
            'url' => "/finance/requisitions/{$this->requisition->id}",
        ];
    }
}
