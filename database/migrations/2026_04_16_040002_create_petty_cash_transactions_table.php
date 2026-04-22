<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('float_id')->constrained('petty_cash_floats')->cascadeOnDelete();
            $table->unsignedBigInteger('amount_kobo');
            $table->string('type', 20); // expense | replenishment | return
            $table->string('description');
            $table->string('receipt_path'); // required — no expense without receipt
            $table->foreignId('account_code_id')->nullable()->constrained('account_codes')->nullOnDelete();
            $table->date('date');
            $table->string('status', 20)->default('pending_recon'); // pending_recon | reconciled | rejected
            $table->foreignId('reconciliation_id')
                ->nullable()
                ->constrained('petty_cash_reconciliations')
                ->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_transactions');
    }
};
