<?php

namespace App\Console\Commands\Compliance;

use App\Models\ComplianceTraining;
use App\Models\ComplianceTrainingAssignment;
use App\Services\AuditLogger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReassignRecurringTrainings extends Command
{
    protected $signature = 'compliance:reassign-recurring-trainings';

    protected $description = 'Create new pending assignments for recurring mandatory trainings that have lapsed.';

    public function handle(): int
    {
        $trainings = ComplianceTraining::where('is_mandatory', true)
            ->whereNotNull('recurrence_months')
            ->where('recurrence_months', '>', 0)
            ->where('is_active', true)
            ->get();

        $totalReassigned = 0;
        $trainingCount = 0;

        foreach ($trainings as $training) {
            $cutoff = now()->subMonths($training->recurrence_months);

            // Completed assignments whose completion date has lapsed the recurrence window.
            $lapsedAssignments = ComplianceTrainingAssignment::where('training_id', $training->id)
                ->where('status', 'completed')
                ->where('completed_at', '<', $cutoff)
                ->with('user')
                ->get();

            if ($lapsedAssignments->isEmpty()) {
                continue;
            }

            $reassignedForTraining = 0;

            foreach ($lapsedAssignments as $assignment) {
                // Guard: skip if an active (pending or in_progress) assignment already exists.
                $alreadyActive = ComplianceTrainingAssignment::where('training_id', $training->id)
                    ->where('user_id', $assignment->user_id)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->exists();

                if ($alreadyActive) {
                    continue;
                }

                ComplianceTrainingAssignment::create([
                    'training_id' => $training->id,
                    'user_id' => $assignment->user_id,
                    'assigned_by_id' => null,
                    'due_at' => now()->addMonths($training->recurrence_months)->startOfMonth()->toDateString(),
                    'status' => 'pending',
                ]);

                $reassignedForTraining++;
                $totalReassigned++;
            }

            if ($reassignedForTraining > 0) {
                $trainingCount++;
            }
        }

        if ($totalReassigned > 0) {
            AuditLogger::record(
                'compliance',
                'recurring_training_reassigned',
                null,
                null,
                null,
                ['count' => $totalReassigned],
            );
        }

        Log::info('Recurring training reassignment completed.', [
            'reassigned_count' => $totalReassigned,
            'trainings_affected' => $trainingCount,
        ]);

        $this->info("Reassigned {$totalReassigned} training assignments for {$trainingCount} trainings.");

        return self::SUCCESS;
    }
}
