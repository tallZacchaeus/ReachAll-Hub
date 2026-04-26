<?php

namespace App\Http\Controllers\Compensation;

use App\Http\Controllers\Controller;
use App\Models\BonusAward;
use App\Models\BonusPlan;
use App\Models\User;
use App\Services\Finance\MoneyHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BonusPlanController extends Controller
{
    private function authorise(): void
    {
        abort_unless(Auth::user()?->hasPermission('compensation.manage'), 403);
    }

    public function index(): Response
    {
        $this->authorise();

        $plans = BonusPlan::withCount('awards')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'bonus_type' => $p->bonus_type,
                'period_label' => $p->period_label,
                'total_budget' => MoneyHelper::format($p->total_budget_kobo),
                'committed' => MoneyHelper::format($p->committedKobo()),
                'remaining' => MoneyHelper::format($p->remainingBudgetKobo()),
                'status' => $p->status,
                'payout_date' => $p->payout_date?->toDateString(),
                'awards_count' => $p->awards_count,
            ]);

        $employees = User::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id', 'department']);

        return Inertia::render('Compensation/BonusManagementPage', [
            'plans' => $plans,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'bonus_type' => ['required', 'in:annual,performance,spot,referral,retention,signing,other'],
            'period_label' => ['nullable', 'string', 'max:100'],
            'total_budget_kobo' => ['required', 'integer', 'min:0'],
            'payout_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        BonusPlan::create(array_merge($validated, [
            'status' => 'draft',
            'created_by_id' => Auth::id(),
        ]));

        return back()->with('success', 'Bonus plan created.');
    }

    public function activate(BonusPlan $bonusPlan): RedirectResponse
    {
        $this->authorise();

        abort_unless($bonusPlan->status === 'draft', 422, 'Only draft plans can be activated.');

        $bonusPlan->update(['status' => 'active']);

        return back()->with('success', 'Bonus plan activated.');
    }

    public function close(BonusPlan $bonusPlan): RedirectResponse
    {
        $this->authorise();

        abort_unless($bonusPlan->status === 'active', 422, 'Only active plans can be closed.');

        $bonusPlan->update(['status' => 'closed']);

        return back()->with('success', 'Bonus plan closed.');
    }

    /** Add or update an award for a specific employee within a plan. */
    public function addAward(Request $request, BonusPlan $bonusPlan): RedirectResponse
    {
        $this->authorise();

        abort_unless($bonusPlan->status === 'active', 422, 'Awards can only be added to active plans.');

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'amount_kobo' => ['required', 'integer', 'min:1'],
            'rationale' => ['nullable', 'string', 'max:1000'],
        ]);

        BonusAward::updateOrCreate(
            ['bonus_plan_id' => $bonusPlan->id, 'user_id' => $validated['user_id']],
            ['amount_kobo' => $validated['amount_kobo'], 'rationale' => $validated['rationale'], 'status' => 'draft']
        );

        return back()->with('success', 'Award saved.');
    }

    /** Approve a single award. */
    public function approveAward(BonusAward $bonusAward): RedirectResponse
    {
        $this->authorise();

        abort_unless($bonusAward->status === 'draft', 422, 'Only draft awards can be approved.');

        $bonusAward->update([
            'status' => 'approved',
            'approved_by_id' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Award approved.');
    }

    /** Mark an award as paid. */
    public function markPaid(BonusAward $bonusAward): RedirectResponse
    {
        $this->authorise();

        abort_unless($bonusAward->status === 'approved', 422, 'Only approved awards can be marked paid.');

        $bonusAward->update(['status' => 'paid', 'paid_at' => now()]);

        return back()->with('success', 'Award marked as paid.');
    }

    /** Remove a draft award. */
    public function removeAward(BonusAward $bonusAward): RedirectResponse
    {
        $this->authorise();

        abort_unless($bonusAward->status === 'draft', 422, 'Only draft awards can be removed.');

        $bonusAward->delete();

        return back()->with('success', 'Award removed.');
    }
}
