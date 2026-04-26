<?php

namespace App\Exports\Finance;

use App\Models\Finance\CostCentre;
use App\Models\Finance\Requisition;
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
 * Generic report export — one class handles all 5 report types.
 * reportType: budget_vs_actual | spend_by_cost_centre | spend_by_account_code
 *             | approval_throughput | tax_summary
 */
class ReportExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private readonly string $reportType,
        private readonly array $filters = []
    ) {}

    public function title(): string
    {
        return match ($this->reportType) {
            'budget_vs_actual' => 'Budget vs Actual',
            'spend_by_cost_centre' => 'Spend by Cost Centre',
            'spend_by_account_code' => 'Spend by Account Code',
            'approval_throughput' => 'Approval Throughput',
            'tax_summary' => 'Tax Summary',
            default => 'Finance Report',
        };
    }

    public function collection(): Collection
    {
        return match ($this->reportType) {
            'budget_vs_actual' => $this->budgetVsActual(),
            'spend_by_cost_centre' => $this->spendByCostCentre(),
            'spend_by_account_code' => $this->spendByAccountCode(),
            'approval_throughput' => $this->approvalThroughput(),
            'tax_summary' => $this->taxSummary(),
            default => collect(),
        };
    }

    public function headings(): array
    {
        return match ($this->reportType) {
            'budget_vs_actual' => [
                'Cost Centre', 'Code', 'Budget (₦)', 'Actual Spend (₦)',
                'Variance (₦)', 'Utilisation %', 'Status',
            ],
            'spend_by_cost_centre' => [
                'Cost Centre', 'Code', 'Total Spend (₦)', 'Transaction Count',
                'Avg Transaction (₦)',
            ],
            'spend_by_account_code' => [
                'Account Code', 'Category', 'Description', 'Total Spend (₦)',
                'Transaction Count',
            ],
            'approval_throughput' => [
                'Requisition ID', 'Submitted', 'Approved/Rejected', 'Days to Decision',
                'Approver Count', 'Status', 'Amount (₦)',
            ],
            'tax_summary' => [
                'Period', 'Cost Centre', 'Gross Spend (₦)',
                'VAT Collected (₦)', 'WHT Withheld (₦)', 'Net Payable (₦)',
            ],
            default => ['Data'],
        };
    }

    public function map($row): array
    {
        return (array) $row;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'color' => ['rgb' => 'DBEAFE'], // blue-100
            ]],
        ];
    }

    // ── Data builders ─────────────────────────────────────────────────────────

    private function budgetVsActual(): Collection
    {
        return CostCentre::active()
            ->orderBy('code')
            ->get()
            ->map(function (CostCentre $cc) {
                $actual = Requisition::where('cost_centre_id', $cc->id)
                    ->whereIn('status', ['paid', 'posted'])
                    ->when(! empty($this->filters['from']), fn ($q) => $q->where('submitted_at', '>=', $this->filters['from'])
                    )
                    ->when(! empty($this->filters['to']), fn ($q) => $q->where('submitted_at', '<=', $this->filters['to'].' 23:59:59')
                    )
                    ->sum('total_kobo');

                $budget = $cc->budget_kobo;
                $variance = $budget - $actual;
                $pct = $budget > 0 ? round(($actual / $budget) * 100, 2) : 0.0;
                $status = match (true) {
                    $pct >= 100 => 'Over Budget',
                    $pct >= 90 => 'Critical',
                    $pct >= 80 => 'Warning',
                    default => 'On Track',
                };

                return [
                    $cc->name,
                    $cc->code,
                    MoneyHelper::fromKobo($budget),
                    MoneyHelper::fromKobo($actual),
                    MoneyHelper::fromKobo($variance),
                    $pct,
                    $status,
                ];
            });
    }

    private function spendByCostCentre(): Collection
    {
        $query = Requisition::with('costCentre:id,code,name')
            ->whereIn('status', ['paid', 'posted'])
            ->when(! empty($this->filters['from']), fn ($q) => $q->where('submitted_at', '>=', $this->filters['from'])
            )
            ->when(! empty($this->filters['to']), fn ($q) => $q->where('submitted_at', '<=', $this->filters['to'].' 23:59:59')
            )
            ->selectRaw('cost_centre_id, SUM(total_kobo) as total, COUNT(*) as cnt, AVG(total_kobo) as avg_kobo')
            ->groupBy('cost_centre_id')
            ->orderByDesc('total')
            ->get();

        return $query->map(fn ($row) => [
            $row->costCentre?->name ?? 'Unknown',
            $row->costCentre?->code ?? '',
            MoneyHelper::fromKobo((int) $row->total),
            $row->cnt,
            MoneyHelper::fromKobo((int) $row->avg_kobo),
        ]);
    }

    private function spendByAccountCode(): Collection
    {
        $query = Requisition::with('accountCode:id,code,category,description')
            ->whereIn('status', ['paid', 'posted'])
            ->when(! empty($this->filters['from']), fn ($q) => $q->where('submitted_at', '>=', $this->filters['from'])
            )
            ->when(! empty($this->filters['to']), fn ($q) => $q->where('submitted_at', '<=', $this->filters['to'].' 23:59:59')
            )
            ->selectRaw('account_code_id, SUM(total_kobo) as total, COUNT(*) as cnt')
            ->groupBy('account_code_id')
            ->orderByDesc('total')
            ->get();

        return $query->map(fn ($row) => [
            $row->accountCode?->code ?? '',
            $row->accountCode?->category ?? '',
            $row->accountCode?->description ?? '',
            MoneyHelper::fromKobo((int) $row->total),
            $row->cnt,
        ]);
    }

    private function approvalThroughput(): Collection
    {
        return Requisition::with('approvalSteps:id,requisition_id,status,decided_at')
            ->whereNotNull('submitted_at')
            ->when(! empty($this->filters['from']), fn ($q) => $q->where('submitted_at', '>=', $this->filters['from'])
            )
            ->when(! empty($this->filters['to']), fn ($q) => $q->where('submitted_at', '<=', $this->filters['to'].' 23:59:59')
            )
            ->orderByDesc('submitted_at')
            ->limit(5000) // cap for performance
            ->get()
            ->map(function (Requisition $r) {
                $decided = $r->approved_at ?? ($r->status === 'rejected'
                    ? $r->approvalSteps->where('status', 'rejected')->first()?->decided_at
                    : null);
                $days = $r->submitted_at && $decided
                    ? $r->submitted_at->diffInDays($decided)
                    : null;

                return [
                    $r->request_id,
                    $r->submitted_at?->toDateString() ?? '',
                    $decided?->toDateString() ?? '',
                    $days ?? 'Pending',
                    $r->approvalSteps->count(),
                    $r->status,
                    MoneyHelper::fromKobo($r->amount_kobo),
                ];
            });
    }

    private function taxSummary(): Collection
    {
        return Requisition::with('costCentre:id,code,name', 'financialPeriod:id,year,month')
            ->whereIn('status', ['paid', 'posted'])
            ->when(! empty($this->filters['from']), fn ($q) => $q->where('submitted_at', '>=', $this->filters['from'])
            )
            ->when(! empty($this->filters['to']), fn ($q) => $q->where('submitted_at', '<=', $this->filters['to'].' 23:59:59')
            )
            ->selectRaw('financial_period_id, cost_centre_id,
                SUM(amount_kobo) as gross,
                SUM(tax_vat_kobo) as vat,
                SUM(tax_wht_kobo) as wht,
                SUM(total_kobo) as net')
            ->groupBy('financial_period_id', 'cost_centre_id')
            ->orderBy('financial_period_id')
            ->get()
            ->map(fn ($row) => [
                $row->financialPeriod ? date('M Y', mktime(0, 0, 0, $row->financialPeriod->month, 1, $row->financialPeriod->year)) : '—',
                $row->costCentre?->name ?? 'Unknown',
                MoneyHelper::fromKobo((int) $row->gross),
                MoneyHelper::fromKobo((int) $row->vat),
                MoneyHelper::fromKobo((int) $row->wht),
                MoneyHelper::fromKobo((int) $row->net),
            ]);
    }
}
