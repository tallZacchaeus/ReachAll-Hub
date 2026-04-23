<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compensation_review_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('cycle_type', 50)->default('annual')
                  ->comment('annual|mid_year|off_cycle|promotion');
            $table->date('review_start_date');
            $table->date('review_end_date');
            $table->date('effective_date')->comment('When approved changes take effect');
            $table->string('status', 30)->default('draft')
                  ->comment('draft|active|review|approved|closed');
            $table->unsignedBigInteger('budget_kobo')->default(0)->comment('Total merit budget');
            $table->unsignedBigInteger('created_by_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('created_by_id')->references('id')->on('users')->nullOnDelete();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compensation_review_cycles');
    }
};
