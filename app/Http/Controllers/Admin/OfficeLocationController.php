<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OfficeLocation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OfficeLocationController extends Controller
{
    private function authorise(Request $request): void
    {
        abort_unless(
            $request->user()?->hasPermission('org.manage'),
            403,
            'You do not have permission to manage org structure.'
        );
    }

    public function index(Request $request): Response
    {
        $this->authorise($request);

        $locations = OfficeLocation::orderBy('name')
            ->get()
            ->map(fn (OfficeLocation $l) => [
                'id' => $l->id,
                'code' => $l->code,
                'name' => $l->name,
                'address' => $l->address,
                'city' => $l->city,
                'state' => $l->state,
                'country' => $l->country,
                'is_active' => $l->is_active,
                'employee_count' => $l->employees()->count(),
            ]);

        return Inertia::render('Admin/OrgStructurePage', [
            'tab' => 'locations',
            'locations' => $locations,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorise($request);

        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', 'alpha_dash', 'unique:office_locations,code'],
            'name' => ['required', 'string', 'max:200'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
        ]);

        $loc = OfficeLocation::create($data);

        return back()->with('success', "Location \"{$loc->name}\" created.");
    }

    public function update(Request $request, OfficeLocation $officeLocation)
    {
        $this->authorise($request);

        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', 'alpha_dash', Rule::unique('office_locations', 'code')->ignore($officeLocation->id)],
            'name' => ['required', 'string', 'max:200'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
        ]);

        $officeLocation->update($data);

        return back()->with('success', "Location \"{$officeLocation->name}\" updated.");
    }

    public function destroy(Request $request, OfficeLocation $officeLocation)
    {
        $this->authorise($request);

        abort_if(
            $officeLocation->employees()->exists(),
            422,
            "Cannot delete \"{$officeLocation->name}\" — employees are assigned to this location."
        );

        $officeLocation->delete();

        return back()->with('success', "Location \"{$officeLocation->name}\" deleted.");
    }
}
