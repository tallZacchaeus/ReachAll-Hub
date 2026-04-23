<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_salaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('pay_grade_id')->nullable()->constrained('pay_grades')->nullOnDelete();
            // Salary components (kobo/month). Gross = basic + housing + transport + other
            $table->unsignedBigInteger('basic_kobo')->default(0);
            $table->unsignedBigInteger('housing_kobo')->default(0);
            $table->unsignedBigInteger('transport_kobo')->default(0);
            $table->unsignedBigInteger('other_allowances_kobo')->default(0);
            // Statutory opt-ins
            $table->boolean('nhf_enrolled')->default(false);
            // Effective date allows salary history tracking
            $table->date('effective_date');
            $table->date('end_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'effective_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_salaries');
    }
};
