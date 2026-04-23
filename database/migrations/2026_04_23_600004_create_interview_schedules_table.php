<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_application_id')->constrained('job_applications')->cascadeOnDelete();
            $table->foreignId('interviewer_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('scheduled_at');
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->string('format', 30)->default('video')
                  ->comment('video|phone|in_person');
            $table->string('location_or_link', 500)->nullable();
            $table->string('status', 30)->default('scheduled')
                  ->comment('scheduled|completed|cancelled|rescheduled');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['interviewer_id', 'scheduled_at']);
            $table->index(['job_application_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_schedules');
    }
};
