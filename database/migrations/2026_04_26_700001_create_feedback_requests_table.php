<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('review_cycle_id')->nullable()->constrained('review_cycles')->nullOnDelete();
            $table->enum('type', ['360', 'peer', 'upward', 'downward'])->default('peer');
            $table->text('message')->nullable();
            $table->date('due_date')->nullable();
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();

            $table->index('subject_id');
            $table->index('requester_id');
            $table->index('review_cycle_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_requests');
    }
};
