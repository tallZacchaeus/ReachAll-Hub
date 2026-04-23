<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id();
            // e.g. "2026-04" — unique per calendar month by default
            $table->string('period_label', 10)->unique();
            $table->date('period_start');
            $table->date('period_end');
            // draft | approved | paid | cancelled
            $table->string('status', 20)->default('draft');
            // Off-cycle flag — if true, period_label is suffixed with "-OCn"
            $table->boolean('is_off_cycle')->default(false);
            // Totals (kobo) — denormalised for fast reporting
            $table->unsignedBigInteger('total_gross_kobo')->default(0);
            $table->unsignedBigInteger('total_paye_kobo')->default(0);
            $table->unsignedBigInteger('total_pension_employee_kobo')->default(0);
            $table->unsignedBigInteger('total_pension_employer_kobo')->default(0);
            $table->unsignedBigInteger('total_nhf_kobo')->default(0);
            $table->unsignedBigInteger('total_nsitf_kobo')->default(0);
            $table->unsignedBigInteger('total_net_kobo')->default(0);
            $table->unsignedInteger('employee_count')->default(0);
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('period_start');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_runs');
    }
};
