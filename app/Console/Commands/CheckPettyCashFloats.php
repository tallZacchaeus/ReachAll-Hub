<?php

namespace App\Console\Commands;

use App\Models\Finance\PettyCashFloat;
use App\Notifications\Finance\PettyCashLowFloat;
use App\Notifications\Finance\ReconciliationDue;
use App\Models\User;
use Illuminate\Console\Command;

class CheckPettyCashFloats extends Command
{
    protected $signature   = 'finance:check-petty-cash';
    protected $description = 'Check all petty cash floats for low balance and reconciliation due alerts.';

    public function handle(): int
    {
        $floats = PettyCashFloat::with('custodian')->where('status', 'active')->get();

        foreach ($floats as $float) {
            $this->checkLowBalance($float);
            $this->checkReconciliationDue($float);
        }

        $this->info("Checked {$floats->count()} petty cash floats.");
        return self::SUCCESS;
    }

    private function checkLowBalance(PettyCashFloat $float): void
    {
        if ($float->isLowBalance() && $float->custodian) {
            $float->custodian->notify(new PettyCashLowFloat($float));

            // Also notify Finance users
            User::where('role', 'finance')->where('status', 'active')->each(
                fn (User $u) => $u->notify(new PettyCashLowFloat($float))
            );

            $this->line("  Low balance alert sent for float #{$float->id} ({$float->balancePercentage()}%)");
        }
    }

    private function checkReconciliationDue(PettyCashFloat $float): void
    {
        $days = $float->daysSinceReconciliation();

        if ($days > 30) {
            // Blocked — notify custodian + Finance
            if ($float->custodian) {
                $float->custodian->notify(new ReconciliationDue($float, $days, true));
            }
            User::where('role', 'finance')->where('status', 'active')->each(
                fn (User $u) => $u->notify(new ReconciliationDue($float, $days, true))
            );
            $this->line("  Recon BLOCKED for float #{$float->id} ({$days} days)");
        } elseif ($days > 25) {
            // Warning — notify custodian only
            if ($float->custodian) {
                $float->custodian->notify(new ReconciliationDue($float, $days, false));
            }
            $this->line("  Recon due warning for float #{$float->id} ({$days} days)");
        }
    }
}
