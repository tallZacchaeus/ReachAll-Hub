<?php

namespace App\Notifications\Finance;

use App\Models\Finance\FinancialPeriod;
use App\Models\User;
use Illuminate\Notifications\Notification;

class PeriodCloseInitiated extends Notification
{
    public function __construct(
        private readonly FinancialPeriod $period,
        private readonly User            $initiator
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type'         => 'period_close_initiated',
            'period_label' => $this->period->getLabel(),
            'period_id'    => $this->period->id,
            'initiated_by' => $this->initiator->name,
            'message'      => "Period close for {$this->period->getLabel()} has been initiated by {$this->initiator->name}. Please review the checklist.",
            'url'          => '/finance/period-close',
        ];
    }
}
