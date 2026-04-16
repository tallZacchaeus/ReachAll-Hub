<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requisition_id')->constrained('requisitions')->restrictOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->unsignedBigInteger('amount_kobo');
            $table->date('received_at');
            $table->string('file_path');                             // receipt scan — NOT nullable
            $table->string('match_status', 20)->default('pending'); // pending|matched|variance|blocked
            $table->bigInteger('variance_kobo')->default(0);        // signed: positive = invoice > req
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('requisition_id');
            $table->index('match_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
