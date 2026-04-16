<?php

namespace App\Console\Commands\Finance;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * D8-01: One-time migration that moves existing finance files from the
 * public disk (storage/app/public/finance/) to the private finance disk
 * (storage/app/finance/).
 *
 * Run once after deploying Sprint 5A, then this command can be removed.
 * It is idempotent — re-running will not duplicate files.
 */
class MigrateFinanceFiles extends Command
{
    protected $signature   = 'finance:migrate-files {--dry-run : List files without moving them}';
    protected $description = 'D8-01: Move existing finance files from public disk to private finance disk';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info($dryRun ? '[DRY RUN] Listing finance files on public disk...' : 'Migrating finance files to private disk...');

        $files = Storage::disk('public')->allFiles('finance');

        if (empty($files)) {
            $this->info('No files found under finance/ on the public disk. Nothing to migrate.');
            return self::SUCCESS;
        }

        $moved  = 0;
        $failed = 0;

        foreach ($files as $relativePath) {
            // Remove the leading 'finance/' prefix so paths match the new disk layout.
            // Old: finance/payments/123/proof.pdf
            // New: payments/123/proof.pdf
            $newPath = preg_replace('#^finance/#', '', $relativePath);

            if ($dryRun) {
                $this->line("  [would move] {$relativePath}  →  {$newPath}");
                $moved++;
                continue;
            }

            try {
                $content = Storage::disk('public')->get($relativePath);
                Storage::disk('finance')->put($newPath, $content);
                $moved++;
            } catch (\Throwable $e) {
                $this->error("  [FAILED] {$relativePath}: {$e->getMessage()}");
                $failed++;
            }
        }

        $verb = $dryRun ? 'Would move' : 'Moved';
        $this->info("{$verb} {$moved} file(s) to private finance disk.");

        if ($failed > 0) {
            $this->error("{$failed} file(s) failed to migrate. Review errors above.");
            return self::FAILURE;
        }

        if (! $dryRun) {
            $this->warn('Files have been copied. Verify the app is working correctly before deleting the originals from public/finance/.');
        }

        return self::SUCCESS;
    }
}
