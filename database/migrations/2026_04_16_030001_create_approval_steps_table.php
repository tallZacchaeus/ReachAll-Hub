<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requisition_id')->constrained('requisitions')->restrictOnDelete();
            $table->foreignId('approver_id')->constrained('users')->restrictOnDelete();
            $table->unsignedTinyInteger('level');             // 1, 2, 3 … (order in chain)
            $table->string('role_label', 50);                 // "Line Manager", "Finance", etc.
            $table->string('status', 20)->default('pending'); // pending | approved | rejected | escalated | skipped
            $table->text('comment')->nullable();
            $table->timestamp('acted_at')->nullable();
            $table->timestamp('sla_deadline')->nullable();
            $table->boolean('reminder_sent')->default(false);
            $table->foreignId('escalated_from_id')->nullable()->constrained('approval_steps')->nullOnDelete();
            $table->timestamps();

            $table->unique(['requisition_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
    }
};
