<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrgChartController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(
            $request->user()?->hasPermission('admin.dashboard'),
            403,
            'You do not have access to the org chart.'
        );

        // Load all active employees with their direct org data
        $employees = User::where('status', 'active')
            ->with(['jobPosition:id,title', 'departmentEntity:id,name'])
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id', 'department', 'position', 'role',
                'department_id', 'job_position_id', 'reports_to_id', 'avatar'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'employee_id' => $u->employee_id,
                'title' => $u->jobPosition?->title ?? $u->position,
                'department' => $u->departmentEntity?->name ?? $u->department,
                'role' => $u->role,
                'reports_to_id' => $u->reports_to_id,
                'avatar' => $u->avatar ?? null,
            ]);

        return Inertia::render('Admin/OrgChartPage', [
            'employees' => $employees,
        ]);
    }
}
