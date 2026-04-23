<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number', 20)->unique(); // ER-2026-0001
            $table->string('type', 30)
                  ->comment('helpdesk|grievance|whistleblower|disciplinary|investigation');
            $table->string('subject', 200);
            $table->text('description');
            $table->string('status', 30)->default('open')
                  ->comment('open|under_review|investigating|pending_action|resolved|closed|dismissed');
            $table->string('priority', 10)->default('normal')
                  ->comment('low|normal|high|urgent');
            $table->boolean('confidential')->default(false);
            // Null = anonymous submission (whistleblower)
            $table->foreignId('reported_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_to_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('outcome')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'status']);
            $table->index('assigned_to_id');
            $table->index('reported_by_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_cases');
    }
};
