<?php

namespace App\Console\Commands\Compliance;

use App\Models\ComplianceDocument;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckExpiringDocuments extends Command
{
    protected $signature = 'compliance:check-expiring-documents {--days=60 : Expiry warning window in days}';

    protected $description = 'Mark expired compliance documents and report documents nearing expiry.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $today = now()->toDateString();
        $warningDate = now()->addDays($days)->toDateString();

        $expiredCount = ComplianceDocument::query()
            ->whereNotNull('expires_at')
            ->whereDate('expires_at', '<', $today)
            ->whereIn('status', ['pending', 'active'])
            ->update(['status' => 'expired']);

        $expiringCount = ComplianceDocument::query()
            ->whereNotNull('expires_at')
            ->whereDate('expires_at', '>=', $today)
            ->whereDate('expires_at', '<=', $warningDate)
            ->whereIn('status', ['pending', 'active'])
            ->count();

        if ($expiredCount > 0 || $expiringCount > 0) {
            Log::info('Compliance document expiry check completed.', [
                'expired_count' => $expiredCount,
                'expiring_count' => $expiringCount,
                'warning_days' => $days,
            ]);
        }

        $this->info("Compliance documents checked: {$expiredCount} expired, {$expiringCount} expiring within {$days} days.");

        return self::SUCCESS;
    }
}
