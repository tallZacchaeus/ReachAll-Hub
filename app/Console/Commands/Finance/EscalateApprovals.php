<?php

namespace App\Console\Commands\Finance;

use App\Models\Finance\ApprovalStep;
use App\Notifications\Finance\ApprovalEscalated;
use App\Services\Finance\ApprovalRouter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Escalate overdue approval steps to the next available approver in the chain.
 *
 * Runs every 30 minutes. For each pending step past its SLA deadline:
 *  1. Resolves the next-level approver via ApprovalRouter::findNextLevelApprover().
 *  2. Reassigns the step to that approver (with a new SLA deadline).
 *  3. Records escalated_from_id for audit trail.
 *  4. Sends ApprovalEscalated notification to the new approver.
 */
class EscalateApprovals extends Command
{
    protected $signature = 'finance:escalate-approvals';

    protected $description = 'Escalate overdue approval steps to the next available approver';

    public function handle(ApprovalRouter $router): int
    {
        $overdue = ApprovalStep::with(['requisition.requester', 'approver'])
            ->where('status', 'pending')
            ->whereNotNull('sla_deadline')
            ->where('sla_deadline', '<', now())
            ->where('is_budget_override', false)
            ->get();

        if ($overdue->isEmpty()) {
            $this->info('No overdue steps found.');

            return self::SUCCESS;
        }

        $escalated = 0;

        foreach ($overdue as $step) {
            try {
                $nextApprover = $router->findNextLevelApprover($step);

                if ($nextApprover === null) {
                    // No escalation target found — log and leave in place for manual review
                    Log::warning('EscalateApprovals: no next approver found', [
                        'step_id' => $step->id,
                        'requisition_id' => $step->requisition_id,
                        'role_label' => $step->role_label,
                    ]);

                    continue;
                }

                $step->update([
                    'approver_id' => $nextApprover->id,
                    'sla_deadline' => now()->addHours(ApprovalRouter::SLA_HOURS),
                    'escalated_from_id' => $step->escalated_from_id ?? $step->id,
                ]);

                $nextApprover->notify(new ApprovalEscalated($step));

                $escalated++;

                Log::info('EscalateApprovals: step escalated', [
                    'step_id' => $step->id,
                    'new_approver_id' => $nextApprover->id,
                    'requisition_id' => $step->requisition_id,
                ]);
            } catch (\Throwable $e) {
                Log::error('EscalateApprovals: failed to escalate step', [
                    'step_id' => $step->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Escalated {$escalated} of {$overdue->count()} overdue steps.");

        return self::SUCCESS;
    }
}
