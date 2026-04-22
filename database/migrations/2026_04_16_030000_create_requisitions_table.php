<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requisitions', function (Blueprint $table) {
            $table->id();
            $table->string('request_id', 20)->unique();       // REQ-YYYYMM-NNNN
            $table->foreignId('requester_id')->constrained('users')->restrictOnDelete();
            $table->string('type', 10);                       // OPEX | CAPEX | PETTY | EMERG
            $table->unsignedBigInteger('amount_kobo');
            $table->string('currency', 3)->default('NGN');
            $table->decimal('exchange_rate', 10, 4)->default(1.0);
            $table->foreignId('cost_centre_id')->constrained('cost_centres')->restrictOnDelete();
            $table->foreignId('account_code_id')->constrained('account_codes')->restrictOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->string('urgency', 20)->default('standard'); // standard | urgent | emergency
            $table->text('description');
            $table->json('supporting_docs')->nullable();       // array of storage paths
            $table->string('status', 20)->default('draft');   // draft|submitted|approving|approved|rejected|matched|paid|posted|cancelled
            $table->unsignedBigInteger('tax_vat_kobo')->default(0);
            $table->unsignedBigInteger('tax_wht_kobo')->default(0);
            $table->unsignedBigInteger('total_kobo')->default(0);
            $table->boolean('needs_board_approval')->default(false);
            $table->foreignId('financial_period_id')->nullable()->constrained('financial_periods')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requisitions');
    }
};
