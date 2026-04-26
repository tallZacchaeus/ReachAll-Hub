<?php

namespace App\Events\Finance;

use App\Models\Finance\Requisition;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequisitionStateChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Requisition $requisition,
        public readonly string $previousStatus,
    ) {}

    public function broadcastOn(): array
    {
        return [
            // Requester's private channel
            new PrivateChannel("requisition.{$this->requisition->id}"),
            // Finance team channel
            new PrivateChannel('finance.team'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'requisition.state-changed';
    }

    public function broadcastWith(): array
    {
        return [
            'requisition_id' => $this->requisition->id,
            'request_id' => $this->requisition->request_id,
            'status' => $this->requisition->status,
            'previous_status' => $this->previousStatus,
            'amount_kobo' => $this->requisition->amount_kobo,
        ];
    }
}
