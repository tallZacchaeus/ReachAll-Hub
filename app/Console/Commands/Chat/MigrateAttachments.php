<?php

namespace App\Console\Commands\Chat;

use App\Models\Message;
use App\Services\AuditLogger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * SEC-02: Move chat attachments off the public disk onto the private 'chat' disk.
 *
 *   php artisan chat:migrate-attachments [--dry-run]
 *
 * - Reads every Message with attachment_disk='public' (set by the
 *   2026_04_27_105207 backfill migration).
 * - Streams each file from public/<path> to chat/conversations/<id>/<basename>.
 * - Updates the row's attachment_path + attachment_disk in a single transaction.
 * - Writes ONE AuditLog entry per run (per-run summary, not per-file) so the
 *   table stays compact.
 *
 * The legacy public files are NOT deleted by this command — they linger so a
 * rollback is possible. Schedule deletion (e.g. `find storage/app/public/
 * chat-attachments -mtime +7 -delete`) at least 7 days after a successful prod
 * run.
 */
class MigrateAttachments extends Command
{
    protected $signature = 'chat:migrate-attachments {--dry-run : Report what would move without copying any bytes}';

    protected $description = 'SEC-02: move chat attachments from the public disk to the private chat disk';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $query = Message::query()
            ->whereNotNull('attachment_path')
            ->where('attachment_disk', 'public');

        $total = $query->count();
        if ($total === 0) {
            $this->info('No public-disk attachments to migrate.');

            return self::SUCCESS;
        }

        $this->info(sprintf('%s %d chat attachment(s) from public → chat disk.', $dryRun ? '[dry-run]' : 'Migrating', $total));

        $publicDisk = Storage::disk('public');
        $chatDisk = Storage::disk('chat');

        $moved = 0;
        $skipped = 0;
        $missing = 0;
        $firstId = null;
        $lastId = null;

        $query->orderBy('id')->chunkById(200, function ($messages) use (
            $dryRun, $publicDisk, $chatDisk, &$moved, &$skipped, &$missing, &$firstId, &$lastId
        ) {
            foreach ($messages as $message) {
                $firstId ??= $message->id;
                $lastId = $message->id;

                $oldPath = $message->attachment_path;
                if (! $publicDisk->exists($oldPath)) {
                    $missing++;
                    $this->warn("  [{$message->id}] missing: {$oldPath}");

                    continue;
                }

                $basename = basename($oldPath);
                $newPath = "conversations/{$message->conversation_id}/{$basename}";

                if ($dryRun) {
                    $skipped++;
                    $this->line("  [{$message->id}] would move {$oldPath} → chat:{$newPath}");

                    continue;
                }

                $stream = $publicDisk->readStream($oldPath);
                if ($stream === null) {
                    $missing++;

                    continue;
                }

                $chatDisk->writeStream($newPath, $stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }

                $message->forceFill([
                    'attachment_path' => $newPath,
                    'attachment_disk' => 'chat',
                ])->save();

                $moved++;
            }
        });

        // Per-run summary AuditLog (not per-file — keeps the table compact).
        if (! $dryRun && ($moved > 0 || $missing > 0)) {
            AuditLogger::record(
                module: 'chat',
                action: 'attachments.migrated',
                subjectType: Message::class,
                subjectId: null,
                oldData: null,
                newData: [
                    'moved' => $moved,
                    'missing' => $missing,
                    'first_message_id' => $firstId,
                    'last_message_id' => $lastId,
                    'source_disk' => 'public',
                    'target_disk' => 'chat',
                ],
            );
        }

        $this->info(sprintf(
            'Done. moved=%d skipped=%d missing=%d (dry-run=%s)',
            $moved, $skipped, $missing, $dryRun ? 'yes' : 'no',
        ));

        return self::SUCCESS;
    }
}
