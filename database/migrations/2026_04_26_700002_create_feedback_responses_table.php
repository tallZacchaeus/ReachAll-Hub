<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feedback_request_id')->constrained('feedback_requests')->cascadeOnDelete();
            $table->foreignId('respondent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_anonymous')->default(false);
            $table->json('ratings')->nullable();
            $table->text('strengths')->nullable();
            $table->text('improvements')->nullable();
            $table->tinyInteger('overall_rating')->unsigned()->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['feedback_request_id', 'respondent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_responses');
    }
};
