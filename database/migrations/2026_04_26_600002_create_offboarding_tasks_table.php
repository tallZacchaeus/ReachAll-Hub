<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offboarding_tasks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('offboarding_checklist_id')
                ->constrained('offboarding_checklists')
                ->cascadeOnDelete();

            $table->enum('task_type', [
                'exit_interview',
                'equipment_return',
                'access_revocation',
                'final_payroll',
                'document_handover',
                'clearance_form',
                'hr_clearance',
                'finance_clearance',
            ]);

            $table->string('title', 200);
            $table->text('description')->nullable();

            $table->foreignId('assigned_to_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->enum('status', ['pending', 'completed', 'waived'])->default('pending');

            $table->timestamp('completed_at')->nullable();

            $table->foreignId('completed_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index('offboarding_checklist_id');
            $table->index(['offboarding_checklist_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offboarding_tasks');
    }
};
