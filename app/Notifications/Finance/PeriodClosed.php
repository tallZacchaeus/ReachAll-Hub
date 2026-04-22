<?php

namespace App\Notifications\Finance;

use App\Models\Finance\FinancialPeriod;
use App\Models\User;
use Illuminate\Notifications\Notification;

class PeriodClosed extends Notification
{
    public function __construct(
        private readonly FinancialPeriod $period,
        private readonly User            $closer
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type'         => 'period_closed',
            'period_label' => $this->period->getLabel(),
            'period_id'    => $this->period->id,
            'closed_by'    => $this->closer->name,
            'message'      => "Financial period {$this->period->getLabel()} has been closed by {$this->closer->name}. Close report is available.",
            'url'          => '/finance/period-close',
        ];
    }
}
