<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wht_liabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requisition_id')->constrained('requisitions')->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->unsignedBigInteger('amount_kobo');     // WHT amount withheld
            $table->unsignedTinyInteger('rate_percent');   // 5 or 10
            $table->string('status', 20)->default('pending'); // pending | remitted
            $table->foreignId('financial_period_id')->nullable()->constrained('financial_periods')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'vendor_id']);
            $table->index('financial_period_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wht_liabilities');
    }
};
