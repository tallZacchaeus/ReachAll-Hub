<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_run_id')->constrained('payroll_runs')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('employee_salary_id')->nullable()->constrained('employee_salaries')->nullOnDelete();

            // --- Gross components (kobo) ---
            $table->unsignedBigInteger('basic_kobo')->default(0);
            $table->unsignedBigInteger('housing_kobo')->default(0);
            $table->unsignedBigInteger('transport_kobo')->default(0);
            $table->unsignedBigInteger('other_allowances_kobo')->default(0);
            $table->unsignedBigInteger('gross_kobo')->default(0);

            // --- Statutory deductions (kobo) ---
            // PAYE: personal income tax
            $table->unsignedBigInteger('paye_kobo')->default(0);
            // Pension: 8% employee contribution from pensionable pay
            $table->unsignedBigInteger('pension_employee_kobo')->default(0);
            // Pension: 10% employer contribution (cost to org, not deducted from employee)
            $table->unsignedBigInteger('pension_employer_kobo')->default(0);
            // NHF: 2.5% of basic (only if nhf_enrolled)
            $table->unsignedBigInteger('nhf_kobo')->default(0);
            // NSITF: 1% employer contribution (cost to org)
            $table->unsignedBigInteger('nsitf_kobo')->default(0);

            // --- Other deductions (kobo) ---
            // Loan repayments, advance recovery, etc. — summed from payroll_deductions
            $table->unsignedBigInteger('other_deductions_kobo')->default(0);

            // --- Net pay ---
            $table->unsignedBigInteger('net_kobo')->default(0);

            // Reference to payslip PDF stored in hr disk (nullable until generated)
            $table->string('payslip_path', 500)->nullable();
            $table->string('payslip_disk', 30)->nullable();

            // Flag: payslip has been generated and stored
            $table->boolean('payslip_generated')->default(false);

            $table->timestamps();

            $table->unique(['payroll_run_id', 'user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_entries');
    }
};
