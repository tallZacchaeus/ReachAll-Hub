<?php

namespace App\Notifications\Finance;

use App\Models\Finance\CostCentre;
use App\Models\Finance\Requisition;
use App\Services\Finance\MoneyHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Dispatched when a requisition approval pushes a cost centre's budget
 * consumption to 80%, 90%, or over 100% (blocked).
 *
 * Sent to: cost centre head + Finance role users.
 */
class BudgetAlert extends Notification
{
    use Queueable;

    /** @param 'warn_80'|'warn_90'|'block_100' $alertType */
    public function __construct(
        public readonly string $alertType,
        public readonly CostCentre $costCentre,
        public readonly Requisition $requisition,
        public readonly float $percentage
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $label = match ($this->alertType) {
            'warn_80'   => '80% warning',
            'warn_90'   => '90% warning',
            'block_100' => 'BLOCKED — budget exceeded',
            default     => 'Budget alert',
        };

        return [
            'type'            => 'budget_alert',
            'alert_type'      => $this->alertType,
            'cost_centre_id'  => $this->costCentre->id,
            'cost_centre'     => $this->costCentre->code . ' ' . $this->costCentre->name,
            'requisition_id'  => $this->requisition->id,
            'request_id'      => $this->requisition->request_id,
            'percentage'      => $this->percentage,
            'budget_fmt'      => MoneyHelper::format($this->costCentre->budget_kobo),
            'message'         => "Budget {$label} for {$this->costCentre->name}: " .
                number_format($this->percentage, 1) . "% utilised. " .
                "Triggered by {$this->requisition->request_id} (" .
                MoneyHelper::format($this->requisition->amount_kobo) . ").",
        ];
    }
}
