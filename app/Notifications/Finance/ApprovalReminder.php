<?php

namespace App\Notifications\Finance;

use App\Models\Finance\ApprovalStep;
use App\Services\Finance\MoneyHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApprovalReminder extends Notification
{
    use Queueable;

    public function __construct(public readonly ApprovalStep $step) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $req    = $this->step->requisition;
        $amount = MoneyHelper::format($req->amount_kobo);

        return [
            'type'           => 'approval_reminder',
            'title'          => "Reminder: Pending Approval {$req->request_id}",
            'body'           => "You have a pending approval request ({$amount}) — SLA deadline is in 24 hours.",
            'request_id'     => $req->request_id,
            'requisition_id' => $req->id,
            'step_id'        => $this->step->id,
            'url'            => "/finance/approvals/{$req->id}",
        ];
    }
}
