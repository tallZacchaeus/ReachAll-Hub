<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('review_cycle_id')->constrained('review_cycles')->cascadeOnDelete();
            $table->foreignId('reviewee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['self', 'manager', 'peer']);
            $table->enum('status', ['pending', 'in_progress', 'submitted', 'acknowledged'])->default('pending');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->tinyInteger('overall_rating')->unsigned()->nullable();
            $table->json('ratings')->nullable();
            $table->text('strengths')->nullable();
            $table->text('improvements')->nullable();
            $table->text('comments')->nullable();
            $table->timestamps();

            $table->unique(['review_cycle_id', 'reviewee_id', 'reviewer_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_reviews');
    }
};
