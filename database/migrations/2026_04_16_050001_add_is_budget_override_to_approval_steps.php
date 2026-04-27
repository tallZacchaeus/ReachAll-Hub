<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approval_steps', function (Blueprint $table) {
            // Allow level 99 for auto-created CEO budget override steps
            $table->boolean('is_budget_override')->default(false)->after('escalated_from_id');

            // PROD-01: MySQL/MariaDB refuse to drop the composite unique
            // (requisition_id, level) because the FK on requisition_id depends
            // on having an index that starts with that column. Add a plain
            // non-unique index first, then drop the composite unique.
            $table->index('requisition_id', 'approval_steps_requisition_id_index');

            // Drop the unique constraint so we can have a level-99 override step alongside normal levels
            $table->dropUnique(['requisition_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::table('approval_steps', function (Blueprint $table) {
            $table->dropColumn('is_budget_override');
            $table->unique(['requisition_id', 'level']);
            $table->dropIndex('approval_steps_requisition_id_index');
        });
    }
};
