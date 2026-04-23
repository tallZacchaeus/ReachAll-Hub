<?php

namespace App\Exports\Finance;

use App\Models\Finance\Requisition;
use App\Models\User;
use App\Services\Finance\MoneyHelper;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Full transaction listing export — compatible with standard accounting software column structure.
 * Scope: restricted to cost centres the requesting user can see.
 */
class TransactionExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    public function __construct(
        private readonly User    $user,
        private readonly array   $filters = []
    ) {}

    public function collection(): Collection
    {
        $query = Requisition::with([
            'requester:id,name,department',
            'costCentre:id,code,name',
            'accountCode:id,code,description',
            'vendor:id,name',
            'payment:id,requisition_id,method,reference,paid_at',
        ]);

        // Data-visibility gate: users without finance admin permission only see
        // their own cost centre or their own requisitions.
        if (! $this->user->hasPermission('finance.admin')) {
            $cc = \App\Models\Finance\CostCentre::where('head_user_id', $this->user->id)
                ->pluck('id');
            if ($cc->isEmpty()) {
                // Staff: only their own requisitions
                $query->where('requester_id', $this->user->id);
            } else {
                $query->whereIn('cost_centre_id', $cc);
            }
        }

        // Filters
        if (! empty($this->filters['from'])) {
            $query->where('submitted_at', '>=', $this->filters['from']);
        }
        if (! empty($this->filters['to'])) {
            $query->where('submitted_at', '<=', $this->filters['to'] . ' 23:59:59');
        }
        if (! empty($this->filters['cost_centre_id'])) {
            $query->where('cost_centre_id', $this->filters['cost_centre_id']);
        }
        if (! empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        return $query->orderByDesc('submitted_at')->get();
    }

    public function headings(): array
    {
        return [
            'Transaction ID',
            'Date Submitted',
            'Date Approved',
            'Date Paid',
            'Type',
            'Description',
            'Requester',
            'Department',
            'Cost Centre Code',
            'Cost Centre Name',
            'Account Code',
            'Account Description',
            'Vendor',
            'Gross Amount (₦)',
            'VAT (₦)',
            'WHT (₦)',
            'Net Payable (₦)',
            'Currency',
            'Status',
            'Payment Method',
            'Payment Reference',
            'Urgency',
        ];
    }

    public function map($row): array
    {
        return [
            $row->request_id,
            $row->submitted_at?->toDateString() ?? '',
            $row->approved_at?->toDateString() ?? '',
            $row->paid_at?->toDateString() ?? '',
            $row->type,
            $row->description,
            $row->requester?->name ?? '',
            $row->requester?->department ?? '',
            $row->costCentre?->code ?? '',
            $row->costCentre?->name ?? '',
            $row->accountCode?->code ?? '',
            $row->accountCode?->description ?? '',
            $row->vendor?->name ?? '',
            MoneyHelper::fromKobo($row->amount_kobo),
            MoneyHelper::fromKobo($row->tax_vat_kobo),
            MoneyHelper::fromKobo($row->tax_wht_kobo),
            MoneyHelper::fromKobo($row->total_kobo),
            $row->currency ?? 'NGN',
            $row->status,
            $row->payment?->method ?? '',
            $row->payment?->reference ?? '',
            $row->urgency ?? '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'color'    => ['rgb' => 'D1FAE5'], // green-100
            ]],
        ];
    }
}
