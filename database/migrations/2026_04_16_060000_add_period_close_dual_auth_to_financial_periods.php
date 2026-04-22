<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('financial_periods', function (Blueprint $table) {
            // Dual-authorisation close: first (initiator) + second (co-authoriser)
            $table->foreignId('close_initiated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('close_initiated_at')->nullable();
            $table->foreignId('co_authorized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('co_authorized_at')->nullable();
            // Close report stored path (generated PDF)
            $table->string('close_report_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('financial_periods', function (Blueprint $table) {
            $table->dropColumn([
                'close_initiated_by',
                'close_initiated_at',
                'co_authorized_by',
                'co_authorized_at',
                'close_report_path',
            ]);
        });
    }
};
