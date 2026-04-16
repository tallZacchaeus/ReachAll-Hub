<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requisition_id')->unique()->constrained('requisitions')->restrictOnDelete();
            $table->unsignedBigInteger('amount_kobo');          // net payable (gross + VAT - WHT)
            $table->string('method', 30);                       // bank_transfer | cheque | cash
            $table->string('reference', 100);
            $table->timestamp('paid_at');
            $table->foreignId('paid_by')->constrained('users')->restrictOnDelete();
            $table->string('proof_path');                       // transfer receipt / cheque scan — NOT nullable
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
