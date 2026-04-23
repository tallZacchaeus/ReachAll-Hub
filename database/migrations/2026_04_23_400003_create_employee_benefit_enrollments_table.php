<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_benefit_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('benefit_plan_id')->constrained('benefit_plans')->cascadeOnDelete();
            // active | pending | waived | terminated
            $table->string('status', 20)->default('pending');
            $table->date('effective_date');
            $table->date('end_date')->nullable();
            // Snapshot of contribution amounts at time of enrollment (kobo)
            $table->unsignedBigInteger('employee_contribution_kobo')->default(0);
            $table->unsignedBigInteger('employer_contribution_kobo')->default(0);
            // Plan member ID assigned by the provider (e.g. HMO card number)
            $table->string('member_id', 100)->nullable();
            $table->foreignId('enrolled_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'benefit_plan_id', 'effective_date']);
            $table->index(['user_id', 'status']);
            $table->index(['benefit_plan_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_benefit_enrollments');
    }
};
