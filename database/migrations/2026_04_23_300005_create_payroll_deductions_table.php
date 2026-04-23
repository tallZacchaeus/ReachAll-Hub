<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // loan | advance | custom
            $table->string('type', 30)->default('custom');
            $table->string('description', 300);
            // Monthly instalment amount to recover (kobo)
            $table->unsignedBigInteger('monthly_amount_kobo');
            // Remaining balance (kobo) — decremented each payroll run
            $table->unsignedBigInteger('remaining_kobo');
            // active | completed | cancelled
            $table->string('status', 20)->default('active');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_deductions');
    }
};
