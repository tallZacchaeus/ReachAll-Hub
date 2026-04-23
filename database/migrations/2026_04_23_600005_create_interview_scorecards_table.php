<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_scorecards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('interview_schedule_id')->constrained('interview_schedules')->cascadeOnDelete();
            $table->foreignId('evaluator_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('overall_rating')->comment('1-5');
            $table->unsignedTinyInteger('technical_rating')->nullable()->comment('1-5');
            $table->unsignedTinyInteger('communication_rating')->nullable()->comment('1-5');
            $table->unsignedTinyInteger('culture_fit_rating')->nullable()->comment('1-5');
            $table->text('strengths')->nullable();
            $table->text('concerns')->nullable();
            $table->string('recommendation', 30)
                  ->comment('strong_yes|yes|no|strong_no');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['interview_schedule_id', 'evaluator_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_scorecards');
    }
};
