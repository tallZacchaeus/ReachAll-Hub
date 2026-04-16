<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\FinancialPeriod;
use App\Models\Finance\GoodsReceipt;
use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Models\Finance\PettyCashTransaction;
use App\Models\Finance\Requisition;
use App\Services\Finance\FinanceRoleHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * D8-01: Authenticated download gateway for all sensitive finance documents.
 *
 * Every file is stored on the private 'finance' disk (not publicly accessible).
 * These endpoints enforce the same access rules as the pages that link to them.
 * Each route is covered by the global 'auth' middleware via the route group below.
 */
class DocumentDownloadController extends Controller
{
    /**
     * GET /finance/documents/invoice/{invoice}
     * Requires: RequisitionPolicy::view on the related requisition.
     */
    public function invoice(Request $request, Invoice $invoice): StreamedResponse
    {
        $this->authorize('view', $invoice->requisition);
        abort_unless(Storage::disk('finance')->exists($invoice->file_path), 404);

        return Storage::disk('finance')->download($invoice->file_path);
    }

    /**
     * GET /finance/documents/goods-receipt/{receipt}
     * Requires: RequisitionPolicy::view on the related requisition.
     */
    public function goodsReceipt(Request $request, GoodsReceipt $receipt): StreamedResponse
    {
        $this->authorize('view', $receipt->requisition);
        abort_unless(Storage::disk('finance')->exists($receipt->file_path), 404);

        return Storage::disk('finance')->download($receipt->file_path);
    }

    /**
     * GET /finance/documents/payment-proof/{payment}
     * Requires: RequisitionPolicy::view on the related requisition.
     */
    public function paymentProof(Request $request, Payment $payment): StreamedResponse
    {
        $this->authorize('view', $payment->requisition);
        abort_unless(Storage::disk('finance')->exists($payment->proof_path), 404);

        return Storage::disk('finance')->download($payment->proof_path);
    }

    /**
     * GET /finance/documents/close-report/{period}
     * Finance admin only (finance, ceo, superadmin).
     */
    public function closeReport(Request $request, FinancialPeriod $period): StreamedResponse
    {
        abort_unless(
            \in_array($request->user()->role, ['finance', 'ceo', 'superadmin'], true),
            403,
            'Only Finance admins may download period close reports.'
        );
        abort_unless(
            $period->close_report_path && Storage::disk('finance')->exists($period->close_report_path),
            404,
            'Close report not found.'
        );

        return Storage::disk('finance')->download($period->close_report_path);
    }

    /**
     * GET /finance/documents/requisition/{requisition}/doc/{docIndex}
     * Requires: RequisitionPolicy::view on the requisition.
     */
    public function requisitionDoc(Request $request, Requisition $requisition, int $docIndex): StreamedResponse
    {
        $this->authorize('view', $requisition);
        $docs = $requisition->supporting_docs ?? [];
        abort_unless(isset($docs[$docIndex]), 404, 'Document index not found.');
        abort_unless(Storage::disk('finance')->exists($docs[$docIndex]), 404, 'Document file not found.');

        return Storage::disk('finance')->download($docs[$docIndex]);
    }

    /**
     * GET /finance/documents/receipt/{transaction}
     * Custodian who owns the float, or finance admin.
     */
    public function receipt(Request $request, PettyCashTransaction $transaction): StreamedResponse
    {
        $float = $transaction->float;
        abort_unless($float, 404, 'Float not found.');
        abort_unless(
            $request->user()->id === $float->custodian_id
                || \in_array($request->user()->role, ['finance', 'ceo', 'superadmin'], true),
            403,
            'Only the float custodian or Finance admins may access receipts.'
        );
        abort_unless(
            $transaction->receipt_path && Storage::disk('finance')->exists($transaction->receipt_path),
            404,
            'Receipt file not found.'
        );

        return Storage::disk('finance')->download($transaction->receipt_path);
    }
}
