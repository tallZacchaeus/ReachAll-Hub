<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('petty_cash_floats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('custodian_id')->unique()->constrained('users')->restrictOnDelete();
            $table->unsignedBigInteger('float_limit_kobo');
            $table->unsignedBigInteger('current_balance_kobo');
            $table->unsignedTinyInteger('low_alert_threshold')->default(30); // percentage
            $table->timestamp('last_reconciled_at')->nullable();
            $table->string('status', 20)->default('active'); // active | suspended
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_floats');
    }
};
