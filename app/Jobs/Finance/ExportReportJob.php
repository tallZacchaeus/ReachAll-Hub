<?php

namespace App\Jobs\Finance;

use App\Exports\Finance\FirsWhtScheduleExport;
use App\Exports\Finance\ReportExport;
use App\Exports\Finance\TransactionExport;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

/**
 * CAT6-04: Queue large report exports instead of streaming them synchronously.
 *
 * Triggered when the row count exceeds config('finance.report_sync_row_limit').
 * Writes the file to the 'public' disk and emails a download link to the user.
 */
class ExportReportJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 120;

    public function __construct(
        public readonly string $reportType,
        public readonly array $filters,
        public readonly int $userId,
    ) {}

    public function handle(): void
    {
        $user = User::findOrFail($this->userId);
        $type = $this->reportType;

        if ($type === 'transactions') {
            $export = new TransactionExport($user, $this->filters);
            $filename = 'transactions-'.now()->format('Ymd-His').'.xlsx';
        } elseif ($type === 'wht_schedule') {
            $export = new FirsWhtScheduleExport($this->filters);
            $filename = 'firs-wht-schedule-'.now()->format('Ymd-His').'.xlsx';
        } else {
            $export = new ReportExport($type, $this->filters);
            $filename = $type.'-'.now()->format('Ymd-His').'.xlsx';
        }

        $path = 'finance/exports/'.$filename;
        Excel::store($export, $path, 'public');

        $downloadUrl = Storage::disk('public')->url($path);

        $user->notify(new \App\Notifications\Finance\ReportReadyNotification($downloadUrl, $filename));

        Log::info('Finance report export complete', [
            'type' => $type,
            'user' => $this->userId,
            'path' => $path,
        ]);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('Finance report export failed', [
            'type' => $this->reportType,
            'user' => $this->userId,
            'error' => $e->getMessage(),
        ]);
    }
}
