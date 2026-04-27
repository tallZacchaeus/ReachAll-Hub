<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * SEC-03: DB-level immutability for audit_logs.
 *
 * Pre-SEC-03 the table was only protected by Eloquent boot guards in
 * App\Models\AuditLog::boot() — these reject ->update() / ->delete()
 * through the model, but anyone with raw SQL access (`tinker`,
 * `mysql` shell, a deploy script that uses `DB::table()`) could rewrite
 * or wipe history without the application noticing.
 *
 * This migration installs BEFORE UPDATE / BEFORE DELETE triggers on
 * MySQL/MariaDB so the database itself raises an error. SQLite is
 * deliberately skipped — the app-side boot guards remain the
 * enforcement layer there, and SQLite is only used for local dev / CI.
 *
 * Deploy-time complement (see docs/audits/now-deploy-checklist):
 *   - The application DB user should hold INSERT, SELECT on audit_logs
 *     and nothing else. The triggers are defence-in-depth.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! $this->isMysqlOrMariaDb()) {
            return;
        }

        // Drop first so the migration is idempotent across re-runs.
        DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_no_update');
        DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_no_delete');

        DB::unprepared(<<<'SQL'
CREATE TRIGGER audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'audit_logs are immutable: UPDATE rejected by SEC-03 trigger';
SQL);

        DB::unprepared(<<<'SQL'
CREATE TRIGGER audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'audit_logs are immutable: DELETE rejected by SEC-03 trigger';
SQL);
    }

    public function down(): void
    {
        if (! $this->isMysqlOrMariaDb()) {
            return;
        }

        DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_no_update');
        DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_no_delete');
    }

    private function isMysqlOrMariaDb(): bool
    {
        return Schema::getConnection()->getDriverName() === 'mysql';
    }
};
