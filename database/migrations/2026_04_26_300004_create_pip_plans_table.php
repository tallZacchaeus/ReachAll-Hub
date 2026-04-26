<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pip_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('initiated_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('performance_review_id')->nullable()->constrained('performance_reviews')->nullOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['draft', 'active', 'completed', 'failed', 'cancelled'])->default('draft');
            $table->text('outcome')->nullable();
            $table->date('outcome_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pip_plans');
    }
};
