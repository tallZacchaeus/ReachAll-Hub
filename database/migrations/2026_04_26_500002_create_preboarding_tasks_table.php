<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preboarding_tasks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('offer_letter_id')
                ->constrained('offer_letters')
                ->cascadeOnDelete();

            // Populated after the candidate's user account is created
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->enum('task_type', [
                'document_upload',
                'policy_ack',
                'equipment_request',
                'it_access',
                'bank_details',
                'compliance_doc',
            ]);

            $table->string('title', 200);
            $table->text('description')->nullable();

            $table->enum('status', ['pending', 'completed', 'waived'])->default('pending');

            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->foreignId('completed_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('offer_letter_id');
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preboarding_tasks');
    }
};
