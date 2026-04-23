<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compensation_review_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained('compensation_review_cycles')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('current_salary_kobo')->default(0);
            $table->unsignedBigInteger('proposed_salary_kobo')->nullable();
            $table->integer('merit_basis_points')->default(0)
                  ->comment('Increase as basis points, e.g. 500 = 5.00%');
            $table->string('recommendation', 30)->nullable()
                  ->comment('increase|no_change|decrease|promotion|offcycle');
            $table->text('rationale')->nullable();
            $table->string('status', 30)->default('pending')
                  ->comment('pending|submitted|approved|rejected');
            $table->foreignId('reviewed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->unique(['cycle_id', 'user_id']);
            $table->index(['cycle_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compensation_review_entries');
    }
};
