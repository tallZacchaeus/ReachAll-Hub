<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\EmployeeLifecycleEvent;
use App\Models\User;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
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

        $departments = Department::with(['parent', 'head:id,name,employee_id'])
            ->orderBy('name')
            ->get()
            ->map(fn (Department $d) => [
                'id'                   => $d->id,
                'code'                 => $d->code,
                'name'                 => $d->name,
                'description'          => $d->description,
                'parent_department_id' => $d->parent_department_id,
                'parent_name'          => $d->parent?->name,
                'head_user_id'         => $d->head_user_id,
                'head_name'            => $d->head?->name,
                'is_active'            => $d->is_active,
                'employee_count'       => $d->employees()->count(),
            ]);

        $managers = User::whereIn('role', ['management', 'hr', 'general_management', 'ceo', 'superadmin'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id', 'department']);

        return Inertia::render('Admin/OrgStructurePage', [
            'tab'         => 'departments',
            'departments' => $departments,
            'managers'    => $managers,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorise($request);

        $data = $request->validate([
            'code'                 => ['required', 'string', 'max:20', 'alpha_dash', 'unique:departments,code'],
            'name'                 => ['required', 'string', 'max:200'],
            'description'          => ['nullable', 'string', 'max:1000'],
            'parent_department_id' => ['nullable', 'exists:departments,id'],
            'head_user_id'         => ['nullable', 'exists:users,id'],
            'is_active'            => ['boolean'],
        ]);

        $dept = Department::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        PermissionService::clearCache();

        return back()->with('success', "Department \"{$dept->name}\" created.");
    }

    public function update(Request $request, Department $department)
    {
        $this->authorise($request);

        $data = $request->validate([
            'code'                 => ['required', 'string', 'max:20', 'alpha_dash', Rule::unique('departments', 'code')->ignore($department->id)],
            'name'                 => ['required', 'string', 'max:200'],
            'description'          => ['nullable', 'string', 'max:1000'],
            'parent_department_id' => ['nullable', 'exists:departments,id', function ($attr, $value, $fail) use ($department) {
                // Prevent a department from being its own ancestor
                if ((int) $value === $department->id) {
                    $fail('A department cannot be its own parent.');
                }
            }],
            'head_user_id'         => ['nullable', 'exists:users,id'],
            'is_active'            => ['boolean'],
        ]);

        $department->update($data);

        return back()->with('success', "Department \"{$department->name}\" updated.");
    }

    public function destroy(Request $request, Department $department)
    {
        $this->authorise($request);

        abort_if(
            $department->employees()->exists() || $department->children()->exists(),
            422,
            "Cannot delete \"{$department->name}\" — it still has employees or sub-departments."
        );

        $department->delete();

        return back()->with('success', "Department \"{$department->name}\" deleted.");
    }
}
