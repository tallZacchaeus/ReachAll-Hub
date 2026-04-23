<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('hr_documents')->cascadeOnDelete();
            $table->foreignId('signee_id')->constrained('users')->cascadeOnDelete();
            // pending | signed | declined
            $table->string('status', 20)->default('pending');
            $table->timestamp('signed_at')->nullable();
            $table->timestamp('declined_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->text('decline_reason')->nullable();
            // Immutable — no updated_at
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['document_id', 'signee_id']);
            $table->index(['signee_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_signatures');
    }
};
