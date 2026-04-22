<?php

namespace App\Notifications\Finance;

use App\Models\Finance\Invoice;
use App\Models\Finance\Requisition;
use App\Services\Finance\MoneyHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Dispatched to the CEO when a three-way match returns 'variance'.
 * CEO must review and either accept or reject before payment can proceed.
 */
class VarianceFlagged extends Notification
{
    use Queueable;

    /** @param array<array{code: string, description: string}> $flags */
    public function __construct(
        public readonly Requisition $requisition,
        public readonly Invoice $invoice,
        public readonly int $varianceKobo,
        public readonly array $flags
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'           => 'variance_flagged',
            'requisition_id' => $this->requisition->id,
            'request_id'     => $this->requisition->request_id,
            'invoice_id'     => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'variance_fmt'   => MoneyHelper::format(\abs($this->varianceKobo)),
            'flag_codes'     => collect($this->flags)->pluck('code')->toArray(),
            'message'        => "Three-way match variance on {$this->requisition->request_id}: " .
                MoneyHelper::format(\abs($this->varianceKobo)) . " difference. CEO review required.",
        ];
    }
}
