<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\Vendor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorise($request->user());

        $query = Vendor::orderBy('name');

        if ($request->filled('q')) {
            $q = $request->get('q');
            $query->where(function ($qb) use ($q) {
                $qb->where('name', 'like', "%{$q}%")
                   ->orWhere('contact_email', 'like', "%{$q}%")
                   ->orWhere('tax_id', 'like', "%{$q}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $vendors = $query->get()->map(fn (Vendor $v) => [
            'id'            => $v->id,
            'name'          => $v->name,
            'tax_id'        => $v->tax_id,
            'bank_name'     => $v->bank_name,
            'bank_account'  => $v->bank_account,
            'contact_email' => $v->contact_email,
            'contact_phone' => $v->contact_phone,
            'status'        => $v->status,
        ]);

        return Inertia::render('Finance/VendorAdminPage', [
            'vendors' => $vendors,
            'filters' => $request->only(['q', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise($request->user());

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:200', 'unique:vendors,name'],
            'tax_id'        => ['nullable', 'string', 'max:50'],
            'bank_name'     => ['nullable', 'string', 'max:100'],
            'bank_account'  => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:200'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'status'        => ['required', 'in:active,inactive'],
        ]);

        Vendor::create(array_merge($validated, ['created_by' => $request->user()->id]));

        return back()->with('success', 'Vendor created.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->authorise($request->user());

        $vendor = Vendor::findOrFail($id);

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:200', "unique:vendors,name,{$id}"],
            'tax_id'        => ['nullable', 'string', 'max:50'],
            'bank_name'     => ['nullable', 'string', 'max:100'],
            'bank_account'  => ['nullable', 'string', 'max:20'],
            'contact_email' => ['nullable', 'email', 'max:200'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'status'        => ['required', 'in:active,inactive'],
        ]);

        $vendor->update($validated);

        return back()->with('success', 'Vendor updated.');
    }

    /**
     * Archive a vendor instead of deleting.
     * Financial principle: never hard-delete entities with transaction history.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->authorise($request->user());

        $vendor = Vendor::findOrFail($id);
        $vendor->update(['status' => 'archived']);

        return back()->with('success', 'Vendor archived successfully.');
    }

    private function authorise(User $user): void
    {
        if (! $user->isFinanceAdmin()) {
            abort(403);
        }
    }
}
