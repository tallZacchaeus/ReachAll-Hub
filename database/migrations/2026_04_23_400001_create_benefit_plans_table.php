<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('benefit_plans', function (Blueprint $table) {
            $table->id();
            // hmo | pension | life_insurance | disability | other
            $table->string('type', 30);
            $table->string('name', 150);
            $table->string('provider', 150)->nullable();
            $table->text('description')->nullable();
            // none | fixed | percentage_of_basic | percentage_of_gross
            $table->string('employee_contribution_type', 30)->default('none');
            // Fixed = kobo/month; percentage = basis points (e.g. 800 = 8.00%)
            $table->unsignedBigInteger('employee_contribution_value')->default(0);
            $table->string('employer_contribution_type', 30)->default('none');
            $table->unsignedBigInteger('employer_contribution_value')->default(0);
            // Whether employees can waive this plan
            $table->boolean('is_waivable')->default(true);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('benefit_plans');
    }
};
