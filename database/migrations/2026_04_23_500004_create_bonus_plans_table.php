<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bonus_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('bonus_type', 50)->default('annual')
                  ->comment('annual|performance|spot|referral|retention|signing|other');
            $table->string('period_label', 100)->nullable()->comment('E.g. Q1 2026, FY2026');
            $table->unsignedBigInteger('total_budget_kobo')->default(0);
            $table->string('status', 30)->default('draft')
                  ->comment('draft|active|closed|paid');
            $table->date('payout_date')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bonus_plans');
    }
};
