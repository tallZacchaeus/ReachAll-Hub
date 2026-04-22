<?php

namespace App\Notifications\Finance;

use App\Models\Finance\PettyCashFloat;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PettyCashLowFloat extends Notification
{
    use Queueable;

    public function __construct(public readonly PettyCashFloat $float) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $pct = $float = $this->float;
        $pct = $float->balancePercentage();

        return [
            'type'         => 'petty_cash_low_float',
            'title'        => 'Low Petty Cash Balance',
            'body'         => "Your petty cash balance is at {$pct}% ({$float->balanceFmt()} of {$float->limitFmt()}). Consider submitting a reconciliation for replenishment.",
            'float_id'     => $float->id,
            'balance_kobo' => $float->current_balance_kobo,
            'limit_kobo'   => $float->float_limit_kobo,
        ];
    }
}
