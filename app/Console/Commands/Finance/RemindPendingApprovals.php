<?php

namespace App\Console\Commands\Finance;

use App\Models\Finance\ApprovalStep;
use App\Notifications\Finance\ApprovalReminder;
use App\Services\Finance\ApprovalRouter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Send reminders for pending approval steps that are approaching their SLA deadline.
 *
 * Runs hourly. For each pending step within 24 hours of its SLA deadline
 * that has not yet had a reminder sent, notifies the assigned approver.
 */
class RemindPendingApprovals extends Command
{
    protected $signature = 'finance:remind-pending-approvals';

    protected $description = 'Send reminders for approval steps approaching their SLA deadline';

    public function handle(): int
    {
        $approaching = ApprovalStep::with(['requisition', 'approver'])
            ->where('status', 'pending')
            ->whereNotNull('sla_deadline')
            ->where('sla_deadline', '>', now())
            ->where('sla_deadline', '<=', now()->addHours(24))
            ->where('reminder_sent', false)
            ->get();

        if ($approaching->isEmpty()) {
            $this->info('No steps approaching deadline.');
            return self::SUCCESS;
        }

        $sent = 0;

        foreach ($approaching as $step) {
            try {
                if ($step->approver) {
                    $step->approver->notify(new ApprovalReminder($step));
                    $step->update(['reminder_sent' => true]);
                    $sent++;
                }
            } catch (\Throwable $e) {
                Log::error('RemindPendingApprovals: failed to send reminder', [
                    'step_id' => $step->id,
                    'error'   => $e->getMessage(),
                ]);
            }
        }

        $this->info("Sent {$sent} reminder(s).");

        return self::SUCCESS;
    }
}
