<?php

namespace App\Http\Controllers\Finance;

use App\Events\Finance\RequisitionStateChanged;
use App\Http\Controllers\Controller;
use App\Models\Finance\AccountCode;
use App\Models\Finance\CostCentre;
use App\Models\Finance\FinancialPeriod;
use App\Models\Finance\Requisition;
use App\Models\Finance\Vendor;
use App\Notifications\Finance\RequisitionSubmitted;
use App\Services\Finance\ApprovalRouter;
use App\Services\Finance\ClosedPeriodGuard;
use App\Services\Finance\MoneyHelper;
use App\Services\Finance\TaxCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RequisitionController extends Controller
{
    // ── Create form ──────────────────────────────────────────────────────────

    public function create(Request $request): Response
    {
        $this->authorize('create', Requisition::class);

        $costCentres = CostCentre::active()
            ->with(['parent', 'head:id,name'])
            ->orderBy('code')
            ->get()
            ->map(fn (CostCentre $cc) => [
                'id' => $cc->id,
                'code' => $cc->code,
                'name' => $cc->name,
                'depth' => $cc->depth,
                'label' => str_repeat('  ', $cc->depth)."{$cc->code} — {$cc->name}",
            ]);

        $accountCodes = AccountCode::active()
            ->orderBy('code')
            ->get()
            ->map(fn (AccountCode $ac) => [
                'id' => $ac->id,
                'code' => $ac->code,
                'category' => $ac->category,
                'category_label' => $ac->category_label,
                'description' => $ac->description,
                'tax_vat_applicable' => $ac->tax_vat_applicable,
                'tax_wht_applicable' => $ac->tax_wht_applicable,
                'wht_rate' => $ac->wht_rate,
            ]);

        $vendors = Vendor::active()
            ->orderBy('name')
            ->get(['id', 'name', 'bank_name', 'contact_email']);

        return Inertia::render('Finance/RequisitionCreatePage', [
            'costCentres' => $costCentres,
            'accountCodes' => $accountCodes,
            'vendors' => $vendors,
            'vatRate' => TaxCalculator::VAT_RATE,
        ]);
    }

    // ── Submit new requisition ───────────────────────────────────────────────

    public function store(Request $request, ApprovalRouter $router): RedirectResponse
    {
        $this->authorize('create', Requisition::class);

        $validated = $request->validate([
            'type' => ['required', 'in:OPEX,CAPEX,PETTY,EMERG'],
            'amount_naira' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['required', 'string', 'size:3'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'cost_centre_id' => ['required', 'integer', 'exists:cost_centres,id'],
            'account_code_id' => ['required', 'integer', 'exists:account_codes,id'],
            'vendor_id' => ['required', 'integer', 'exists:vendors,id'],
            'urgency' => ['required', 'in:standard,urgent,emergency'],
            'description' => ['required', 'string', 'min:20'],
            'supporting_docs' => ['required', 'array', 'min:1'],
            'supporting_docs.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ]);

        // Block writes to closed periods
        ClosedPeriodGuard::assertWriteable(now(), $request->user(), (bool) $request->input('ceo_override'));

        // Convert Naira to kobo (floor at 1 kobo — rejects zero/negative after conversion)
        $amountKobo = MoneyHelper::toKobo((float) $validated['amount_naira']);
        abort_if($amountKobo < 1, 422, 'Amount must be at least ₦0.01.');

        // Store uploaded files
        $docPaths = [];
        foreach ($request->file('supporting_docs', []) as $file) {
            $path = $file->store('docs', 'finance');
            $docPaths[] = $path;
        }

        // Load account code for tax calculation
        $accountCode = AccountCode::findOrFail($validated['account_code_id']);
        $taxes = TaxCalculator::calculate($amountKobo, $accountCode);

        // CAT2-02: CAPEX enforcement — account codes beginning with '95' must use type=CAPEX.
        // Conversely, CAPEX type must use a '95...' account code.
        $isCapexCode = str_starts_with((string) $accountCode->code, '95');
        $isCapexType = strtoupper($validated['type']) === 'CAPEX';

        if ($isCapexCode && ! $isCapexType) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'type' => "Account code {$accountCode->code} is a capital expenditure code. Request type must be CAPEX.",
            ]);
        }

        if ($isCapexType && ! $isCapexCode) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'account_code_id' => 'CAPEX requests must use a capital expenditure account code (starting with 95).',
            ]);
        }

        // WHT is withheld from vendor payment, so net payable can legitimately
        // be lower than the base amount when WHT exceeds VAT.

        // Determine current financial period
        $period = FinancialPeriod::where('year', now()->year)
            ->where('month', now()->month)
            ->where('status', 'open')
            ->first();

        $requisition = DB::transaction(function () use ($validated, $amountKobo, $taxes, $docPaths, $period, $request, $router) {
            $req = Requisition::create([
                'request_id' => Requisition::generateRequestId(),
                'requester_id' => $request->user()->id,
                'type' => $validated['type'],
                'amount_kobo' => $amountKobo,
                'currency' => $validated['currency'],
                'exchange_rate' => $validated['exchange_rate'] ?? 1.0,
                'cost_centre_id' => $validated['cost_centre_id'],
                'account_code_id' => $validated['account_code_id'],
                'vendor_id' => $validated['vendor_id'],
                'urgency' => $validated['urgency'],
                'description' => $validated['description'],
                'supporting_docs' => $docPaths,
                'status' => 'submitted',
                'tax_vat_kobo' => $taxes['vat_kobo'],
                'tax_wht_kobo' => $taxes['wht_kobo'],
                'total_kobo' => $taxes['total_kobo'],
                'financial_period_id' => $period?->id,
                'created_by' => $request->user()->id,
                'submitted_at' => now(),
            ]);

            // Route approval chain
            $steps = $router->route($req);

            // Update status to 'approving'
            $req->update(['status' => 'approving']);

            // Notify first approver
            $firstStep = $steps->first();
            if ($firstStep) {
                $firstStep->approver->notify(new RequisitionSubmitted($req));
            }

            return $req;
        });

        event(new RequisitionStateChanged($requisition, 'draft'));

        return redirect("/finance/requisitions/{$requisition->id}")
            ->with('success', "Request {$requisition->request_id} submitted successfully.");
    }

    // ── My requests list ─────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Requisition::with(['costCentre:id,code,name', 'vendor:id,name', 'accountCode:id,code,description'])
            ->where('requester_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->filled('q')) {
            $q = $request->get('q');
            $query->where(function ($qb) use ($q) {
                $qb->where('request_id', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }

        $requisitions = $query->paginate(20)->through(fn (Requisition $r) => $this->formatForList($r));

        return Inertia::render('Finance/RequisitionListPage', [
            'requisitions' => $requisitions,
            'filters' => $request->only(['status', 'type', 'q']),
        ]);
    }

    // ── Single request detail ─────────────────────────────────────────────────

    public function show(Request $request, int $id): Response
    {
        $requisition = Requisition::with([
            'requester:id,name,department,email',
            'costCentre:id,code,name',
            'accountCode:id,code,description,tax_vat_applicable,tax_wht_applicable,wht_rate',
            'vendor:id,name,bank_name',
            'approvalSteps.approver:id,name,role',
            'financialPeriod:id,year,month,status',
        ])->findOrFail($id);

        $this->authorize('view', $requisition);

        $steps = $requisition->approvalSteps->map(fn (mixed $step) => [
            'id' => $step->id,
            'level' => $step->level,
            'role_label' => $step->role_label,
            'approver' => ['id' => $step->approver->id, 'name' => $step->approver->name, 'role' => $step->approver->role],
            'status' => $step->status,
            'comment' => $step->comment,
            'acted_at' => $step->acted_at?->toISOString(),
            'sla_deadline' => $step->sla_deadline?->toISOString(),
            'is_overdue' => $step->isOverdue(),
        ]);

        return Inertia::render('Finance/RequisitionDetailPage', [
            'requisition' => $this->formatDetail($requisition),
            'steps' => $steps,
            'canApprove' => $this->canCurrentUserApprove($request->user(), $requisition),
        ]);
    }

    // ── Update draft ──────────────────────────────────────────────────────────

    /**
     * CAT2-10: Allow editing a draft requisition. Tax is always recalculated
     * from the current amount and account code so it stays consistent.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $requisition = Requisition::findOrFail($id);
        $this->authorize('update', $requisition);

        $validated = $request->validate([
            'amount_naira' => ['required', 'numeric', 'min:0.01'],
            'account_code_id' => ['required', 'integer', 'exists:account_codes,id'],
            'description' => ['required', 'string', 'min:20'],
            'urgency' => ['required', 'in:standard,urgent,emergency'],
        ]);

        $amountKobo = MoneyHelper::toKobo((float) $validated['amount_naira']);
        $accountCode = AccountCode::findOrFail($validated['account_code_id']);
        $taxes = TaxCalculator::calculate($amountKobo, $accountCode);

        $requisition->update([
            'amount_kobo' => $amountKobo,
            'account_code_id' => $validated['account_code_id'],
            'description' => $validated['description'],
            'urgency' => $validated['urgency'],
            'tax_vat_kobo' => $taxes['vat_kobo'],
            'tax_wht_kobo' => $taxes['wht_kobo'],
            'total_kobo' => $taxes['total_kobo'],
        ]);

        return back()->with('success', "Request {$requisition->request_id} updated.");
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    public function cancel(Request $request, int $id): RedirectResponse
    {
        $requisition = Requisition::findOrFail($id);
        $this->authorize('cancel', $requisition);

        $prev = $requisition->status;
        $requisition->update(['status' => 'cancelled']);

        event(new RequisitionStateChanged($requisition, $prev));

        return back()->with('success', "Request {$requisition->request_id} cancelled.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function formatForList(Requisition $r): array
    {
        return [
            'id' => $r->id,
            'request_id' => $r->request_id,
            'type' => $r->type,
            'amount_kobo' => $r->amount_kobo,
            'amount_fmt' => MoneyHelper::format($r->amount_kobo),
            'total_kobo' => $r->total_kobo,
            'total_fmt' => MoneyHelper::format($r->total_kobo),
            'cost_centre' => $r->costCentre?->code.' '.$r->costCentre?->name,
            'vendor' => $r->vendor?->name,
            'status' => $r->status,
            'urgency' => $r->urgency,
            'submitted_at' => $r->submitted_at?->toDateString(),
            'created_at' => $r->created_at->toDateString(),
        ];
    }

    private function formatDetail(Requisition $r): array
    {
        return [
            'id' => $r->id,
            'request_id' => $r->request_id,
            'type' => $r->type,
            'amount_kobo' => $r->amount_kobo,
            'amount_fmt' => MoneyHelper::format($r->amount_kobo),
            'currency' => $r->currency,
            'tax_vat_kobo' => $r->tax_vat_kobo,
            'tax_vat_fmt' => MoneyHelper::format($r->tax_vat_kobo),
            'tax_wht_kobo' => $r->tax_wht_kobo,
            'tax_wht_fmt' => MoneyHelper::format($r->tax_wht_kobo),
            'total_kobo' => $r->total_kobo,
            'total_fmt' => MoneyHelper::format($r->total_kobo),
            'cost_centre' => $r->costCentre ? ['code' => $r->costCentre->code, 'name' => $r->costCentre->name] : null,
            'account_code' => $r->accountCode ? ['code' => $r->accountCode->code, 'description' => $r->accountCode->description] : null,
            'vendor' => $r->vendor ? ['name' => $r->vendor->name, 'bank_name' => $r->vendor->bank_name] : null,
            'requester' => $r->requester ? ['id' => $r->requester->id, 'name' => $r->requester->name, 'department' => $r->requester->department] : null,
            'urgency' => $r->urgency,
            'description' => $r->description,
            'supporting_docs' => $r->supporting_docs ?? [],
            'status' => $r->status,
            'needs_board' => $r->needs_board_approval,
            'submitted_at' => $r->submitted_at?->toISOString(),
            'approved_at' => $r->approved_at?->toISOString(),
            'period' => $r->financialPeriod ? "{$r->financialPeriod->year}-".str_pad((string) $r->financialPeriod->month, 2, '0', STR_PAD_LEFT) : null,
            'created_at' => $r->created_at->toISOString(),
        ];
    }

    private function canCurrentUserApprove(\App\Models\User $user, Requisition $requisition): bool
    {
        $currentStep = $requisition->currentStep();

        return $currentStep !== null
            && $currentStep->approver_id === $user->id
            && $requisition->requester_id !== $user->id;
    }
}
