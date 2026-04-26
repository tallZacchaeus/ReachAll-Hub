<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\RbacAuditLog;
use App\Models\Role;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    private function authorise(Request $request): void
    {
        abort_unless(
            $request->user()?->hasPermission('roles.manage'),
            403,
            'You do not have permission to manage roles.'
        );
    }

    public function index(Request $request): Response
    {
        $this->authorise($request);

        $roles = Role::orderBy('name')->get()->map(fn (Role $r) => [
            'id' => $r->id,
            'name' => $r->name,
            'label' => $r->label,
            'description' => $r->description,
            'is_system' => $r->is_system,
            'permissions' => DB::table('role_permissions as rp')
                ->join('permissions as p', 'p.id', '=', 'rp.permission_id')
                ->where('rp.role', $r->name)
                ->pluck('p.name')
                ->all(),
        ]);

        $permissions = Permission::orderBy('module')->orderBy('name')->get()
            ->map(fn (Permission $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'label' => $p->label,
                'module' => $p->module,
                'description' => $p->description,
            ]);

        return Inertia::render('Admin/RoleManagementPage', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorise($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:roles,name'],
            'label' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role = Role::create([
            'name' => $data['name'],
            'label' => $data['label'],
            'description' => $data['description'] ?? null,
            'is_system' => false,
        ]);

        $this->syncPermissions($role->name, $data['permissions'] ?? []);

        RbacAuditLog::record(
            actorId: $request->user()->id,
            action: 'role.created',
            targetType: 'role',
            targetId: $role->name,
            newValue: ['label' => $role->label, 'permissions' => $data['permissions'] ?? []],
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        PermissionService::clearCache();

        return back()->with('success', "Role \"{$role->label}\" created.");
    }

    public function update(Request $request, Role $role)
    {
        $this->authorise($request);

        $data = $request->validate([
            'label' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $old = ['label' => $role->label, 'permissions' => $this->currentPermissions($role->name)];

        $role->update([
            'label' => $data['label'],
            'description' => $data['description'] ?? null,
        ]);

        $this->syncPermissions($role->name, $data['permissions'] ?? []);

        RbacAuditLog::record(
            actorId: $request->user()->id,
            action: 'role.updated',
            targetType: 'role',
            targetId: $role->name,
            oldValue: $old,
            newValue: ['label' => $data['label'], 'permissions' => $data['permissions'] ?? []],
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        PermissionService::clearCache();

        return back()->with('success', "Role \"{$role->label}\" updated.");
    }

    public function destroy(Request $request, Role $role)
    {
        $this->authorise($request);

        abort_if($role->is_system || $role->name === 'superadmin', 403, "System role \"{$role->label}\" cannot be deleted.");

        $old = ['label' => $role->label, 'permissions' => $this->currentPermissions($role->name)];

        DB::table('role_permissions')->where('role', $role->name)->delete();
        $role->delete();

        RbacAuditLog::record(
            actorId: $request->user()->id,
            action: 'role.deleted',
            targetType: 'role',
            targetId: $role->name,
            oldValue: $old,
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );

        PermissionService::clearCache();

        return back()->with('success', "Role \"{$role->label}\" deleted.");
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private function syncPermissions(string $roleName, array $permissionNames): void
    {
        $ids = DB::table('permissions')
            ->whereIn('name', $permissionNames)
            ->pluck('id')
            ->all();

        DB::table('role_permissions')->where('role', $roleName)->delete();

        $inserts = array_map(fn (int $id) => [
            'role' => $roleName,
            'permission_id' => $id,
            'created_at' => now(),
            'updated_at' => now(),
        ], $ids);

        if ($inserts) {
            DB::table('role_permissions')->insert($inserts);
        }
    }

    private function currentPermissions(string $roleName): array
    {
        return DB::table('role_permissions as rp')
            ->join('permissions as p', 'p.id', '=', 'rp.permission_id')
            ->where('rp.role', $roleName)
            ->pluck('p.name')
            ->all();
    }
}
