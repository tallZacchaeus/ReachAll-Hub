<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bonus_awards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bonus_plan_id')->constrained('bonus_plans')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('amount_kobo');
            $table->text('rationale')->nullable();
            $table->string('status', 30)->default('draft')
                  ->comment('draft|approved|rejected|paid');
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['bonus_plan_id', 'user_id']);
            $table->index(['bonus_plan_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bonus_awards');
    }
};
