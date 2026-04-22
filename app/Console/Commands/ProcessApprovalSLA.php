<?php

namespace App\Console\Commands;

use App\Models\Finance\ApprovalStep;
use App\Models\Finance\Requisition;
use App\Models\User;
use App\Notifications\Finance\ApprovalEscalated;
use App\Notifications\Finance\ApprovalReminder;
use App\Services\Finance\ApprovalRouter;
use Illuminate\Console\Command;

/**
 * Runs hourly (scheduled in routes/console.php).
 *
 * For each pending approval step:
 *  - 24h before SLA deadline  → send ApprovalReminder notification
 *  - SLA deadline passed      → escalate to next-level approver
 */
class ProcessApprovalSLA extends Command
{
    protected $signature   = 'finance:process-sla';
    protected $description = 'Send SLA reminders and escalate overdue approval steps';

    public function handle(ApprovalRouter $router): int
    {
        $now = now();

        $pendingSteps = ApprovalStep::with(['requisition.requester', 'approver'])
            ->where('status', 'pending')
            ->whereNotNull('sla_deadline')
            ->get();

        $reminded   = 0;
        $escalated  = 0;

        foreach ($pendingSteps as $step) {
            // SLA passed → escalate
            if ($step->sla_deadline->isPast()) {
                $this->escalate($step, $router);
                $escalated++;
                continue;
            }

            // Within 24h of deadline and reminder not yet sent → remind
            $hoursRemaining = $now->diffInHours($step->sla_deadline, false);
            if ($hoursRemaining <= 24 && ! $step->reminder_sent) {
                $step->approver->notify(new ApprovalReminder($step));
                $step->update(['reminder_sent' => true]);
                $reminded++;
            }
        }

        $this->info("SLA check complete: {$reminded} reminders sent, {$escalated} steps escalated.");

        return self::SUCCESS;
    }

    private function escalate(ApprovalStep $step, ApprovalRouter $router): void
    {
        $req = $step->requisition;

        // Mark current step as escalated
        $step->update([
            'status'   => 'escalated',
            'acted_at' => now(),
            'comment'  => 'Auto-escalated: 48-hour SLA exceeded.',
        ]);

        // Find a higher-level user to escalate to (next role in hierarchy above current approver)
        $escalationUser = $this->findEscalationUser($step->approver, $req->requester_id);

        if ($escalationUser === null) {
            $this->warn("No escalation target found for step #{$step->id} on {$req->request_id}.");
            return;
        }

        // Create a new approval step for the escalated approver
        $newLevel = $step->level; // keep same level slot (replaces the overdue step)

        $newStep = ApprovalStep::create([
            'requisition_id'   => $req->id,
            'approver_id'      => $escalationUser->id,
            'level'            => $newLevel,
            'role_label'       => $step->role_label . ' (Escalated)',
            'status'           => 'pending',
            'sla_deadline'     => now()->addHours(ApprovalRouter::SLA_HOURS),
            'escalated_from_id' => $step->id,
        ]);

        // Notify escalated approver
        $escalationUser->notify(new ApprovalEscalated($newStep));

        $this->line("  Escalated step #{$step->id} → new step #{$newStep->id} assigned to {$escalationUser->name}");
    }

    /**
     * Find the next-level approver above the current approver's role weight.
     */
    private function findEscalationUser(User $currentApprover, int $requesterId): ?User
    {
        $higherRoles = match ($currentApprover->role) {
            'management'         => ['finance', 'general_management', 'ceo', 'superadmin'],
            'finance'            => ['general_management', 'ceo', 'superadmin'],
            'general_management' => ['ceo', 'superadmin'],
            'ceo'                => ['superadmin'],
            default              => ['management', 'finance', 'general_management', 'ceo'],
        };

        foreach ($higherRoles as $role) {
            $user = User::where('role', $role)
                ->where('id', '!=', $requesterId)
                ->where('id', '!=', $currentApprover->id)
                ->where('status', 'active')
                ->first();

            if ($user !== null) {
                return $user;
            }
        }

        return null;
    }
}
