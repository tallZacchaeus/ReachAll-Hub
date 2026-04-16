<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CAT10-02: Add FIRS Tax Identification Number (TIN) field to vendors.
 *
 * FIRS TIN is a 14-character alphanumeric identifier required for
 * WHT schedule reporting. Separate from the generic tax_id field.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->string('tin', 14)->nullable()->after('name');
            $table->index('tin');
        });
    }

    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropIndex(['tin']);
            $table->dropColumn('tin');
        });
    }
};
