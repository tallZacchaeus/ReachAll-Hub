<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Throwable;

/**
 * SEC-03: Audit-log immutability.
 *
 * The Eloquent boot guards on App\Models\AuditLog reject ->update() /
 * ->delete() through the model on every driver. This file additionally
 * verifies that on MySQL/MariaDB the BEFORE UPDATE / BEFORE DELETE
 * triggers installed by 2026_04_27_170636 stop a *raw* DB::table()
 * mutation too — i.e. defence in depth even against tinker / shell
 * scripts that bypass Eloquent.
 *
 * SQLite is deliberately not protected at the DB layer (no triggers
 * attempted) — the model guards remain the enforcement layer there.
 */
class AuditLogImmutabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_eloquent_update_is_rejected_by_model_boot_guard(): void
    {
        $log = $this->makeRow();

        $this->expectException(\LogicException::class);
        $log->update(['action' => 'tampered']);
    }

    public function test_eloquent_delete_is_rejected_by_model_boot_guard(): void
    {
        $log = $this->makeRow();

        $this->expectException(\LogicException::class);
        $log->delete();
    }

    public function test_raw_db_update_is_rejected_by_mysql_trigger(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('Requires MySQL/MariaDB triggers; SQLite enforcement is application-side only.');
        }

        $log = $this->makeRow();

        $threw = false;
        try {
            DB::table('audit_logs')->where('id', $log->id)->update(['action' => 'tampered']);
        } catch (Throwable $e) {
            $threw = true;
            $this->assertInstanceOf(QueryException::class, $e);
            $this->assertStringContainsString('audit_logs are immutable', $e->getMessage());
        }

        $this->assertTrue($threw, 'Raw DB::update on audit_logs should be rejected by the SEC-03 trigger.');
        $this->assertSame('tested.action', AuditLog::find($log->id)->action);
    }

    public function test_raw_db_delete_is_rejected_by_mysql_trigger(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('Requires MySQL/MariaDB triggers; SQLite enforcement is application-side only.');
        }

        $log = $this->makeRow();

        $threw = false;
        try {
            DB::table('audit_logs')->where('id', $log->id)->delete();
        } catch (Throwable $e) {
            $threw = true;
            $this->assertInstanceOf(QueryException::class, $e);
            $this->assertStringContainsString('audit_logs are immutable', $e->getMessage());
        }

        $this->assertTrue($threw, 'Raw DB::delete on audit_logs should be rejected by the SEC-03 trigger.');
        $this->assertNotNull(AuditLog::find($log->id));
    }

    private function makeRow(): AuditLog
    {
        $actor = User::factory()->create(['role' => 'superadmin']);

        return AuditLog::create([
            'actor_id' => $actor->id,
            'module' => 'tests',
            'action' => 'tested.action',
            'subject_type' => null,
            'subject_id' => null,
            'old_json' => null,
            'new_json' => ['probe' => true],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'phpunit',
        ]);
    }
}
