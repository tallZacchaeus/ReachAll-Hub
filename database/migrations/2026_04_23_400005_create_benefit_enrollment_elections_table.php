<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('benefit_enrollment_elections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_window_id')->constrained('benefit_enrollment_windows')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('benefit_plan_id')->constrained('benefit_plans')->cascadeOnDelete();
            // enroll | waive
            $table->string('election', 10);
            // draft | submitted | approved | rejected
            $table->string('status', 20)->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            // One election per employee per plan per window
            $table->unique(['enrollment_window_id', 'user_id', 'benefit_plan_id']);
            $table->index(['user_id', 'status']);
            $table->index(['enrollment_window_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('benefit_enrollment_elections');
    }
};
