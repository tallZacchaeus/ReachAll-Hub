<?php

namespace App\Http\Controllers\Expenses;

use App\Http\Controllers\Controller;
use App\Models\ExpenseClaim;
use App\Models\ExpenseReceipt;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExpenseController extends Controller
{
    // ── Admin / HR / Finance index ────────────────────────────────────────────

    /**
     * Finance/HR sees all claims (paginated, filterable).
     * Regular employees see only their own claims.
     */
    public function index(Request $request): Response
    {
        $user  = $request->user();
        $isAdminView = $user->hasPermission('expenses.approve') || $user->hasPermission('expenses.finance');

        $query = ExpenseClaim::with([
            'user:id,name,employee_id',
            'receipts:id,expense_claim_id',
        ])->orderByDesc('created_at');

        if (! $isAdminView) {
            $query->where('user_id', $user->id);
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->filled('category')) {
            $query->where('category', $request->get('category'));
        }
        if ($request->filled('date_from')) {
            $query->where('expense_date', '>=', $request->get('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where('expense_date', '<=', $request->get('date_to'));
        }

        $claims = $query->paginate(25)->through(fn (ExpenseClaim $c) => $this->formatForList($c));

        // Admin stats
        $stats = null;
        if ($isAdminView) {
            $stats = [
                'pending_count' => ExpenseClaim::where('status', 'submitted')->count(),
                'pending_ngn'   => ExpenseClaim::where('status', 'submitted')->sum('amount_ngn_kobo') / 100,
                'approved_count' => ExpenseClaim::where('status', 'approved')->count(),
                'approved_ngn'   => ExpenseClaim::where('status', 'approved')->sum('amount_ngn_kobo') / 100,
                'paid_month_count' => ExpenseClaim::where('status', 'paid')
                    ->whereMonth('finance_paid_at', now()->month)
                    ->whereYear('finance_paid_at', now()->year)
                    ->count(),
                'paid_month_ngn' => ExpenseClaim::where('status', 'paid')
                    ->whereMonth('finance_paid_at', now()->month)
                    ->whereYear('finance_paid_at', now()->year)
                    ->sum('amount_ngn_kobo') / 100,
            ];
        }

        return Inertia::render('Expenses/ExpenseClaimsPage', [
            'claims'      => $claims,
            'stats'       => $stats,
            'isAdminView' => $isAdminView,
            'filters'     => $request->only(['status', 'category', 'date_from', 'date_to']),
            'canApprove'  => $user->hasPermission('expenses.approve'),
            'canFinance'  => $user->hasPermission('expenses.finance'),
        ]);
    }

    // ── Employee self-service ─────────────────────────────────────────────────

    public function myExpenses(Request $request): Response
    {
        $user = $request->user();

        $claims = ExpenseClaim::with(['receipts:id,expense_claim_id'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(25)
            ->through(fn (ExpenseClaim $c) => $this->formatForList($c));

        return Inertia::render('Expenses/MyExpensesPage', [
            'claims' => $claims,
        ]);
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    public function show(Request $request, ExpenseClaim $expenseClaim): Response
    {
        $user = $request->user();

        // Owner, approver, or finance can view
        if (
            $expenseClaim->user_id !== $user->id
            && ! $user->hasPermission('expenses.approve')
            && ! $user->hasPermission('expenses.finance')
        ) {
            abort(403);
        }

        $expenseClaim->load([
            'user:id,name,employee_id',
            'receipts',
            'reviewedBy:id,name',
            'financePayBy:id,name',
        ]);

        return Inertia::render('Expenses/ExpenseClaimPage', [
            'claim'     => $this->formatDetail($expenseClaim),
            'canApprove' => $user->hasPermission('expenses.approve') && $expenseClaim->status === 'submitted',
            'canFinance' => $user->hasPermission('expenses.finance') && $expenseClaim->status === 'approved',
            'isOwner'   => $expenseClaim->user_id === $user->id,
        ]);
    }

    // ── Store draft ───────────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()->hasPermission('expenses.submit')) {
            abort(403);
        }

        $validated = $request->validate([
            'title'         => ['required', 'string', 'max:200'],
            'description'   => ['nullable', 'string', 'max:5000'],
            'category'      => ['required', 'in:travel,accommodation,meals,equipment,training,communication,medical,other'],
            'currency'      => ['required', 'string', 'size:3'],
            'amount'        => ['required', 'numeric', 'min:0.01'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.000001'],
            'expense_date'  => ['required', 'date', 'before_or_equal:today'],
            'receipts'      => ['nullable', 'array'],
            'receipts.*'    => ['file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
        ]);

        // Force exchange_rate to 1 when currency is NGN
        $exchangeRate = strtoupper($validated['currency']) === 'NGN'
            ? 1.0
            : (float) ($validated['exchange_rate'] ?? 1.0);

        // Server-side derived kobo amount — never trust client
        $amountNgnKobo = (int) round((float) $validated['amount'] * $exchangeRate * 100);

        $claim = ExpenseClaim::create([
            'user_id'        => $request->user()->id,
            'title'          => $validated['title'],
            'description'    => $validated['description'] ?? null,
            'category'       => $validated['category'],
            'currency'       => strtoupper($validated['currency']),
            'amount'         => $validated['amount'],
            'exchange_rate'  => $exchangeRate,
            'amount_ngn_kobo' => $amountNgnKobo,
            'expense_date'   => $validated['expense_date'],
            'status'         => 'draft',
        ]);

        // Upload any immediately attached receipts
        foreach ($request->file('receipts', []) as $file) {
            $path = $file->store("expenses/{$claim->id}", 'hr');
            $claim->receipts()->create([
                'file_path'         => $path,
                'disk'              => 'hr',
                'original_filename' => $file->getClientOriginalName(),
                'mime_type'         => $file->getMimeType(),
                'file_size_bytes'   => $file->getSize(),
            ]);
        }

        AuditLogger::record(
            'expenses',
            'expense.created',
            ExpenseClaim::class,
            $claim->id,
            null,
            ['title' => $claim->title, 'status' => 'draft'],
            $request,
        );

        return redirect(route('expenses.show', $claim))
            ->with('success', 'Expense claim created as draft.');
    }

    // ── Submit draft → submitted ──────────────────────────────────────────────

    public function submit(Request $request, ExpenseClaim $expenseClaim): RedirectResponse
    {
        // Only the owner can submit their own draft
        if ($expenseClaim->user_id !== $request->user()->id) {
            abort(403, 'You can only submit your own expense claims.');
        }

        if ($expenseClaim->status !== 'draft') {
            return back()->with('error', 'Only draft claims can be submitted.');
        }

        $old = $expenseClaim->status;
        $expenseClaim->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
        ]);

        AuditLogger::record(
            'expenses',
            'expense.submitted',
            ExpenseClaim::class,
            $expenseClaim->id,
            ['status' => $old],
            ['status' => 'submitted', 'submitted_at' => now()->toISOString()],
            $request,
        );

        return back()->with('success', 'Expense claim submitted for approval.');
    }

    // ── Approve ───────────────────────────────────────────────────────────────

    public function approve(Request $request, ExpenseClaim $expenseClaim): RedirectResponse
    {
        if (! $request->user()->hasPermission('expenses.approve')) {
            abort(403);
        }

        if ($expenseClaim->status !== 'submitted') {
            return back()->with('error', 'Only submitted claims can be approved.');
        }

        $validated = $request->validate([
            'review_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $old = $expenseClaim->status;
        $expenseClaim->update([
            'status'         => 'approved',
            'reviewed_by_id' => $request->user()->id,
            'reviewed_at'    => now(),
            'review_notes'   => $validated['review_notes'] ?? null,
        ]);

        AuditLogger::record(
            'expenses',
            'expense.approved',
            ExpenseClaim::class,
            $expenseClaim->id,
            ['status' => $old],
            ['status' => 'approved', 'reviewed_by_id' => $request->user()->id],
            $request,
        );

        return back()->with('success', 'Expense claim approved.');
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    public function reject(Request $request, ExpenseClaim $expenseClaim): RedirectResponse
    {
        if (! $request->user()->hasPermission('expenses.approve')) {
            abort(403);
        }

        if ($expenseClaim->status !== 'submitted') {
            return back()->with('error', 'Only submitted claims can be rejected.');
        }

        $validated = $request->validate([
            'review_notes' => ['required', 'string', 'max:2000'],
        ]);

        $old = $expenseClaim->status;
        $expenseClaim->update([
            'status'         => 'rejected',
            'reviewed_by_id' => $request->user()->id,
            'reviewed_at'    => now(),
            'review_notes'   => $validated['review_notes'],
        ]);

        AuditLogger::record(
            'expenses',
            'expense.rejected',
            ExpenseClaim::class,
            $expenseClaim->id,
            ['status' => $old],
            ['status' => 'rejected', 'review_notes' => $validated['review_notes']],
            $request,
        );

        return back()->with('success', 'Expense claim rejected.');
    }

    // ── Mark Paid ─────────────────────────────────────────────────────────────

    public function markPaid(Request $request, ExpenseClaim $expenseClaim): RedirectResponse
    {
        if (! $request->user()->hasPermission('expenses.finance')) {
            abort(403);
        }

        if ($expenseClaim->status !== 'approved') {
            return back()->with('error', 'Only approved claims can be marked as paid.');
        }

        $old = $expenseClaim->status;
        $expenseClaim->update([
            'status'              => 'paid',
            'finance_paid_by_id'  => $request->user()->id,
            'finance_paid_at'     => now(),
        ]);

        AuditLogger::record(
            'expenses',
            'expense.paid',
            ExpenseClaim::class,
            $expenseClaim->id,
            ['status' => $old],
            ['status' => 'paid', 'finance_paid_by_id' => $request->user()->id],
            $request,
        );

        return back()->with('success', 'Expense claim marked as paid.');
    }

    // ── Add Receipt ───────────────────────────────────────────────────────────

    public function addReceipt(Request $request, ExpenseClaim $expenseClaim): RedirectResponse
    {
        $user = $request->user();

        // Owner only, and only on draft/submitted claims
        if ($expenseClaim->user_id !== $user->id) {
            abort(403, 'You can only add receipts to your own expense claims.');
        }

        if (! in_array($expenseClaim->status, ['draft', 'submitted'], true)) {
            return back()->with('error', 'Receipts can only be added to draft or submitted claims.');
        }

        $request->validate([
            'receipt'     => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'description' => ['nullable', 'string', 'max:300'],
        ]);

        $file = $request->file('receipt');
        $path = $file->store("expenses/{$expenseClaim->id}", 'hr');

        $receipt = $expenseClaim->receipts()->create([
            'file_path'         => $path,
            'disk'              => 'hr',
            'original_filename' => $file->getClientOriginalName(),
            'mime_type'         => $file->getMimeType(),
            'file_size_bytes'   => $file->getSize(),
            'description'       => $request->input('description'),
        ]);

        AuditLogger::record(
            'expenses',
            'expense.receipt.uploaded',
            ExpenseReceipt::class,
            $receipt->id,
            null,
            ['expense_claim_id' => $expenseClaim->id, 'filename' => $file->getClientOriginalName()],
            $request,
        );

        return back()->with('success', 'Receipt uploaded successfully.');
    }

    // ── Download Receipt ──────────────────────────────────────────────────────

    public function downloadReceipt(Request $request, ExpenseReceipt $expenseReceipt): StreamedResponse
    {
        $user  = $request->user();
        $claim = $expenseReceipt->expenseClaim;

        // Owner, approver, or finance team can download
        if (
            $claim->user_id !== $user->id
            && ! $user->hasPermission('expenses.approve')
            && ! $user->hasPermission('expenses.finance')
        ) {
            abort(403);
        }

        $disk = $expenseReceipt->disk ?: 'hr';

        if (! Storage::disk($disk)->exists($expenseReceipt->file_path)) {
            abort(404, 'Receipt file not found.');
        }

        return Storage::disk($disk)->download(
            $expenseReceipt->file_path,
            $expenseReceipt->original_filename,
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function formatForList(ExpenseClaim $c): array
    {
        return [
            'id'              => $c->id,
            'title'           => $c->title,
            'category'        => $c->category,
            'currency'        => $c->currency,
            'amount'          => (float) $c->amount,
            'exchange_rate'   => (float) $c->exchange_rate,
            'amount_ngn_kobo' => $c->amount_ngn_kobo,
            'amount_ngn'      => $c->amountNgn(),
            'expense_date'    => $c->expense_date?->toDateString(),
            'status'          => $c->status,
            'submitted_at'    => $c->submitted_at?->toISOString(),
            'receipts_count'  => $c->receipts->count(),
            'user'            => $c->user
                ? ['id' => $c->user->id, 'name' => $c->user->name, 'employee_id' => $c->user->employee_id]
                : null,
        ];
    }

    private function formatDetail(ExpenseClaim $c): array
    {
        return [
            'id'              => $c->id,
            'title'           => $c->title,
            'description'     => $c->description,
            'category'        => $c->category,
            'currency'        => $c->currency,
            'amount'          => (float) $c->amount,
            'exchange_rate'   => (float) $c->exchange_rate,
            'amount_ngn_kobo' => $c->amount_ngn_kobo,
            'amount_ngn'      => $c->amountNgn(),
            'expense_date'    => $c->expense_date?->toDateString(),
            'status'          => $c->status,
            'submitted_at'    => $c->submitted_at?->toISOString(),
            'reviewed_at'     => $c->reviewed_at?->toISOString(),
            'review_notes'    => $c->review_notes,
            'finance_paid_at' => $c->finance_paid_at?->toISOString(),
            'user'            => $c->user
                ? ['id' => $c->user->id, 'name' => $c->user->name, 'employee_id' => $c->user->employee_id]
                : null,
            'reviewed_by'     => $c->reviewedBy
                ? ['id' => $c->reviewedBy->id, 'name' => $c->reviewedBy->name]
                : null,
            'finance_paid_by' => $c->financePayBy
                ? ['id' => $c->financePayBy->id, 'name' => $c->financePayBy->name]
                : null,
            'receipts'        => $c->receipts->map(fn (ExpenseReceipt $r) => [
                'id'                => $r->id,
                'original_filename' => $r->original_filename,
                'mime_type'         => $r->mime_type,
                'file_size_bytes'   => $r->file_size_bytes,
                'description'       => $r->description,
                'created_at'        => $r->created_at?->toISOString(),
            ])->values()->all(),
        ];
    }
}
