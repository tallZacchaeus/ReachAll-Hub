<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_requisitions', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('department', 100)->nullable();
            $table->unsignedTinyInteger('headcount')->default(1);
            $table->string('employment_type', 50)->default('full_time')
                ->comment('full_time|part_time|contract|internship');
            $table->text('justification')->nullable();
            $table->string('priority', 20)->default('normal')
                ->comment('low|normal|high|urgent');
            $table->string('status', 30)->default('draft')
                ->comment('draft|pending|approved|rejected|fulfilled|cancelled');
            $table->foreignId('requested_by_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('job_posting_id')->nullable()->constrained('job_postings')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'department']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_requisitions');
    }
};
