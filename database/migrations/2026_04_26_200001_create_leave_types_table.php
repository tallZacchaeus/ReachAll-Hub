<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_types', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->unsignedSmallInteger('days_per_year');
            $table->enum('accrual_policy', ['none', 'monthly', 'annual'])->default('annual');
            $table->unsignedSmallInteger('carry_over_days')->default(0);
            $table->unsignedSmallInteger('max_carry_over_days')->default(0);
            $table->boolean('requires_documentation')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
