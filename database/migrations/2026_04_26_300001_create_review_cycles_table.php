<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_cycles', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->enum('type', ['annual', 'quarterly', 'mid_year', 'probation']);
            $table->date('period_start');
            $table->date('period_end');
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->text('description')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_cycles');
    }
};
