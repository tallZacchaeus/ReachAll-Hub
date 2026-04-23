<?php

namespace App\Http\Controllers\Compensation;

use App\Http\Controllers\Controller;
use App\Models\CompensationBand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CompensationBandController extends Controller
{
    private function authorise(): void
    {
        abort_unless(Auth::user()?->hasPermission('compensation.manage'), 403);
    }

    public function index(): Response
    {
        $this->authorise();

        $bands = CompensationBand::orderBy('category')->orderBy('grade')->get();

        return Inertia::render('Compensation/CompensationBandsPage', [
            'bands' => $bands,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'grade'          => ['required', 'string', 'max:50'],
            'title'          => ['required', 'string', 'max:150'],
            'category'       => ['required', 'in:individual_contributor,manager,executive'],
            'min_kobo'       => ['required', 'integer', 'min:0'],
            'midpoint_kobo'  => ['required', 'integer', 'gt:min_kobo'],
            'max_kobo'       => ['required', 'integer', 'gt:midpoint_kobo'],
            'effective_date' => ['required', 'date'],
            'notes'          => ['nullable', 'string', 'max:1000'],
        ]);

        CompensationBand::create(array_merge($validated, ['is_active' => true]));

        return back()->with('success', 'Salary band created.');
    }

    public function update(Request $request, CompensationBand $compensationBand): RedirectResponse
    {
        $this->authorise();

        $validated = $request->validate([
            'title'          => ['required', 'string', 'max:150'],
            'category'       => ['required', 'in:individual_contributor,manager,executive'],
            'min_kobo'       => ['required', 'integer', 'min:0'],
            'midpoint_kobo'  => ['required', 'integer', 'gt:min_kobo'],
            'max_kobo'       => ['required', 'integer', 'gt:midpoint_kobo'],
            'effective_date' => ['required', 'date'],
            'is_active'      => ['boolean'],
            'notes'          => ['nullable', 'string', 'max:1000'],
        ]);

        $compensationBand->update($validated);

        return back()->with('success', 'Salary band updated.');
    }

    public function destroy(CompensationBand $compensationBand): RedirectResponse
    {
        $this->authorise();

        $compensationBand->delete();

        return back()->with('success', 'Salary band deleted.');
    }
}
