<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * No schema change needed — `role` is a plain string column.
     * This migration documents the new allowed values and adds a
     * finance-specific helper column: `finance_role` for sub-classification
     * if needed in future. For now it's a no-op migration acting as a marker.
     *
     * Allowed roles after this migration:
     * staff | management | hr | finance | general_management | ceo | superadmin
     */
    public function up(): void
    {
        // Role is stored as a plain string — no enum constraint.
        // New values (finance, general_management, ceo) are valid from this point forward.
        // No DDL change required for SQLite.
    }

    public function down(): void
    {
        //
    }
};
