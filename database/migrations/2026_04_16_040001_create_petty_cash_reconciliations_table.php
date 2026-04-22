<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('float_id')->constrained('petty_cash_floats')->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->foreignId('submitted_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('submitted'); // submitted | approved | rejected
            $table->unsignedBigInteger('total_expenses_kobo')->default(0);
            $table->bigInteger('variance_kobo')->default(0);
            $table->foreignId('replenishment_requisition_id')->nullable()->constrained('requisitions')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_reconciliations');
    }
};
