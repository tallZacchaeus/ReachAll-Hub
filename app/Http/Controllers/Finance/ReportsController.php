<?php

namespace App\Http\Controllers\Finance;

use App\Exports\Finance\FirsWhtScheduleExport;
use App\Exports\Finance\ReportExport;
use App\Exports\Finance\TransactionExport;
use App\Http\Controllers\Controller;
use App\Models\Finance\AccountCode;
use App\Models\Finance\CostCentre;
use App\Models\Finance\Requisition;
use App\Services\Finance\MoneyHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    private const REPORT_TYPES = [
        'budget_vs_actual'      => 'Budget vs Actual',
        'spend_by_cost_centre'  => 'Spend by Cost Centre',
        'spend_by_account_code' => 'Spend by Account Code',
        'approval_throughput'   => 'Approval Throughput',
        'tax_summary'           => 'Tax Summary',
        'wht_schedule'          => 'FIRS WHT Schedule (WHT-01)',
    ];

    // ── Page ─────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->authorizeReports($request);

        $costCentres = CostCentre::active()->orderBy('code')->get(['id', 'code', 'name']);
        $categories  = AccountCode::active()
            ->selectRaw('DISTINCT category')
            ->pluck('category')
            ->sort()
            ->values();

        // Preview data (first 50 rows) when filters are present
        $preview    = null;
        $headings   = [];
        $reportType = $request->input('report_type', 'budget_vs_actual');
        $filters    = $request->only(['from', 'to', 'cost_centre_id', 'account_category', 'status']);

        if ($request->has('preview')) {
            [$headings, $preview] = $this->buildPreview($reportType, $filters, $request->user());
        }

        return Inertia::render('Finance/ReportsPage', [
            'report_types' => self::REPORT_TYPES,
            'cost_centres' => $costCentres,
            'categories'   => $categories,
            'filters'      => $filters,
            'report_type'  => $reportType,
            'headings'     => $headings,
            'preview'      => $preview,
        ]);
    }

    // ── Excel export ──────────────────────────────────────────────────────────

    public function exportExcel(Request $request): BinaryFileResponse
    {
        $this->authorizeReports($request);

        $type    = $request->input('report_type', 'budget_vs_actual');
        $filters = $request->only(['from', 'to', 'cost_centre_id', 'account_category', 'status']);

        if ($type === 'transactions') {
            $export   = new TransactionExport($request->user(), $filters);
            $filename = 'transactions-' . now()->format('Ymd') . '.xlsx';
        } elseif ($type === 'wht_schedule') {
            $export   = new FirsWhtScheduleExport($filters);
            $filename = 'firs-wht-schedule-' . now()->format('Ymd') . '.xlsx';
        } else {
            $export   = new ReportExport($type, $filters);
            $filename = $type . '-' . now()->format('Ymd') . '.xlsx';
        }

        return Excel::download($export, $filename);
    }

    // ── PDF export ────────────────────────────────────────────────────────────

    public function exportPdf(Request $request): HttpResponse
    {
        $this->authorizeReports($request);

        $type    = $request->input('report_type', 'budget_vs_actual');
        $filters = $request->only(['from', 'to', 'cost_centre_id', 'account_category', 'status']);
        $title   = self::REPORT_TYPES[$type] ?? 'Finance Report';

        [$headings, $rows] = $this->buildPreview($type, $filters, $request->user(), limit: 10000);

        $html = view('finance.report-pdf', compact('title', 'headings', 'rows', 'filters'))->render();
        $pdf  = app('dompdf.wrapper');
        $pdf->loadHTML($html)->setPaper('a4', 'landscape');

        return $pdf->download($type . '-' . now()->format('Ymd') . '.pdf');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildPreview(
        string $type,
        array  $filters,
        $user,
        int    $limit = 50
    ): array {
        $export   = new ReportExport($type, $filters);
        $headings = $export->headings();
        $rows     = $export->collection()->take($limit)->map(fn ($r) => $export->map($r))->values()->toArray();
        return [$headings, $rows];
    }

    private function authorizeReports(Request $request): void
    {
        abort_unless(
            \in_array($request->user()?->role, ['finance', 'ceo', 'superadmin', 'management', 'general_management', 'hr'], true),
            403
        );
    }
}
