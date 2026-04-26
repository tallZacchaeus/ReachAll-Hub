<?php

namespace App\Console\Commands\Compliance;

use App\Models\CompliancePolicyAcknowledgement;
use App\Models\CompliancePolicyVersion;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendPolicyAcknowledgementReminders extends Command
{
    protected $signature = 'compliance:send-policy-reminders';

    protected $description = 'Remind active employees to acknowledge outstanding compliance policies.';

    public function handle(): int
    {
        // Load every active policy version that belongs to an active policy.
        $versions = CompliancePolicyVersion::whereHas('policy', function ($q) {
            $q->where('is_active', true)
              ->whereNotNull('current_version')
              ->whereColumn('current_version', 'compliance_policy_versions.version');
        })->with('policy')->get();

        if ($versions->isEmpty()) {
            $this->info('No active policy versions found. Nothing to remind.');
            return self::SUCCESS;
        }

        // Active employees only.
        $users = User::where('status', 'active')->get(['id']);

        $reminderThreshold = now()->subDays(3);
        $totalReminded     = 0;
        $policiesReminded  = 0;

        foreach ($versions as $version) {
            $remindedForVersion = 0;

            foreach ($users as $user) {
                // Check if the user has already fully acknowledged this version.
                $ack = CompliancePolicyAcknowledgement::where('policy_version_id', $version->id)
                    ->where('user_id', $user->id)
                    ->first();

                // Skip if already acknowledged.
                if ($ack && $ack->acknowledged_at !== null) {
                    continue;
                }

                // If a placeholder reminder record exists, only re-remind if 3+ days have passed.
                if ($ack && $ack->reminded_at !== null && $ack->reminded_at->greaterThan($reminderThreshold)) {
                    continue;
                }

                if ($ack) {
                    // Update existing placeholder record.
                    $ack->update(['reminded_at' => now()]);
                } else {
                    // Insert a placeholder record (acknowledged_at = null) to track reminder state.
                    CompliancePolicyAcknowledgement::create([
                        'policy_id'         => $version->policy_id,
                        'policy_version_id' => $version->id,
                        'user_id'           => $user->id,
                        'acknowledged_at'   => null,
                        'reminded_at'       => now(),
                    ]);
                }

                $remindedForVersion++;
                $totalReminded++;
            }

            if ($remindedForVersion > 0) {
                $policiesReminded++;
            }
        }

        Log::info('Policy acknowledgement reminders processed.', [
            'policies_with_reminders' => $policiesReminded,
            'total_reminders_sent'    => $totalReminded,
        ]);

        $this->info("Sent reminders for {$policiesReminded} policies to {$totalReminded} employees.");

        return self::SUCCESS;
    }
}
