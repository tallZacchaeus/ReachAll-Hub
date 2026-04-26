<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add payroll / statutory identification fields to users.
     *
     * IMPORTANT: bank_account_number and bvn are stored encrypted using
     * Laravel's 'encrypted' cast (AES-256-CBC via APP_KEY).
     * Ensure APP_KEY is set and stable before migrating in production — if the
     * key is rotated you will need to re-encrypt these columns.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Nigerian Tax Identification Number
            $table->string('tin', 20)->nullable()->after('nin');

            // Payroll bank details
            $table->string('bank_name', 100)->nullable()->after('tin');
            // Stored encrypted — never read from raw SQL; always use Eloquent
            $table->string('bank_account_number', 100)->nullable()->after('bank_name');
            $table->string('bank_sort_code', 20)->nullable()->after('bank_account_number');

            // Bank Verification Number (Nigeria) — stored encrypted
            $table->string('bvn', 100)->nullable()->after('bank_sort_code');

            // Pension
            $table->string('pension_fund_admin', 100)->nullable()->after('bvn');
            $table->string('pension_account_number', 50)->nullable()->after('pension_fund_admin');

            // National Housing Fund
            $table->string('nhf_number', 50)->nullable()->after('pension_account_number');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'tin',
                'bank_name',
                'bank_account_number',
                'bank_sort_code',
                'bvn',
                'pension_fund_admin',
                'pension_account_number',
                'nhf_number',
            ]);
        });
    }
};
