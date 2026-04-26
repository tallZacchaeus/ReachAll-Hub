<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offboarding_checklists', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('initiated_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->date('termination_date')->nullable();
            $table->string('reason', 300)->nullable();

            $table->enum('status', ['initiated', 'in_progress', 'completed'])
                ->default('initiated');

            $table->timestamp('exit_interview_completed_at')->nullable();
            $table->timestamp('clearance_signed_at')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            // One active checklist per employee
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offboarding_checklists');
    }
};
