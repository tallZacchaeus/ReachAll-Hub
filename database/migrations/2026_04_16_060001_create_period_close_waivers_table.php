<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('period_close_waivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financial_period_id')->constrained()->cascadeOnDelete();
            // item_type: unreconciled_float | unpaid_requisition | unposted_payment | variance_item
            $table->string('item_type', 40);
            $table->unsignedBigInteger('item_id')->nullable(); // FK to the related record
            $table->text('reason');
            $table->foreignId('waived_by')->constrained('users');
            $table->timestamp('waived_at');
            $table->timestamps();

            $table->index(['financial_period_id', 'item_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('period_close_waivers');
    }
};
