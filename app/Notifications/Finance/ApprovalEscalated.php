<?php

namespace App\Notifications\Finance;

use App\Models\Finance\ApprovalStep;
use App\Services\Finance\MoneyHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApprovalEscalated extends Notification
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
            'type'           => 'approval_escalated',
            'title'          => "Escalated Request: {$req->request_id}",
            'body'           => "An approval for {$amount} has been escalated to you because the 48-hour SLA was exceeded.",
            'request_id'     => $req->request_id,
            'requisition_id' => $req->id,
            'step_id'        => $this->step->id,
            'url'            => "/finance/approvals/{$req->id}",
        ];
    }
}
