<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\AccountCode;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountCodeController extends Controller
{
    private const CATEGORIES = ['5000', '6000', '7000', '8000', '9000', '9500'];

    public function index(Request $request): Response
    {
        $this->authorise($request->user());

        $query = AccountCode::orderBy('code');

        if ($request->filled('category')) {
            $query->where('category', $request->get('category'));
        }

        if ($request->filled('q')) {
            $q = $request->get('q');
            $query->where(function ($qb) use ($q) {
                $qb->where('code', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $codes = $query->get()->map(fn (AccountCode $ac) => [
            'id' => $ac->id,
            'code' => $ac->code,
            'category' => $ac->category,
            'category_label' => $ac->category_label,
            'description' => $ac->description,
            'tax_vat_applicable' => $ac->tax_vat_applicable,
            'tax_wht_applicable' => $ac->tax_wht_applicable,
            'wht_rate' => $ac->wht_rate,
            'status' => $ac->status,
        ]);

        return Inertia::render('Finance/AccountCodeAdminPage', [
            'codes' => $codes,
            'categories' => self::CATEGORIES,
            'filters' => $request->only(['q', 'category', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise($request->user());

        $validated = $request->validate([
            'code' => ['required', 'string', 'size:4', 'unique:account_codes,code'],
            'category' => ['required', 'in:'.implode(',', self::CATEGORIES)],
            'description' => ['required', 'string', 'max:200'],
            'tax_vat_applicable' => ['boolean'],
            'tax_wht_applicable' => ['boolean'],
            'wht_rate' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        AccountCode::create(array_merge($validated, ['created_by' => $request->user()->id]));

        return back()->with('success', 'Account code created.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->authorise($request->user());

        $ac = AccountCode::findOrFail($id);

        $validated = $request->validate([
            'category' => ['required', 'in:'.implode(',', self::CATEGORIES)],
            'description' => ['required', 'string', 'max:200'],
            'tax_vat_applicable' => ['boolean'],
            'tax_wht_applicable' => ['boolean'],
            'wht_rate' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $ac->update($validated);

        return back()->with('success', 'Account code updated.');
    }

    private function authorise(User $user): void
    {
        if (! $user->isFinanceAdmin()) {
            abort(403);
        }
    }
}
