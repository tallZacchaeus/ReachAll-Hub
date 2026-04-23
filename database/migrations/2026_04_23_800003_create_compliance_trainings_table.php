<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compliance_trainings', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('category', 50)->default('general');
            // data_protection|health_safety|anti_bribery|code_of_conduct|cybersecurity|general
            $table->boolean('is_mandatory')->default(true);
            $table->integer('duration_minutes')->nullable();
            $table->string('content_url', 500)->nullable();
            $table->integer('recurrence_months')->nullable(); // null = one-time; 12 = annual
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('compliance_training_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_id')->constrained('compliance_trainings')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('due_at');
            $table->timestamp('completed_at')->nullable();
            $table->string('status', 20)->default('pending'); // pending|completed|overdue|waived
            $table->text('completion_notes')->nullable();
            $table->unique(['training_id', 'user_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compliance_training_assignments');
        Schema::dropIfExists('compliance_trainings');
    }
};
