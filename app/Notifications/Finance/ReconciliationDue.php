<?php

namespace App\Notifications\Finance;

use App\Models\Finance\PettyCashFloat;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ReconciliationDue extends Notification
{
    use Queueable;

    public function __construct(
        public readonly PettyCashFloat $float,
        public readonly int $daysSince,
        public readonly bool $isBlocked,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $message = $this->isBlocked
            ? "Petty cash expenses are now BLOCKED. Your float has not been reconciled in {$this->daysSince} days. Submit a reconciliation immediately."
            : "Your petty cash float has not been reconciled in {$this->daysSince} days. Reconciliation must be submitted before day 30 to avoid expense blocking.";

        return [
            'type'       => 'reconciliation_due',
            'title'      => $this->isBlocked ? 'Petty Cash Blocked — Reconciliation Overdue' : 'Petty Cash Reconciliation Due',
            'body'       => $message,
            'float_id'   => $this->float->id,
            'days_since' => $this->daysSince,
            'is_blocked' => $this->isBlocked,
        ];
    }
}
