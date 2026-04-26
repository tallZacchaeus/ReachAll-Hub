<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            // External candidate (nullable — internal apps use user_id)
            $table->foreignId('candidate_id')->nullable()->after('user_id')
                ->constrained('candidates')->nullOnDelete();

            // ATS pipeline stage
            $table->string('stage', 30)->default('new')->after('status')
                ->comment('new|screening|interview|offer|hired|rejected|withdrawn');

            // HR notes on this application
            $table->text('ats_notes')->nullable()->after('stage');

            // Lifecycle timestamps
            $table->timestamp('hired_at')->nullable();
            $table->timestamp('rejected_at')->nullable();

            $table->index(['job_posting_id', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropForeign(['candidate_id']);
            $table->dropColumn(['candidate_id', 'stage', 'ats_notes', 'hired_at', 'rejected_at']);
        });
    }
};
