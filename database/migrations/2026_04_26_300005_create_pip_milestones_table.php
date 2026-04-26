<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pip_milestones', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('pip_plan_id')->constrained('pip_plans')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->date('due_date');
            $table->enum('status', ['pending', 'completed', 'missed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pip_milestones');
    }
};
