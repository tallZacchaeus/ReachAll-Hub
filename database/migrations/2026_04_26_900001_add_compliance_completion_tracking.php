<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the unique constraint on compliance_training_assignments so that
        // recurring trainings can produce multiple assignment rows (one per cycle)
        // for the same training+user pair.
        Schema::table('compliance_training_assignments', function (Blueprint $table) {
            // PROD-01: MySQL/MariaDB refuse to drop the composite unique
            // (training_id, user_id) because the FK on training_id depends on
            // having an index that starts with that column. Add a plain
            // non-unique index first, then drop the composite unique.
            $table->index('training_id', 'cta_training_id_index');
            $table->dropUnique(['training_id', 'user_id']);
            $table->timestamp('last_reminded_at')->nullable()->after('status');
            $table->unsignedSmallInteger('reminder_count')->default(0)->after('last_reminded_at');
        });

        Schema::table('compliance_policy_acknowledgements', function (Blueprint $table) {
            // Allow null so reminder placeholder records can be inserted before the employee acknowledges.
            $table->timestamp('acknowledged_at')->nullable()->change();
            $table->timestamp('reminded_at')->nullable()->after('acknowledged_at');
        });
    }

    public function down(): void
    {
        Schema::table('compliance_policy_acknowledgements', function (Blueprint $table) {
            $table->dropColumn('reminded_at');
            $table->timestamp('acknowledged_at')->nullable(false)->change();
        });

        Schema::table('compliance_training_assignments', function (Blueprint $table) {
            $table->dropColumn(['last_reminded_at', 'reminder_count']);
            $table->unique(['training_id', 'user_id']);
            $table->dropIndex('cta_training_id_index');
        });
    }
};
