<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\PermissionService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    // ── User::hasPermission ─────────────────────────────────────────────────

    public function test_superadmin_bypasses_all_permission_checks(): void
    {
        $user = User::factory()->create(['role' => 'superadmin']);

        $this->assertTrue($user->hasPermission('roles.manage'));
        $this->assertTrue($user->hasPermission('finance.go-live'));
        $this->assertTrue($user->hasPermission('nonexistent.permission'));
    }

    public function test_user_with_permission_returns_true(): void
    {
        $user = User::factory()->create(['role' => 'hr']);

        $this->assertTrue($user->hasPermission('staff.enroll'));
        $this->assertTrue($user->hasPermission('profile.review'));
    }

    public function test_user_without_permission_returns_false(): void
    {
        $user = User::factory()->create(['role' => 'staff']);

        $this->assertFalse($user->hasPermission('staff.enroll'));
        $this->assertFalse($user->hasPermission('roles.manage'));
        $this->assertFalse($user->hasPermission('finance.admin'));
    }

    public function test_unknown_permission_returns_false_for_non_superadmin(): void
    {
        $user = User::factory()->create(['role' => 'hr']);

        $this->assertFalse($user->hasPermission('nonexistent.permission'));
    }

    public function test_superadmin_get_permissions_returns_all_permissions(): void
    {
        $user = User::factory()->create(['role' => 'superadmin']);
        $allCount = Permission::count();

        $this->assertCount($allCount, $user->getPermissions());
    }

    public function test_staff_get_permissions_returns_only_assigned_permissions(): void
    {
        $user = User::factory()->create(['role' => 'staff']);
        $permissions = $user->getPermissions();

        $this->assertContains('finance.access', $permissions);
        $this->assertNotContains('staff.enroll', $permissions);
    }

    // ── PermissionService cache ─────────────────────────────────────────────

    public function test_permission_service_caches_role_map(): void
    {
        Cache::flush();

        PermissionService::permissionsForRole('hr');

        $this->assertTrue(Cache::has('rbac:role_permissions'));
    }

    public function test_permission_service_clear_cache_removes_key(): void
    {
        PermissionService::permissionsForRole('hr');
        PermissionService::clearCache();

        $this->assertFalse(Cache::has('rbac:role_permissions'));
    }

    // ── RoleController — authentication ─────────────────────────────────────

    public function test_guest_is_redirected_from_roles_index(): void
    {
        $this->get('/admin/roles')->assertRedirect(route('login'));
    }

    public function test_guest_cannot_post_to_roles_store(): void
    {
        $this->post('/admin/roles', [])->assertRedirect(route('login'));
    }

    // ── RoleController — authorisation ──────────────────────────────────────

    public function test_staff_without_roles_manage_cannot_access_roles_index(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'staff']))
            ->get('/admin/roles')
            ->assertForbidden();
    }

    public function test_hr_without_roles_manage_cannot_access_roles_index(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->get('/admin/roles')
            ->assertForbidden();
    }

    public function test_superadmin_can_access_roles_index(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->get('/admin/roles')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/RoleManagementPage')
                ->has('roles')
                ->has('permissions')
            );
    }

    // ── RoleController — store ───────────────────────────────────────────────

    public function test_superadmin_can_create_a_custom_role(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->post('/admin/roles', [
                'name' => 'content_editor',
                'label' => 'Content Editor',
                'description' => 'Manages content only',
                'permissions' => ['content.manage'],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('roles', ['name' => 'content_editor', 'is_system' => 0]);
        $this->assertTrue(
            DB::table('role_permissions')
                ->where('role', 'content_editor')
                ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                ->where('permissions.name', 'content.manage')
                ->exists()
        );
    }

    public function test_store_rejects_duplicate_role_slug(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->post('/admin/roles', [
                'name' => 'hr', // already exists as a system role
                'label' => 'HR Duplicate',
            ])
            ->assertSessionHasErrors('name');
    }

    public function test_store_rejects_invalid_role_slug(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->post('/admin/roles', [
                'name' => 'Invalid Role Name!',
                'label' => 'Invalid',
            ])
            ->assertSessionHasErrors('name');
    }

    // ── RoleController — update ──────────────────────────────────────────────

    public function test_superadmin_can_update_a_role_label_and_permissions(): void
    {
        $role = Role::create([
            'name' => 'test_role',
            'label' => 'Old Label',
            'is_system' => false,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->put("/admin/roles/{$role->id}", [
                'label' => 'New Label',
                'permissions' => ['content.manage', 'reports.view'],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('roles', ['id' => $role->id, 'label' => 'New Label']);

        $assignedCount = DB::table('role_permissions')
            ->where('role', 'test_role')
            ->count();

        $this->assertEquals(2, $assignedCount);
    }

    // ── RoleController — destroy ─────────────────────────────────────────────

    public function test_superadmin_cannot_delete_a_system_role(): void
    {
        $systemRole = Role::where('name', 'staff')->firstOrFail();

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->delete("/admin/roles/{$systemRole->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('roles', ['id' => $systemRole->id]);
    }

    public function test_superadmin_can_delete_a_custom_role(): void
    {
        $role = Role::create([
            'name' => 'custom_deletable',
            'label' => 'Deletable Role',
            'is_system' => false,
        ]);

        $permId = Permission::where('name', 'content.manage')->value('id');
        DB::table('role_permissions')->insert([
            'role' => 'custom_deletable',
            'permission_id' => $permId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->delete("/admin/roles/{$role->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
        $this->assertEquals(
            0,
            DB::table('role_permissions')->where('role', 'custom_deletable')->count()
        );
    }

    public function test_non_superadmin_cannot_delete_any_role(): void
    {
        $role = Role::create([
            'name' => 'another_role',
            'label' => 'Another',
            'is_system' => false,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'hr']))
            ->delete("/admin/roles/{$role->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('roles', ['id' => $role->id]);
    }

    // ── Audit log ────────────────────────────────────────────────────────────

    public function test_creating_a_role_writes_audit_log(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->post('/admin/roles', [
                'name' => 'audited_role',
                'label' => 'Audited Role',
            ]);

        $this->assertDatabaseHas('rbac_audit_logs', [
            'action' => 'role.created',
            'target_type' => 'role',
            'target_id' => 'audited_role',
        ]);
    }

    public function test_deleting_a_role_writes_audit_log(): void
    {
        $role = Role::create([
            'name' => 'deleted_role',
            'label' => 'To Delete',
            'is_system' => false,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->delete("/admin/roles/{$role->id}");

        $this->assertDatabaseHas('rbac_audit_logs', [
            'action' => 'role.deleted',
            'target_id' => 'deleted_role',
        ]);
    }

    // ── SEC-01: dynamic Finance permissions ──────────────────────────────────

    public function test_custom_finance_role_can_be_granted_finance_admin_via_role_manager(): void
    {
        // Create a brand-new role outside the seeded ['finance', 'ceo',
        // 'superadmin'] set, grant it 'finance.admin', and verify
        // hasPermission() reflects that. Pre-SEC-01 the call sites in
        // PettyCashPolicy / DashboardController / PeriodCloser would have
        // returned false because the inline role arrays had no notion of
        // this new role.
        $role = Role::create([
            'name' => 'finance_lite',
            'label' => 'Finance (read & approve only)',
            'is_system' => false,
        ]);

        $this->actingAs(User::factory()->create(['role' => 'superadmin']))
            ->put("/admin/roles/{$role->id}", [
                'label' => $role->label,
                'permissions' => ['finance.access', 'finance.admin'],
            ])->assertRedirect();

        PermissionService::clearCache();

        $user = User::factory()->create(['role' => 'finance_lite']);
        $this->assertTrue($user->hasPermission('finance.admin'));
        $this->assertTrue($user->hasPermission('finance.access'));
        $this->assertFalse($user->hasPermission('finance.exec'));
    }
}
