<?php

namespace App\Exports\Finance;

use App\Models\Finance\WhtLiability;
use App\Services\Finance\MoneyHelper;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * CAT10-01: FIRS WHT-01 Schedule Export.
 *
 * Produces a spreadsheet in the format required by the Federal Inland Revenue Service
 * for monthly Withholding Tax schedule filing (WHT-01 form).
 *
 * Columns (in FIRS WHT-01 order):
 *   S/N | Vendor Name | TIN | Contract/Invoice Ref | Nature of Transaction
 *   | Gross Amount (₦) | WHT Rate (%) | WHT Amount (₦) | Period
 */
class FirsWhtScheduleExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(private readonly array $filters = []) {}

    public function title(): string
    {
        return 'FIRS WHT Schedule';
    }

    public function collection(): Collection
    {
        $query = WhtLiability::with([
            'vendor:id,name,tin',
            'requisition:id,request_id,description,amount_kobo,account_code_id',
            'requisition.accountCode:id,code,description',
            'financialPeriod:id,year,month',
        ])->where('status', 'pending');

        if (! empty($this->filters['period_id'])) {
            $query->where('financial_period_id', $this->filters['period_id']);
        }

        if (! empty($this->filters['from'])) {
            $query->whereHas('financialPeriod', fn ($q) =>
                $q->whereRaw("strftime('%Y-%m', year || '-' || printf('%02d', month)) >= ?", [$this->filters['from']])
            );
        }

        if (! empty($this->filters['to'])) {
            $query->whereHas('financialPeriod', fn ($q) =>
                $q->whereRaw("strftime('%Y-%m', year || '-' || printf('%02d', month)) <= ?", [$this->filters['to']])
            );
        }

        return $query->orderBy('financial_period_id')->orderBy('id')->get();
    }

    public function headings(): array
    {
        return [
            'S/N',
            'Vendor Name',
            'TIN',
            'Contract / Invoice Ref',
            'Nature of Transaction',
            'Gross Amount (₦)',
            'WHT Rate (%)',
            'WHT Amount (₦)',
            'Period',
        ];
    }

    public function map($row): array
    {
        static $sn = 0;
        $sn++;

        $period = $row->financialPeriod
            ? date('M Y', mktime(0, 0, 0, $row->financialPeriod->month, 1, $row->financialPeriod->year))
            : '—';

        return [
            $sn,
            $row->vendor?->name ?? '—',
            $row->vendor?->tin ?? '—',
            $row->requisition?->request_id ?? '—',
            $row->requisition?->accountCode?->description ?? $row->requisition?->description ?? '—',
            MoneyHelper::fromKobo($row->requisition?->amount_kobo ?? 0),
            $row->rate_percent,
            MoneyHelper::fromKobo($row->amount_kobo),
            $period,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'color'    => ['rgb' => 'FEF3C7'], // amber-100 for FIRS/tax context
                ],
            ],
        ];
    }
}
